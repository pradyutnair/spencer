import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { Query } from 'appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_BUDGET_COLLECTION_ID } = process.env;

export async function POST(request: NextRequest) {
  try {
    const { userId, budget } = await request.json();

    // Separate the category and the value from budget
    const category = Object.keys(budget)[0];
    const value = budget[category];

    // Create a new admin client
    const { database } = await createAdminClient();

    // Find the document
    const document = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_BUDGET_COLLECTION_ID!,
      [
        Query.equal('userId', userId),
      ]
    );

    //Get the document id
    const documentId = document.documents[0].$id;

    // Update the current budget
    await database.updateDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_BUDGET_COLLECTION_ID!,
      documentId,
      { [category]: value }
    );

    return NextResponse.json({ message: 'Budget updated successfully' });
  } catch (error) {
    console.error('Error updating transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}