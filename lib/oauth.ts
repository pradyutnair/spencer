// /src/lib/server/oauth.js
"use server";

import { createAdminClient } from '@/lib/appwrite';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Account, Client, OAuthProvider } from 'appwrite';

export async function signUpWithGoogle() {
    const { account } = await createAdminClient();

    const origin = headers().get("origin");

    const redirectUrl = await account.createOAuth2Token(
        OAuthProvider.Google,
        `${origin}/oauth`,
        `${origin}/error`,
    );

    console.log("OAUTH Redirect URL:", redirectUrl);

    return redirect(redirectUrl);
}

export const loginWithGoogle = async () => {
    try {
        const client = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

        const account = new Account(client);

        const origin = headers().get("origin");

        const response = account.createOAuth2Session(
          OAuthProvider.Google,
          `${origin}/oauth`,
          `${origin}/error`
        );

        // Ensure the response is a URL instance
        if (response instanceof URL) {
            console.log("OAUTH Redirect Login URL:", response);
            // Redirect the user to the OAuth provider
            return redirect(response.href);
        }

    } catch (error) {
        console.error(error);
        return redirect('/error');
    }
}

