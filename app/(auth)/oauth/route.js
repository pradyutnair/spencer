// src/app/oauth/route.js

import { createAdminClient } from '../../../lib/appwrite';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ID } from 'node-appwrite';
import { getLoggedInUser } from '../../../lib/user.actions';

export async function GET(request) {
    try {
        if (!request || !request.nextUrl) {
            throw new Error('Invalid request object');
        }
        console.log("OAUTH REQUEST: ", request)

        const userId = request.nextUrl.searchParams.get("userId");
        const secret = request.nextUrl.searchParams.get("secret");

        const {account, database} = await createAdminClient();
        const session = await account.createSession(userId, secret);

        // Set request headers cookies
        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            secure: true,
        });
        console.log("OAUTH SESSION: ", session)

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
                lastName = "Guest";
            }
        }

        console.log("firstName: ", firstName)
        console.log("lastName: ", lastName)

        // Create a new document in the database
        const newUser = await database.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_USER_COLLECTION_ID,
            ID.unique(), // Unique ID for the document
            {
                userId: userId, // User ID
                email: email,
                firstName: firstName,
                lastName: lastName,
            }
        );

        if (!newUser) {
            throw new Error('Failed to write user to database');
        }

        return NextResponse.redirect(`${request.nextUrl.origin}/select-country`)

    } catch (error) {
        console.error('OAUTH Error:', error);
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}