// lib/bank.actions.ts
import { BankData, Transaction } from '@/types';
import dayjs from 'dayjs';
import { createGoCardlessClient } from '@/lib/gocardless';
import { createAdminClient } from '@/lib/appwrite';
import { getLoggedInUser } from '@/lib/user.actions';
import { Query } from 'node-appwrite';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { pushTransactionsDB } from '@/lib/db.actions';

dayjs.extend(weekOfYear);

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
        console.log("Requisitions received", reqData);
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

        //console.log("All accounts received", allAccounts);
        return allAccounts;
    } catch (error) {
        console.error('Error getting accounts:', error);
        return null;
    }
};

// Retrieve balances for all accounts associated with the given requisitionIds
export const getBalances = async ({ requisitionIds }: { requisitionIds: string[] }) => {
    const client = await createGoCardlessClient();
    let result: { [key: string]: { amount: string, currency: string } } = {};

    await client.generateToken();

    try {
        const accounts = await getAccounts({ requisitionIds });

        if (!accounts) {
            throw new Error('No accounts found for the provided requisition ID');
        }

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

        return Object.fromEntries(Object.entries(result).sort(
          ([, a], [, b]) => parseFloat(b.amount) - parseFloat(a.amount)
        ));
    } catch (error) {
        console.error('Error getting balances:', error);
        return null;
    }
};

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

// Retrieve transactions for a given array of requisitionIds from GC
export const getGCTransactions = async ({ requisitionIds, bankNames, dateFrom, dateTo }: { requisitionIds: string[], bankNames?: string[], dateFrom?: string, dateTo?: string }): Promise<Transaction[]> => {
    const client = await createGoCardlessClient();
    let allTransactions: Transaction[] = [];

    dateTo = dateTo || dayjs().format("YYYY-MM-DD");
    await client.generateToken();

    for (let i = 0; i < requisitionIds.length; i++) {
        const requisitionId = requisitionIds[i];
        const bankName = bankNames ? bankNames[i] : undefined;
        try {
            console.log(`Fetching transactions for requisition ID ${requisitionId} and bank ${bankName}`);
            const accounts = await getAccounts({ requisitionIds: [requisitionId] });

            if (!accounts) {
                console.error(`No accounts found for requisition ID ${requisitionId}`);
                continue; // Continue with the next requisitionId
            }

            if (!dateFrom) {
                dateFrom = await checkLatestTransaction(requisitionId);
            }

            const accountTransactionsPromises = accounts.map(async (accountId) => {
                const account = client.account(accountId);
                const transactionResponse = await account.getTransactions({ dateFrom, dateTo });
                return transactionResponse.transactions.booked.concat(transactionResponse.transactions.pending);
            });

            const accountTransactions = await Promise.all(accountTransactionsPromises);
            const flattenedTransactions = accountTransactions.flat();
            const correctedTransactions = await applyDataCorrections(flattenedTransactions, bankName);

            // console.log(`Corrected transactions for requisition ID ${requisitionId}:`, correctedTransactions);

            allTransactions.push(...correctedTransactions);

            console.log(`Pushing transactions for ${requisitionId} for ${bankName} to the database`);
            // Push each transaction to the database
            for (let transaction of correctedTransactions) {
                await pushTransactionsDB(transaction, requisitionId);
            }

            console.log(`Transactions for ${requisitionId} written to the database`);

        } catch (error) {
            console.error(`Error fetching transactions for requisition ID ${requisitionId}:`, error);
        }
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
        "Savings vault", "Flexible profile", "Vault", "To EUR", "To USD", "Exchanged",
        "Weekly Rule", "Monthly Rule", "From Main", "To Main", "From Personal", "To Personal",
        "Balance migration", "EUR Subscriptions", "Savings", "To EUR Subscriptions", "Savings", "Flexible Cash",
    ];

    const wordsToRemoveStr = new RegExp(wordsToRemove.join('|'), 'i');

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
            // Remove extra spaces
            payee = payee.replace(/\s+/g, ' ').trim();
            // Remove special characters and numbers
            payee = payee.replace(/[^a-zA-Z ]/g, ' ').toLowerCase();

            // Capitalize the first letter of every word
            payee = payee.replace(/\b\w/g, (char) => char.toUpperCase());
        } else {
            continue
        }

        let category = await getCategory(payee); // Ensure this line waits for the result
        // console.log(`Category for ${payee}: ${category}`);

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



// Wrap your code in an async function
const getCategory = async (payee: string): Promise<string> => {
    // Check if payee exists in the database and retrieve category, if not, predict it
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
    // For each bank, sum the balances for the given currency and return the list of bank names and total balances
    const accountBalances = bankData.map(({ bankName, balances }) => {
        const totalBalance = Object.values(balances).reduce((acc, { amount, currency }) => {
            if (currency === currency) {
                return acc + parseFloat(amount);
            }
            return acc;
        }, 0);

        return { bankName, totalBalance };
    });



}
