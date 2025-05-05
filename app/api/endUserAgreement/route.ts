import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createGoCardlessClient } from '@/lib/gocardless';

// Define the POST function
export async function POST(request: NextRequest) {
    try {
        let { institutionId, redirectUrl } = await request.json();

        // Validate required parameters
        if (!institutionId) {
            return NextResponse.json({ error: 'Institution ID is required' }, { status: 400 });
        }

        const client = await createGoCardlessClient();
        await client.generateToken();

        // GoCardless parameters with appropriate defaults
        const accessValidForDays = 120;
        const maxHistoricalDays = 730;

        // Get origin from headers, fallback to environment variable or secure default
        const origin = request.headers.get('origin') || 
                      process.env.APP_URL || 
                      process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;

        if (!origin) {
            return NextResponse.json(
                { error: 'Origin could not be determined. Please set APP_URL in environment variables.' }, 
                { status: 500 }
            );
        }

        // Construct redirect URL with proper validation
        let finalRedirectUrl;
        if (!redirectUrl) {
            finalRedirectUrl = `${origin}/gocardless-redirect`;
        } else {
            // Ensure redirectUrl starts with a slash if it's a relative path
            redirectUrl = redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`;
            finalRedirectUrl = `${origin}${redirectUrl}`;
        }

        // Generate a reference ID for tracking
        const referenceId = randomUUID();

        try {
            // Try with full parameters first
            const init = await client.initSession({
                redirectUrl: finalRedirectUrl,
                institutionId: institutionId,
                referenceId: referenceId,
                accessValidForDays: accessValidForDays,
                maxHistoricalDays: maxHistoricalDays,
            });

            // Return requisitionId along with the link
            return NextResponse.json({ 
                link: init.link, 
                requisitionId: init.id,
                referenceId: referenceId
            });
        } catch (initError) {
            console.error(`Error initializing session with full parameters: ${initError}`);
            
            // Fall back to minimal parameters
            try {
                const init = await client.initSession({
                    redirectUrl: finalRedirectUrl,
                    institutionId: institutionId,
                    referenceId: referenceId
                });
    
                return NextResponse.json({ 
                    link: init.link, 
                    requisitionId: init.id,
                    referenceId: referenceId,
                    fallback: true
                });
            } catch (fallbackError) {
                console.error('Fallback initialization also failed:', fallbackError);
                throw fallbackError;
            }
        }
    } catch (error) {
        console.error('CREATE SESSION POST Error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to create session', 
                details: error instanceof Error ? error.message : String(error)
            }, 
            { status: 500 }
        );
    }
}