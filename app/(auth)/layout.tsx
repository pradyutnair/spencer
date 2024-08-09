import Image from 'next/image';
import React from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex w-full h-screen justify-between font-inter relative">
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth-image.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
      </div>
      <div className="relative z-10 w-full">
        {children}
      </div>
      <div className="auth-asset relative z-10">
        <div>
          <Image className="mt-32" src="/icons/auth-image.svg" alt="Auth Image" width={700} height={500} />
        </div>
      </div>
    </main>
  );
}