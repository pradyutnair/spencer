import Image from "next/image";
import React from "react";

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className={"flex w-full justify-between font-inter"}>
            {children}
            <div className={"auth-asset"}>
                <div>
                    <Image src={"/icons/auth-image.svg"} alt={"Auth Image"} width={500} height={500}/>
                </div>
            </div>
        </main>
    );
}
  