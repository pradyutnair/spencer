import { createAdminClient } from '../../../lib/appwrite';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ID } from 'node-appwrite';
import { getLoggedInUser } from '../../../lib/user.actions';
import { Query } from 'appwrite';

export async function GET(request) {
  try {
    if (!request || !request.nextUrl) {
      console.error('Invalid request');
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    console.log('OAUTH REQUEST: ', request);

    // Check if a session already exists and delete it
    const existingSession = cookies().get('appwrite-session');
    if (existingSession) {
      cookies().delete('appwrite-session');
    }

    const userId = request.nextUrl.searchParams.get('userId');
    const secret = request.nextUrl.searchParams.get('secret');

    const { account, database } = await createAdminClient();
    const session = await account.createSession(userId, secret);

    // Set request headers cookies
    cookies().set('appwrite-session', session.secret, {
      path: '/',
      httpOnly: true,
      secure: true
    });
    console.log('OAUTH SESSION: ', session);

    // Get user details
    const user = await getLoggedInUser();
    const email = user.email;
    let firstName = user.firstName;
    let lastName = user.lastName;

    // If first or last name is missing, split the name field into first and last name
    if (!firstName || !lastName) {
      const name = user.name.split(' ');
      firstName = name[0];
      lastName = name[1];

      // If last name is undefined or has a length less than 2, set it to Guest
      if (!lastName || lastName.length < 2) {
        lastName = 'Guest';
      }
    }

    console.log('firstName: ', firstName);
    console.log('lastName: ', lastName);

    // Check if the user document already exists
    const userDocument = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal('email', email)
      ]
    );

    if (userDocument.documents.length > 0) {
      console.log('User document already exists');
      //return NextResponse.redirect(`${request.nextUrl.origin}/dashboard`);
      const paymentLink = process.env.STRIPE_PAYMENT_LINK_PROD;
      return NextResponse.redirect(paymentLink);
    }

    // Create a new document in the database
    const newUser = await database.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_USER_COLLECTION_ID,
      ID.unique(), // Unique ID for the document
      {
        userId: userId, // User ID
        email: email,
        firstName: firstName,
        lastName: lastName
      }
    );

    if (!newUser) {
      console.error('Failed to create a new user document');
      return NextResponse.json(
        { error: 'Failed to create a new user document' },
        { status: 500 }
      );
    }
    //return NextResponse.redirect(`${request.nextUrl.origin}/select-country`);

    const paymentLink = process.env.STRIPE_PAYMENT_LINK_PROD;
    //return NextResponse.redirect(`${request.nextUrl.origin}/dashboard`);
    return NextResponse.redirect(paymentLink);
  } catch (error) {
    console.error('OAUTH Error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}