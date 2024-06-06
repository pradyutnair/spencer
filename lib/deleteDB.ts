import { createAdminClient } from '@/lib/appwrite';
const { APPWRITE_DATABASE_ID, APPWRITE_TRANSACTION_COLLECTION_ID } = process.env;

async function deleteDB() {
  const { database } = await createAdminClient();

  let documents = await database.listDocuments(
    APPWRITE_DATABASE_ID!,
    APPWRITE_TRANSACTION_COLLECTION_ID!,
  );

  // Delete all documents in the collection
  for (let document of documents.documents) {
    await database.deleteDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_TRANSACTION_COLLECTION_ID!,
      document.$id,
    );
  }

  console.log('All documents deleted');
}

deleteDB();