import React from 'react';
import {LoginForm} from "@/components/forms/LoginForm";
import Image from "next/image";

const LoginPage = () => {
    return (
        <div className="w-full min-h-screen">
            <div className={"flex h-svh items-center justify-center flex-col"}>
                <div className="flex justify-center items-center mb-10">
                    <Image src={"/icons/logo.svg"}
                           alt={"logo"}
                           width={30}
                           height={30}/>
                    <div className="font-ibm-plex-serif text-2xl font-bold ml-2 px-1">Compass</div>
                </div>
                <LoginForm/>
            </div>
        </div>
    );
};

export default LoginPage;