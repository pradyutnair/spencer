import type { Metadata } from 'next';
import { IBM_Plex_Serif, Inter } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/layout/ThemeToggle/theme-provider';
import React from 'react';
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const ibmPlexSerif = IBM_Plex_Serif({subsets: ["latin"], weight: ["400", "700"], variable: '--font-ibm-plex-serif'});

export const metadata: Metadata = {
  title: "Nexpass",
  description: "Nexpass is a simple, flexible, and powerful budgeting app.",
  icons: {
    icon: "/icons/logo-v2.svg",
  }
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body className={`${inter.variable} ${ibmPlexSerif.variable}`}>
      <Analytics />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </body>
    </html>
  );
}