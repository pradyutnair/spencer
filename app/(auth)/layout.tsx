import Image from 'next/image';
import React from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex w-full h-screen justify-between font-inter relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth-image.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="z-10 ml-4 mr-4 w-full flex items-center justify-center">
        {children}
      </div>
      <div className="relative z-10 hidden lg:block">
        <div className="mt-52 ml-32 justify-center items-center transform scale-125 rounded-lg opacity-85 halo">
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