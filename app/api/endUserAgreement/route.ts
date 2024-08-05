import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createGoCardlessClient } from "@/lib/gocardless";

// Define the POST function
export async function POST(request: NextRequest) {
    try {
        let { institutionId, redirectUrl } = await request.json();
        //console.log('Institution ID from EUA:', institutionId);

        if (!institutionId) {
            return NextResponse.redirect('/sign-up');
        }

        const client = await createGoCardlessClient();
        await client.generateToken();

        let accessValidForDays = 120;
        let maxHistoricalDays = 730;

        // Use a default value for origin if it is not present in the request headers
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        // The redirect url is either provided in the request or a default value is used
        if (!redirectUrl) {
            redirectUrl = `${origin}/gocardless-redirect`;
        } else {
            redirectUrl = `${origin}${redirectUrl}`
        }
        //console.log('Redirect URL:', redirectUrl);

        let init;
        try {
            init = await client.initSession({
                redirectUrl: redirectUrl,
                institutionId: institutionId,
                referenceId: randomUUID(),
                accessValidForDays: accessValidForDays,
                maxHistoricalDays: maxHistoricalDays,
            });
        } catch (error) {
            console.error('Unable to initialize session with accessValidForDays and maxHistoricalDays:', error);
            init = await client.initSession({
                redirectUrl: redirectUrl,
                institutionId: institutionId,
                referenceId: randomUUID()
            });
        }

        // Return requisitionId along with the link
        return NextResponse.json({ link: init.link, requisitionId: init.id });

    } catch (error) {
        console.error('CREATE SESSION POST Error:', error);
        return NextResponse.json({ error: 'Failed to create session', details: error.message }, { status: 500 });
    }
}