'use server';

import { createAdminClient, createSessionClient } from '@/lib/appwrite';
import { ID } from 'node-appwrite';
import { cookies } from 'next/headers';
import { parseStringify } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Query } from 'appwrite';

export const signIn = async (formData: FormData) => {
  'use server';
  try {
    const { account } = await createAdminClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const response = await account.createEmailPasswordSession(email, password);
    //console.log('FUNCTION signIn RESPONSE:', parseStringify(response));

    cookies().set('appwrite-session', response.secret, {
      path: '/',
      httpOnly: true,
      secure: true
    });

    redirect('/dashboard');

  } catch (error) {
    console.error('Error in signing in:', error);
  } finally {
    redirect('/dashboard');
  }
};


export async function getLoggedInUser() {
    try {
        const {account} = await createSessionClient();
        const user = await account.get();
        //console.log('User from getLoggedInUser:', user); // Log the user
        return parseStringify(user);
    } catch (error) {
        console.error('Error in getLoggedInUser:', error); // Log the error
        return null;
    }
}

export async function getUserDetails(userId: string) {
    try {
        const {database} = await createAdminClient();
        const userDocument = await database.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_USER_COLLECTION_ID!,
          [Query.equal('userId', userId)
          ]
        );
        return parseStringify(userDocument.documents[0]);
    } catch (error) {
        console.error('Error in getUserDetails:', error);
        return null;
    }
}

export async function signUpWithEmail(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("first-name") as string;
    const lastName = formData.get("last-name") as string;

    // Combine first and last name
    const name = `${firstName} ${lastName}`;

    // Check if any of the fields are empty
    if (!email || !password || !firstName || !lastName) {
        throw new Error('Invalid form data');
    }

    // Create a new profile
    const {account, database} = await createAdminClient();

    // Unique ID for the user
    const userId = ID.unique();

    // Create a new profile with the provided email, password, and name
    await account.create(userId, email, password, name);

    // Create a new document in the database
    const newUser = await writeUserDB(email, firstName, lastName, userId);

    if (!newUser) {
        throw new Error('Failed to write user to database');
    }

    // Initialize the session
    const session = await account.createEmailPasswordSession(email, password);

    cookies().set("appwrite-session", session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true,
    });

    const paymentLink = process.env.STRIPE_PAYMENT_LINK_PROD!;

    //redirect("/select-country");

    // Redirect to the payment link
    redirect(paymentLink);

}

export const logoutAccount = async () => {
    try {
        const {account} = await createSessionClient();
        cookies().delete("appwrite-session");
        await account.deleteSession("current");
        redirect("/login");
    } catch (error) {
        console.error('Error:', error);
        throw error; // propagate the error to the caller
    }
}


export async function writeUserDB(email: string, firstName: string, lastName: string, userId?: string) {
  try {
    // Create a new profile
    const { database } = await createAdminClient();

    // Use provided userId or generate a unique one
    const newUserId = userId || ID.unique();

    // Check if the user already exists in the database
    const userExists = await checkUserExists(email);

    if (userExists) {
      console.log('User already exists:', email);
      return null;
    }

    // Ensure the firstName and lastName are not empty and capitalize the first letter
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);

    // Create a new document in the database
    return await database.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_USER_COLLECTION_ID!,
      ID.unique(), // Unique ID for the document
      {
        userId: newUserId, // User ID
        email: email,
        firstName: firstName,
        lastName: lastName
      }
    );

  } catch (error) {
    console.error('Error creating new user:', error);
    throw error;
  }
}

// Write a function to check if the user already exists in the database using their email
export async function checkUserExists(email: string) {
  try {
    const { database } = await createAdminClient();
    const userDocument = await database.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_USER_COLLECTION_ID!,
      [Query.equal('email', email)]
    );
    return userDocument.documents.length > 0;
  } catch (error) {
    console.error('Error in checkUserExists:', error);
    return false;
  }
}

// Write a function to update the user's subscription status to true/false
export async function updateUserSubscription(email: string, subscriptionStatus: boolean) {
    try {
      const { database } = await createAdminClient();
      const userDocument = await database.listDocuments(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_USER_COLLECTION_ID!,
        [Query.equal('email', email)]
      );

      if (userDocument.documents.length > 0) {
        const user = userDocument.documents[0];
        await database.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_USER_COLLECTION_ID!,
          user.$id,
          {subscriber: subscriptionStatus }
        );

        console.log('User subscription status updated for:', email);
      }
  } catch (error) {
      console.error('Error in updateUserSubscription:', error);
      }
}
