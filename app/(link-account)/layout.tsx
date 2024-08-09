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
          src="/link-account-background.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
      </div>
      <div className="relative z-10 w-full h-full overflow-auto">
        {children}
      </div>
    </main>
  );
}