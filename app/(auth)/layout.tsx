import Image from 'next/image';
import React from 'react';

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="font-inter relative flex h-screen w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth-image.jpg"
          alt="Background"
          quality={100}
          width={1920}
          height={1080}
          className="h-full w-full object-cover  dark:grayscale"
        />
      </div>
      <div className="z-10 ml-4 mr-4 flex w-full items-center justify-center">
        {children}
      </div>
    </main>
  );
}