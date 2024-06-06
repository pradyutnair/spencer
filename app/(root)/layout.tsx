
//import SideBar from '@/components/SideBar';
//import MobileNav from "@/components/MobileNavBar";
import {getLoggedInUser} from "@/lib/user.actions";
import {redirect} from "next/navigation";
import React from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import ThemeProvider  from '@/components/layout/ThemeToggle/theme-provider'

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const loggedIn = await getLoggedInUser();
    if (!loggedIn) redirect('/login')
    // -----------------------------------------------
    // Old layout
    // return (
    //     <main className="flex h-screen w-full font-inter">
    //         <SideBar user={loggedIn}/>
    //
    //         <div className="flex size-full flex-col">
    //             <div className="root-layout">
    //                 <Image src="/icons/logo.svg" width={30} height={30} alt="logo"/>
    //                 <div>
    //                     <MobileNav user={loggedIn}/>
    //                 </div>
    //             </div>
    //             {children}
    //         </div>
    //     </main>
    // );
    // -----------------------------------------------

    // New layout
    return (
        <main className="flex h-screen w-full font-inter dark:bg-zinc-950 bg-white">
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
            <Header user={loggedIn}/>
            <div className="flex h-screen w-full dark:bg-zinc-950 bg-white">
                <Sidebar/>
                <main className="flex-1 pt-8 w-full dark:bg-zinc-950 bg-white">
                    {children}
                </main>
            </div>
            </ThemeProvider>
        </main>
    );


}