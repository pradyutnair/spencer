'use server';
import { Account, Client, OAuthProvider } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) // Your API Endpoint
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!); // Your project ID

const account = new Account(client);
const origin = process.env.NEXTAUTH_URL!;

export const loginWithGoogleNew = async () => {
  try {
    console.log('Logging in with Google');
    console.log('Origin:', origin);
    const session = await account.getSession('current');
    console.log('Session:', session);
    account.createOAuth2Session(
      OAuthProvider.Google,
      `${origin}/dashboard`,
      `${origin}/error` // redirect here on failure
    );
  } catch (error) {
    console.error(error);
  }
};