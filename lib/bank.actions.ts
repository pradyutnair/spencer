// lib/bank.actions.ts
import { BankData, Transaction } from '@/types';
import dayjs from "dayjs";
import { createGoCardlessClient } from "@/lib/gocardless";
import { createAdminClient } from "@/lib/appwrite";
import { getLoggedInUser } from "@/lib/user.actions";
import { Query } from "node-appwrite";
import weekOfYear from "dayjs/plugin/weekOfYear";
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
            bankLogo: document.bankLogo
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

        console.log("All accounts received", allAccounts);
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

    const bankDataPromises = requisitionData.map(async ({ requisitionId, bankName, bankLogo }) => {
        const balances = await getBalances({ requisitionIds: [requisitionId] }) || {};
        return { requisitionId, bankName, bankLogo, balances };
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
            const correctedTransactions = applyDataCorrections(flattenedTransactions, bankName);

            allTransactions.push(...correctedTransactions);

        } catch (error) {
            console.error(`Error fetching transactions for requisition ID ${requisitionId}:`, error);
        }
    }

    console.log(`Retrieved ${allTransactions.length} transactions`);

    allTransactions.forEach((transaction) => {
        pushTransactionsDB(transaction, requisitionIds[0]);
    });

    console.log(`Transactions for ${requisitionIds[0]} written to the database`);

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


const applyDataCorrections = (transactions: Transaction[], bankName?: string): Transaction[] => {
    console.log(`Applying data corrections to ${transactions.length} transactions for ${bankName}`);
    // Check if the transactions array contains data
    if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new Error("transactions must be a non-empty array");
    }

    // Check if required fields exist
    transactions.forEach(transaction => {
        if (!transaction.transactionAmount || !transaction.bookingDate) {
            throw new Error("transactionAmount and bookingDate are required fields");
        }
    });

    // Predefine the words to match and remove
    const wordsToRemove = [
        "Savings vault", "Flexible profile", "Vault", "To EUR", "To USD", "Exchanged",
        "Weekly Rule", "Monthly Rule", "From Main", "To Main", "From Personal", "To Personal",
        "Balance migration", "EUR Subscriptions", "Savings", "To EUR Subscriptions", "Savings", "Flexible Cash"
    ];
    const wordsToRemoveStr = new RegExp(wordsToRemove.join('|'), 'i'); // Case-insensitive matching

    const correctedTransactions: Transaction[] = [];

    transactions.forEach(transaction => {
        const { transactionAmount,
            bookingDate,
            creditorName,
            debtorName,
            creditorAccount,
            debtorAccount,
            remittanceInformationUnstructuredArray } = transaction;

        // Extract amount and currency
        const amount = parseFloat(transactionAmount.amount);
        const currency = transactionAmount.currency;

        // Convert bookingDate to Date object and extract date parts
        // Convert bookingDate to Date object and extract date parts
        let bookingDateObj;
        bookingDateObj = dayjs(bookingDate);
        dayjs.extend(require('dayjs/plugin/weekOfYear'));
        const year = bookingDateObj.year();
        const month = bookingDateObj.month() + 1; // month() is 0-indexed in dayjs
        const week = bookingDateObj.week(); // Use  week()
        const day = bookingDateObj.date();
        const dayOfWeek = bookingDateObj.day();


        // Determine the first and second columns for payee information
        const firstColumn = creditorName ?? debtorName ?? '';
        const secondColumn = creditorAccount ?? debtorAccount ?? '';
        const remittanceInfo = remittanceInformationUnstructuredArray?.join(' ') ?? '';

        // Coalesce creditorName and creditorAccount
        let payee = firstColumn || secondColumn || remittanceInfo;
        if (!payee) {
            payee = "Unknown";
        } if (typeof payee === 'object') {
            // Get the string representation of the object
            payee = JSON.stringify(payee);

        }
        payee = payee.replace(/\s+/g, ' ').trim();

        // Check words to remove in all three columns
        const containsWordsToRemove = wordsToRemoveStr.test(payee);
        const containsWordsToRemoveFirstColumn = wordsToRemoveStr.test(firstColumn);
        const containsWordsToRemoveRemittanceInfo = wordsToRemoveStr.test(remittanceInfo);

        if (!bankName) {
            bankName = "YourBankName"; // Replace with the actual bank name or a dynamic value
        } else {
            // Apply data corrections by removing underscores and hyphens
            bankName = bankName.replace(/_/g, ' ').replace(/-/g, ' ');
            // Split the bank name and only use the first word
            bankName = bankName.split(' ')[0];
        }

        if (!containsWordsToRemove && !containsWordsToRemoveFirstColumn && !containsWordsToRemoveRemittanceInfo) {
            // Create a new transaction object with the corrected data
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
                Description: remittanceInfo
            };
            correctedTransactions.push(correctedTransaction);
        }
    });

    // Sort the transactions by booking date in descending order
    correctedTransactions.sort((a, b) => dayjs(b.bookingDate).unix() - dayjs(a.bookingDate).unix());

    // Console log all the columns for the first transaction
    // eslint-disable-next-line no-console
    //console.log("First transaction after data corrections", correctedTransactions[0]);

    return correctedTransactions;
};
