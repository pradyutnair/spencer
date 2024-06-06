"use client";
import {Button} from "@/components/ui/button";
import {signUpWithGoogle} from "@/lib/oauth";
import React from "react";
import Image from 'next/image';

const SignInWithGoogleButton = ({type = 'sign-in'}: { type?: string }) => {
    let buttonText;
    let functionToUse;

    if (type === 'sign-in') {
        buttonText = 'Log in with';
        functionToUse = signUpWithGoogle;
    } else {
        buttonText = 'Sign up with';
        functionToUse = signUpWithGoogle;
    }
    return (
        <Button
            type="button"
            variant="outline"
            className="w-full flex justify-center items-center"
            onClick={() => {
                functionToUse();
            }}
        >
            {buttonText}
            <Image src="/icons/google.svg" alt="Google logo" width={24} height={24} className="ml-2"/>
        </Button>
    );
};

export default SignInWithGoogleButton;