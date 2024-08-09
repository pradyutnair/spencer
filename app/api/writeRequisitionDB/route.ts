import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/lib/appwrite';
import { ID } from 'node-appwrite';

const { APPWRITE_DATABASE_ID, APPWRITE_REQ_COLLECTION_ID } = process.env;

interface RequisitionParams {
    userId: string;
    requisitionId: string;
    bankName: string;
    bankLogo: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, requisitionId, bankName, bankLogo }: RequisitionParams = req.body;

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
            res.status(500).json({ error: 'Failed to write requisition to database' });
            return;
        }

        // Return a success response
        res.status(200).json({ message: 'Requisition written to database successfully' });
    } else {
        // Handle any other HTTP method
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}