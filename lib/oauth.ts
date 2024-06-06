// / src/lib/server/oauth.js
"use server";

import {createAdminClient} from "@/lib/appwrite";
import {redirect} from "next/navigation";
import {headers} from "next/headers";
import {OAuthProvider} from "node-appwrite";

export async function signUpWithGoogle() {
    const {account} = await createAdminClient();

    const origin = headers().get("origin");

    const redirectUrl = await account.createOAuth2Token(
        OAuthProvider.Google,
        `${origin}/oauth`,
        `${origin}/error`,
    );

    console.log("OAUTH Redirect URL:", redirectUrl);

    return redirect(redirectUrl);
}

