// app/api/login-with-google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'appwrite';
import { OAuthProvider } from 'node-appwrite';

export async function GET(request: NextRequest) {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

  const account = new Account(client);

  console.log('Next URL from login API:', request.nextUrl.origin);

  try {
    console.log('Next URL from login API:', request.nextUrl.origin);
    const url = account.createOAuth2Session(
      OAuthProvider.Google,
      `${request.nextUrl.origin}/oauth`,
      `${request.nextUrl.origin}/error`
    );

    if (url instanceof URL) {
      return NextResponse.redirect(url.href);
    }
  } catch (error) {
    console.error('Error initiating OAuth session:', error);
    return NextResponse.json({ message: 'Error initiating OAuth session' }, { status: 500 });
  }
}