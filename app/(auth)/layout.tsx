import Image from 'next/image';
import React from 'react';

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="font-inter relative flex h-screen w-full justify-between overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth-image.jpg"
          alt="Background"
          quality={100}
          width={6000}
          height={6000}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="z-10 ml-4 mr-4 flex w-full items-center justify-center">
        {children}
      </div>
      <div className="relative z-10 hidden lg:block">
        <div className="halo ml-32 mt-52 scale-125 transform items-center justify-center rounded-lg opacity-85">
          <Image
            className="rounded-lg"
            src="/main-dashboard.png"
            alt="Auth Image"
            width={2000}
            height={2000}
          />
        </div>
      </div>
    </main>
  );
}