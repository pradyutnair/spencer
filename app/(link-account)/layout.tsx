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
          src="/link-account-background.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
      </div>
      <div className="relative z-10 h-full w-full overflow-auto">
        {children}
      </div>
    </main>
  );
}