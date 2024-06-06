import { NextRequest, NextResponse } from 'next/server';
import NordigenClient from 'nordigen-node';
import { parseStringify } from "@/lib/utils";

export async function POST(request: NextRequest) {
    try {
        const { country } = await request.json();
        console.log('POST Country Code:', country);

        // create new Nordigen client
        const client = new NordigenClient({
            secretId: process.env.GOCARDLESS_SECRET_ID,
            secretKey: process.env.GOCARDLESS_SECRET_KEY
        });

        // create new access token
        const data = await client.generateToken();

        // get institutions
        const institutions = await client.institution.getInstitutions({country: country});
        //console.log('Institutions:', institutions);

        // return institutions
        return NextResponse.json(institutions);

    } catch (error) {
        console.error('POST Error:', error);
    }
} // Added closing brace here