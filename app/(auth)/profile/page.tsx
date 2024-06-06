// src/app/profile/page.jsx

import {createSessionClient,} from "@/lib/appwrite";
import {getLoggedInUser} from "@/lib/user.actions";
import {redirect} from "next/navigation";
import {cookies} from "next/headers";

async function signOut() {
    "use server";

    const {account} = await createSessionClient();

    cookies().delete("appwrite-session");
    await account.deleteSession("current");

    redirect("/sign-up");
}

export default async function HomePage() {
    let user = await getLoggedInUser();
    if (!user) {
        user = {email: "loading...", name: "loading...", $id: "loading..."}
    }

    return (
        <>
            <ul>
                <li>
                    <strong>Email:</strong> {user.email}
                </li>
                <li>
                    <strong>Name:</strong> {user.name}
                </li>
                <li>
                    <strong>ID: </strong> {user.$id}
                </li>
            </ul>

            <form action={signOut}>
                <button type="submit">Sign out</button>
            </form>
        </>
    );
}
