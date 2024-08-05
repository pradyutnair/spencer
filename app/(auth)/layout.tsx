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
                    <Image className={"mt-32"} src={"/icons/auth-image.svg"} alt={"Auth Image"} width={700} height={500}/>
                </div>
            </div>
        </main>
    );
}
  