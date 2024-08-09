import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { Query } from 'appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_USER_COLLECTION_ID } = process.env;

export async function POST(request: NextRequest) {
  try {
    const { userId, newUserName } = await request.json();

    // Split into first and last name
    const [firstName, lastName] = newUserName.split(' ');

    console.log('Updating user:', userId, newUserName);

    const { database } = await createAdminClient();

    // Get document id of the user to update
    const userDocument = await database.listDocuments(
      APPWRITE_DATABASE_ID!,
      APPWRITE_USER_COLLECTION_ID!,
      [Query.equal('userId', userId)
      ]
    );

    if (!userDocument.documents || userDocument.documents.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = userDocument.documents[0];
    const documentUserId = userDoc.$id;

    const updateUser = await database.updateDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_USER_COLLECTION_ID!,
      documentUserId,
      {
        firstName: firstName,
        lastName: lastName
      }
    )

    if (!updateUser) {
      return NextResponse.json({ error: 'Failed to update user' },{ status: 500 });
    }

    return NextResponse.json({ success: true });

  }
  catch (error) {
    console.error('EDIT USER NAME POST Error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

