import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite';
import { ID } from 'node-appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID } = process.env;

interface RequisitionParams {
    userId: string;
    requisitionId: string;
    bankName: string;
    bankLogo: string;
}

export async function POST(req: NextRequest) {
    try {
        const { userId, requisitionId, bankName, bankLogo }: RequisitionParams = await req.json();

        // Create a new admin client
        const { database } = await createAdminClient();

        // Create a new document in the requisitions collection with the user ID and requisition ID
        const newRequisition = await database.createDocument(
            APPWRITE_DATABASE_ID!,
            APPWRITE_REQ_COLLECTION_ID!,
            ID.unique(), // Unique ID for the document
            {
                userId: userId, // User ID
                requisitionId: requisitionId,
                bankName: bankName,
                bankLogo: bankLogo,
            }
        );

        // If the document creation failed, return an error response
        if (!newRequisition) {
            return NextResponse.json({ error: 'Failed to write requisition to database' }, { status: 500 });
        }

        // Return a success response
        return NextResponse.json({ message: 'Requisition written to database successfully' });
    } catch (error) {
        console.error('Error writing requisition to database:', error);
        return NextResponse.json({ error: 'Error writing requisition to database' }, { status: 500 });
    }
}