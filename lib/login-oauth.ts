import { Client, Account, OAuthProvider } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) // Your API Endpoint
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!) // Your project ID

const account = new Account(client);
const origin = process.env.NEXTAUTH_URL!;

export const loginWithGoogleNew = async () => {
  try {
    account.createOAuth2Session(OAuthProvider.Google)
  } catch (error) {
    console.error(error)
  }
}