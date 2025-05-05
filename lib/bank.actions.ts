// lib/bank.actions.ts
import { BankData, BudgetData, Transaction } from '@/types';
import dayjs from 'dayjs';
import { createGoCardlessClient } from '@/lib/gocardless';
import { createAdminClient } from '@/lib/appwrite';
import { getLoggedInUser } from '@/lib/user.actions';
import { ID, Query } from 'node-appwrite';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { pushTransactionsDB } from '@/lib/db.actions';
import Fuse from 'fuse.js';
import { shouldSyncNow, recordSync, getTimeUntilNextSync } from './sync-scheduler';

dayjs.extend(weekOfYear);

// New function to get cached balances directly from Appwrite without touching GoCardless
export const getCachedBalancesFromAppwrite = async (): Promise<BankData[]> => {
    try {
        const { database } = await createAdminClient();
        const requisitionData = await getRequisitions();
        
        if (!requisitionData.length) {
            return [];
        }
        
        const BALANCE_CACHE_COLLECTION_ID = process.env.APPWRITE_BALANCE_CACHE_COLLECTION_ID || 'balance_cache';
        
        // Get the latest cached balance for each requisition
        const bankDataPromises = requisitionData.map(async ({ requisitionId, bankName, bankLogo, reqCreated }) => {
            try {
                const cachedData = await database.listDocuments(
                    process.env.APPWRITE_DATABASE_ID!,
                    BALANCE_CACHE_COLLECTION_ID,
                    [
                        Query.equal('requisitionId', requisitionId),
                        Query.orderDesc('$createdAt'),
                        Query.limit(1)
                    ]
                );
                
                if (cachedData.documents.length === 0) {
                    return null;
                }
                
                // Handle both string and object formats
                let balances;
                if (typeof cachedData.documents[0].balances === 'string') {
                    balances = JSON.parse(cachedData.documents[0].balances);
                } else {
                    balances = cachedData.documents[0].balances;
                }
                
                return { 
                    requisitionId, 
                    bankName, 
                    bankLogo, 
                    balances, 
                    reqCreated 
                };
            } catch (error) {
                console.error(`Error getting cached balances for requisition ${requisitionId}:`, error);
                return null;
            }
        });
        
        const results = await Promise.all(bankDataPromises);
        return results.filter(result => result !== null) as BankData[];
    } catch (error) {
        console.error('Error in getCachedBalancesFromAppwrite:', error);
        return [];
    }
};

// Retrieve requisitionIds for a given user from Appwrite
export const getRequisitions = async () => {
    const { database } = await createAdminClient();
    const user = await getLoggedInUser();
    const userId = user.$id;

    try {
        const query = await database.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_REQ_COLLECTION_ID!,
          [Query.equal('userId', userId)]
        );

        const reqData = query.documents.map((document: any) => ({
            requisitionId: document.requisitionId,
            bankName: document.bankName,
            bankLogo: document.bankLogo,
            reqCreated: document.$createdAt
        }));
        return reqData;
    } catch (error) {
        console.error('Error getting requisitions:', error);
        return [];
    }
};

// Retrieve accountIds for a given array of requisitionIds from GC
export const getAccounts = async ({ requisitionIds }: { requisitionIds: string[] }) => {
    const client = await createGoCardlessClient();
    let allAccounts = [];

    try {
        await client.generateToken();

        const accountPromises = requisitionIds.map(async (requisitionId) => {
            const requisitionData = await client.requisition.getRequisitionById(requisitionId);
            return requisitionData.accounts;
        });

        const accountsArrays = await Promise.all(accountPromises);
        allAccounts = accountsArrays.flat(); // Flatten the arrays

        return allAccounts;
    } catch (error) {
        console.error('Error getting accounts:', error);
        return null;
    }
};

// Retrieve balances for all accounts associated with the given requisitionIds - respecting sync schedule
export const getBalances = async ({ requisitionIds }: { requisitionIds: string[] }) => {
    // Check if we should sync with GoCardless now
    const shouldSync = await shouldSyncNow('balances');
    
    if (!shouldSync) {
        console.log('Skipping GoCardless balance sync - using cached data from Appwrite');
        // Return balances from Appwrite instead
        return await getCachedBalances(requisitionIds);
    }
    
    console.log('Syncing balances with GoCardless');
    const client = await createGoCardlessClient();
    let result: { [key: string]: { amount: string, currency: string } } = {};

    await client.generateToken();

    try {
        const accounts = await getAccounts({ requisitionIds });

        if (!accounts) {
            console.error('No accounts found for the provided requisition ID');
        } else {
            const balancePromises = accounts.map(async (accountId) => {
                let account = client.account(accountId);
                let balances = await account.getBalances();
                let balanceAmount = balances.balances[0].balanceAmount;
                return { accountId, amount: balanceAmount.amount, currency: balanceAmount.currency };
            });

            const balances = await Promise.all(balancePromises);

            balances.forEach(({ accountId, amount, currency }) => {
                result[accountId] = { amount, currency };
            });
            
            // Cache the balances in Appwrite
            await cacheBalances(requisitionIds[0], result);
            
            // Record this sync operation
            await recordSync('balances');

            return Object.fromEntries(Object.entries(result).sort(
              ([, a], [, b]) => parseFloat(b.amount) - parseFloat(a.amount)
            ));
        }
    } catch (error) {
        console.error('Error getting balances:', error);
        // Fall back to cached balances in case of an error
        return await getCachedBalances(requisitionIds);
    }
};

// Get cached balances from Appwrite
async function getCachedBalances(requisitionIds: string[]): Promise<{ [key: string]: { amount: string, currency: string } } | null> {
    const { database } = await createAdminClient();
    const BALANCE_CACHE_COLLECTION_ID = process.env.APPWRITE_BALANCE_CACHE_COLLECTION_ID || 'balance_cache';
    
    try {
        // If DATABASE_ID is missing, we can't proceed
        if (!process.env.APPWRITE_DATABASE_ID) {
            console.warn('DATABASE_ID not set, returning null for cached balances');
            return null;
        }
        
        const results: { [key: string]: { amount: string, currency: string } } = {};
        
        for (const requisitionId of requisitionIds) {
            try {
                const cachedData = await database.listDocuments(
                    process.env.APPWRITE_DATABASE_ID,
                    BALANCE_CACHE_COLLECTION_ID,
                    [
                        Query.equal('requisitionId', requisitionId),
                        Query.orderDesc('$createdAt'),
                        Query.limit(1)
                    ]
                );
                
                if (cachedData.documents.length > 0) {
                    // Handle both string format (from setup) and object format
                    const balances = typeof cachedData.documents[0].balances === 'string'
                        ? JSON.parse(cachedData.documents[0].balances)
                        : cachedData.documents[0].balances;
                    
                    Object.assign(results, balances);
                }
            } catch (error) {
                console.error(`Error getting cached balances for requisitionId ${requisitionId}:`, error);
                // Continue with other requisitionIds despite this error
            }
        }
        
        if (Object.keys(results).length === 0) {
            return null;
        }
        
        return results;
    } catch (error) {
        console.error('Error getting cached balances:', error);
        return null;
    }
}

// Cache balances in Appwrite
async function cacheBalances(requisitionId: string, balances: { [key: string]: { amount: string, currency: string } }): Promise<void> {
    const { database } = await createAdminClient();
    const BALANCE_CACHE_COLLECTION_ID = process.env.APPWRITE_BALANCE_CACHE_COLLECTION_ID || 'balance_cache';
    
    try {
        // If DATABASE_ID is missing, we can't proceed
        if (!process.env.APPWRITE_DATABASE_ID) {
            console.warn('DATABASE_ID not set, cannot cache balances');
            return;
        }
        
        // Convert balances to string if needed to ensure it gets stored properly
        const balancesToStore = typeof balances === 'string' ? balances : JSON.stringify(balances);
        
        await database.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            BALANCE_CACHE_COLLECTION_ID,
            ID.unique(),
            {
                requisitionId,
                balances: balancesToStore,
                timestamp: new Date().toISOString()
            }
        );
        
        console.log(`Balances for requisition ${requisitionId} cached successfully`);
    } catch (error) {
        console.error('Error caching balances:', error);
    }
}

// Fetch and return bank data including balances for all requisitions
export const getBankData = async (): Promise<BankData[]> => {
    const requisitionData = await getRequisitions();

    if (!requisitionData.length) {
        return [];
    }

    const bankDataPromises = requisitionData.map(async ({ requisitionId, bankName, bankLogo, reqCreated }) => {
        const balances = await getBalances({ requisitionIds: [requisitionId] }) || {};
        return { requisitionId, bankName, bankLogo, balances, reqCreated };
    });

    return await Promise.all(bankDataPromises);
};

export const getBudgetData = async (): Promise<BudgetData[]> => {
    const user = await getLoggedInUser();
    const userId = user?.$id;

    if (userId) {
        try {
            const { database } = await createAdminClient();
            const query = await database.listDocuments(
              process.env.APPWRITE_DATABASE_ID!,
              process.env.APPWRITE_BUDGET_COLLECTION_ID!,
              [Query.equal('userId', userId)]
            );

            if (query.documents.length === 0) {
                // No budget exists, create a default one
                const defaultBudget = {
                    userId,
                    Groceries: 0,
                    Restaurant: 0,
                    Shopping: 0,
                    Travel: 0,
                    Transfers: 0,
                    Health: 0,
                    Entertainment: 0,
                    Subscriptions: 0,
                    Income: 0,
                    Other: 0,
                    Finance: 0
                };
                await database.createDocument(
                  process.env.APPWRITE_DATABASE_ID!,
                  process.env.APPWRITE_BUDGET_COLLECTION_ID!,
                  ID.unique(),
                  defaultBudget
                );
                return [defaultBudget];
            }

            return query.documents.map((document: any) => ({
                userId: document.userId,
                Groceries: document.Groceries,
                Restaurant: document.Restaurant,
                Shopping: document.Shopping,
                Travel: document.Travel,
                Transfers: document.Transfers,
                Health: document.Health,
                Entertainment: document.Entertainment,
                Subscriptions: document.Subscriptions,
                Income: document.Income,
                Other: document.Other,
                Finance: document.Finance
            }));

        } catch (error) {
            console.error('Error getting or creating budgets:', error);
            return [];
        }
    } else {
        return [];
    }
};

// Sync-aware version of getGCTransactions
export const getGCTransactions = async ({ requisitionIds, bankNames, dateFrom, dateTo, forceSync = false }: 
    { requisitionIds: string[], bankNames?: string[], dateFrom?: string, dateTo?: string, forceSync?: boolean }): Promise<Transaction[]> => {
    
    // Check if we should sync with GoCardless now - unless forceSync is true
    if (!forceSync) {
        const shouldSync = await shouldSyncNow('transactions');
        if (!shouldSync) {
            console.log('Skipping GoCardless transaction sync - using data from Appwrite');
            // Instead of calling GoCardless, just get transactions from Appwrite
            const allTransactions: Transaction[] = [];
            for (const requisitionId of requisitionIds) {
                try {
                    const { database } = await createAdminClient();
                    const transactions = await database.listDocuments(
                        process.env.APPWRITE_DATABASE_ID!,
                        process.env.APPWRITE_TRANSACTION_COLLECTION_ID!,
                        [
                            Query.equal('requisitionId', requisitionId),
                            Query.orderDesc('bookingDate'),
                            Query.limit(5000)
                        ]
                    );
                    allTransactions.push(...transactions.documents as unknown as Transaction[]);
                } catch (error) {
                    console.error(`Error fetching cached transactions for requisition ID ${requisitionId}:`, error);
                }
            }
            return allTransactions;
        }
    }
    
    // Check if we have a rate limit marker for today (persisted in Appwrite)
    const isRateLimited = await checkRateLimitState();
    if (isRateLimited) {
        console.log('GoCardless API is currently rate limited. Using cached data only.');
        // Return transactions from Appwrite instead
        const allTransactions: Transaction[] = [];
        for (const requisitionId of requisitionIds) {
            try {
                const transactions = await pullCachedTransactions(requisitionId);
                allTransactions.push(...transactions);
            } catch (error) {
                console.error(`Error fetching cached transactions during rate limit for requisition ID ${requisitionId}:`, error);
            }
        }
        return allTransactions;
    }
    
    console.log(`getGCTransactions LOG: Fetching transactions from GoCardless for ${requisitionIds} requisition IDs`);
    const client = await createGoCardlessClient();
    let allTransactions: Transaction[] = [];

    dateTo = dateTo || dayjs().format("YYYY-MM-DD");
    
    try {
        await client.generateToken();
    } catch (error) {
        console.error('Error generating GoCardless token:', error);
        // Return cached data if we can't even generate a token
        return await fallbackToCachedTransactions(requisitionIds);
    }

    for (let i = 0; i < requisitionIds.length; i++) {
        const requisitionId = requisitionIds[i];
        const bankName = bankNames ? bankNames[i] : undefined;
        try {
            console.log(`Fetching transactions for requisition ID ${requisitionId} and bank ${bankName}`);
            let accounts;
            
            try {
                accounts = await getAccounts({ requisitionIds: [requisitionId] });
            } catch (error) {
                console.error(`Error fetching accounts for requisition ID ${requisitionId}:`, error);
                // If we can't get accounts, try the next requisition
                continue;
            }

            if (!accounts || accounts.length === 0) {
                console.error(`No accounts found for requisition ID ${requisitionId}`);
                continue; // Continue with the next requisitionId
            }

            if (!dateFrom) {
                dateFrom = await checkLatestTransaction(requisitionId);
            }

            const accountTransactionsPromises = accounts.map(async (accountId) => {
                try {
                    const account = client.account(accountId);
                    const transactionResponse = await account.getTransactions({ dateFrom, dateTo });
                    return transactionResponse.transactions.booked.concat(transactionResponse.transactions.pending || []);
                } catch (error: any) {
                    // Check if this is a rate limit error
                    if (error?.response?.status === 429) {
                        const resetTime = error?.response?.headers?.['http_x_ratelimit_account_success_reset'];
                        const resetSeconds = parseInt(resetTime, 10) || 86400; // Default to 24h if no header
                        
                        // Record the rate limit with the exact reset time
                        await recordRateLimit(resetSeconds);
                        
                        console.warn(`Rate limit hit for requisition ${requisitionId}. Will retry after ${new Date(Date.now() + resetSeconds * 1000).toLocaleString()}`);
                        
                        // Get cached transactions from DB for this requisition as fallback
                        const cachedTransactions = await pullCachedTransactions(requisitionId);
                        allTransactions.push(...cachedTransactions);
                        console.log(`Using ${cachedTransactions.length} cached transactions as fallback for ${requisitionId}`);
                        
                        // Skip remaining requisitions to avoid more rate limit hits
                        return allTransactions;
                    } else {
                        console.error(`Error fetching transactions for account ${accountId}:`, error);
                        return [];
                    }
                }
            });

            try {
                const accountTransactions = await Promise.all(accountTransactionsPromises);
                const flattenedTransactions = accountTransactions.flat();
                
                // Only process if we got any transactions
                if (flattenedTransactions.length > 0) {
                    const correctedTransactions = await applyDataCorrections(flattenedTransactions, bankName);
                    allTransactions.push(...correctedTransactions);
    
                    console.log(`Pushing ${correctedTransactions.length} transactions for ${requisitionId} for ${bankName} to the database`);
                    // Push each transaction to the database
                    for (let transaction of correctedTransactions) {
                        await pushTransactionsDB(transaction, requisitionId);
                    }
    
                    console.log(`Transactions for ${requisitionId} written to the database`);
                } else {
                    console.log(`No new transactions found for ${requisitionId}`);
                }
            } catch (error) {
                console.error(`Error processing transactions for requisition ID ${requisitionId}:`, error);
            }
        } catch (error: any) {
            // Check if this entire requisition hit a rate limit
            if (error?.response?.status === 429) {
                const resetTime = error?.response?.headers?.['http_x_ratelimit_account_success_reset'];
                const resetSeconds = parseInt(resetTime, 10) || 86400; // Default to 24h if no header
                
                // Record the rate limit
                await recordRateLimit(resetSeconds);
                
                console.error(`Rate limit hit for requisition ${requisitionId}. Reset in ${resetSeconds} seconds.`);
                
                // Get cached transactions for this requisition
                const cachedTransactions = await pullCachedTransactions(requisitionId);
                allTransactions.push(...cachedTransactions);
                
                // Skip remaining requisitions to avoid more rate limit hits
                break;
            } else {
                console.error(`Error fetching transactions for requisition ID ${requisitionId}:`, error);
            }
        }
    }

    // Record this sync operation if it was successful and not forced
    if (allTransactions.length > 0 && !forceSync) {
        await recordSync('transactions');
    }

    return allTransactions;
};

// Check the latest transaction date for a given requisitionId
const checkLatestTransaction = async (requisitionId: string): Promise<string> => {
    console.log('Checking latest transaction date');
    const { database } = await createAdminClient();

    try {
        const query = await database.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_TRANSACTION_COLLECTION_ID!,
          [
              Query.equal('requisitionId', requisitionId),
              Query.orderDesc('bookingDate'),
              Query.limit(1)
          ]
        );

        if (query.documents.length === 0) {
            return "2023-01-01";
        }

        const latestTransaction = query.documents[0].bookingDate;
        console.log(`Latest transaction date for requisition ID ${requisitionId}: ${latestTransaction}`);
        return latestTransaction;
    } catch (error) {
        console.error('Error checking latest transaction:', error);
        return "2023-01-01";
    }
};

const applyDataCorrections = async (transactions: Transaction[], bankName?: string): Promise<Transaction[]> => {
    console.log(`Applying data corrections to ${transactions.length} transactions for ${bankName}`);

    if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new Error("transactions must be a non-empty array");
    }

    transactions.forEach(transaction => {
        if (!transaction.transactionAmount || !transaction.bookingDate) {
            throw new Error("transactionAmount and bookingDate are required fields");
        }
    });

    const wordsToRemove = [
        "Savings vault", "Flexible profile", "Vault", "To EUR", "To USD", "Exchanged", "Income Sorter",
        "Weekly Rule", "Monthly Rule", "From Main", "To Main", "From Personal", "To Personal", "Flexible Account",
        "Balance migration", "EUR Subscriptions", "Savings", "To EUR Subscriptions", "Savings", "Flexible Cash",
    ];

    const wordsToRemoveStr = new RegExp(wordsToRemove.join('|'), 'i');

    const knownPayees = [
        'Spotify', 'Apple', 'Google'
    ];

    const fuse = new Fuse(knownPayees, {
        includeScore: true,
        threshold: 0.3
    });

    const correctedTransactions: Transaction[] = [];

    for (const transaction of transactions) {
        const {
            transactionAmount,
            bookingDate,
            creditorName,
            debtorName,
            creditorAccount,
            debtorAccount,
            remittanceInformationUnstructuredArray
        } = transaction;

        const amount = parseFloat(transactionAmount.amount);
        const currency = transactionAmount.currency;

        let bookingDateObj = dayjs(bookingDate);
        dayjs.extend(require('dayjs/plugin/weekOfYear'));
        const year = bookingDateObj.year();
        const month = bookingDateObj.month() + 1;
        const week = bookingDateObj.week();
        const day = bookingDateObj.date();
        const dayOfWeek = bookingDateObj.day();

        const firstColumn = creditorName ?? debtorName ?? '';
        const secondColumn = creditorAccount ?? debtorAccount ?? '';
        const remittanceInfo = remittanceInformationUnstructuredArray?.join(' ') ?? '';

        let payee = firstColumn || secondColumn || remittanceInfo;
        if (!payee) {
            payee = "Unknown";
        }

        if (typeof payee === 'string') {
            payee = payee.replace(/\b(\w+)\s+\1\b/g, '$1');
            payee = payee.replace(/\.com/g, '');
            payee = payee.replace(/\s+/g, ' ').trim();
            payee = payee.replace(/[^a-zA-Z ]/g, ' ').toLowerCase();
            payee = payee.replace(/combill/g, '');

            payee = payee.replace(/\b\w/g, (char) => char.toUpperCase());

            const result = fuse.search(payee);
            if (result.length > 0 && result[0].score! < 0.3) {
                payee = result[0].item;
            }
        } else {
            continue;
        }

        let category = await getCategory(payee);

        const containsWordsToRemove = wordsToRemoveStr.test(payee);
        const containsWordsToRemoveFirstColumn = wordsToRemoveStr.test(firstColumn);
        const containsWordsToRemoveRemittanceInfo = wordsToRemoveStr.test(remittanceInfo);

        if (!bankName) {
            bankName = "YourBankName";
        } else {
            bankName = bankName.replace(/_/g, ' ').replace(/-/g, ' ');
            bankName = bankName.split(' ')[0];
        }

        if (!containsWordsToRemove && !containsWordsToRemoveFirstColumn && !containsWordsToRemoveRemittanceInfo) {
            const correctedTransaction: Transaction = {
                ...transaction,
                amount: amount,
                currency: currency,
                bookingDate: bookingDateObj.format("YYYY-MM-DD"),
                Year: year,
                Month: month,
                Week: week,
                Day: day,
                DayOfWeek: dayOfWeek,
                Payee: payee,
                Bank: bankName,
                Description: remittanceInfo,
                category: category
            };
            correctedTransactions.push(correctedTransaction);
        }
    }

    correctedTransactions.sort((a, b) => dayjs(b.bookingDate).unix() - dayjs(a.bookingDate).unix());

    return correctedTransactions;
};

const getCategory = async (payee: string): Promise<string> => {
    try {
        const { database } = await createAdminClient();

        const query = await database.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_TRANSACTION_COLLECTION_ID!,
          [Query.contains('Payee', payee)]
        );

        if (query.documents.length > 0) {
            return query.documents[0].category;
        }
    } catch (error) {
        console.error('Payee not found:', error);
    }

    const category_url = 'https://appwrite-render.onrender.com/predict';

    try {
        const response = await fetch(category_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Payee: payee,
            })
        });

        const data = await response.json();
        return data.category;
    } catch (error) {
        return "Uncategorized";
    }
};

export const createAccountBalanceBreakdown = async (bankData: BankData[], currency: string) => {
    const accountBalances = bankData.map(({ bankName, balances }) => {
        const totalBalance = Object.values(balances).reduce((acc, { amount, currency }) => {
            if (currency === currency) {
                return acc + parseFloat(amount);
            }
            return acc;
        }, 0);

        return { bankName, totalBalance };
    });
};

export const getSyncStatus = async (): Promise<{ 
    transactions: { canSyncNow: boolean, timeUntilNextSync: number },
    balances: { canSyncNow: boolean, timeUntilNextSync: number } 
}> => {
    const transactionsCanSync = await shouldSyncNow('transactions');
    const balancesCanSync = await shouldSyncNow('balances');
    
    const transactionsTimeUntilNextSync = await getTimeUntilNextSync('transactions');
    const balancesTimeUntilNextSync = await getTimeUntilNextSync('balances');
    
    return {
        transactions: {
            canSyncNow: transactionsCanSync,
            timeUntilNextSync: transactionsTimeUntilNextSync
        },
        balances: {
            canSyncNow: balancesCanSync,
            timeUntilNextSync: balancesTimeUntilNextSync
        }
    };
};

// Helper function to check if we're currently rate limited
async function checkRateLimitState(): Promise<boolean> {
    try {
        const { database } = await createAdminClient();
        const rateLimitCollection = process.env.APPWRITE_RATE_LIMIT_COLLECTION_ID || 'rate_limits';
        
        const query = await database.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            rateLimitCollection,
            [
                Query.equal('service', 'gocardless'),
                Query.greaterThan('expiresAt', new Date().toISOString())
            ]
        );
        
        if (query.documents.length > 0) {
            const expiryTime = new Date(query.documents[0].expiresAt).getTime();
            const now = new Date().getTime();
            const remainingSeconds = Math.round((expiryTime - now) / 1000);
            
            console.log(`GoCardless is rate limited for another ${remainingSeconds} seconds`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking rate limit state:', error);
        // If we can't check, assume we're not rate limited
        return false;
    }
}

// Helper function to record a rate limit hit
async function recordRateLimit(resetSeconds: number): Promise<void> {
    try {
        const { database } = await createAdminClient();
        const rateLimitCollection = process.env.APPWRITE_RATE_LIMIT_COLLECTION_ID || 'rate_limits';
        
        // Calculate when the rate limit expires
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + resetSeconds);
        
        await database.createDocument(
            process.env.APPWRITE_DATABASE_ID!,
            rateLimitCollection,
            ID.unique(),
            {
                service: 'gocardless',
                hitAt: new Date().toISOString(),
                expiresAt: expiryDate.toISOString(),
                resetSeconds: resetSeconds
            }
        );
        
        console.log(`Recorded rate limit for GoCardless. Expires in ${resetSeconds} seconds.`);
    } catch (error) {
        console.error('Error recording rate limit:', error);
    }
}

// Helper function to get cached transactions when rate limited
async function pullCachedTransactions(requisitionId: string): Promise<Transaction[]> {
    try {
        const { database } = await createAdminClient();
        const transactions = await database.listDocuments(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_TRANSACTION_COLLECTION_ID!,
            [
                Query.equal('requisitionId', requisitionId),
                Query.orderDesc('bookingDate'),
                Query.limit(5000)
            ]
        );
        
        console.log(`Retrieved ${transactions.documents.length} cached transactions for requisition ${requisitionId}`);
        return transactions.documents as unknown as Transaction[];
    } catch (error) {
        console.error(`Error fetching cached transactions for requisition ${requisitionId}:`, error);
        return [];
    }
}

// Helper function to fall back to cached transactions when API calls fail
async function fallbackToCachedTransactions(requisitionIds: string[]): Promise<Transaction[]> {
    console.log('Falling back to cached transactions due to API error');
    const allTransactions: Transaction[] = [];
    
    for (const requisitionId of requisitionIds) {
        const transactions = await pullCachedTransactions(requisitionId);
        allTransactions.push(...transactions);
    }
    
    return allTransactions;
}
