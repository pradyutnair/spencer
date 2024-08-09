import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { ID } from 'node-appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID } = process.env;

export async function POST(request: NextRequest) {
  try {
    const requisitionData = await request.json();

    const { database } = await createAdminClient();

    const newRequisition = await database.createDocument(
      APPWRITE_DATABASE_ID!,
      APPWRITE_REQ_COLLECTION_ID!,
      ID.unique(),
      requisitionData
    );

    if (!newRequisition) {
      return NextResponse.json({ error: 'Failed to complete requisition' },{ status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('COMPLETE REQUISITION POST Error:', error);
    return NextResponse.json({ error: 'Failed to complete requisition' }, { status: 500 });
  }
}