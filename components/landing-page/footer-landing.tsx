import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import React from 'react';
import Image from 'next/image';
import dashboard from '@/public/dashboard.png';

export default function LandingFooter() {
  return (
    <footer className="bg-muted py-6 w-full dark:bg-background relative flex flex-col sm:flex-row -mb-4 hidden sm:flex">
      {/* Add a white line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-white/20" />

      {/* Image section */}
      <div className="flex justify-center sm:justify-start w-full sm:w-1/4 h-44 mb-4 sm:mb-0">
        <Image src={dashboard} alt="Footer logo" className="object-contain h-full" />
      </div>

      {/* Footer content */}
      <div className="container max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 h-full w-full sm:w-3/4 relative z-10">
        <div className="grid gap-4">
          <h4 className="text-lg font-semibold">Product</h4>
          <nav className="grid gap-2">
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground" prefetch={false}>
              Features
            </Link>
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground" prefetch={false}>
              Pricing
            </Link>
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground" prefetch={false}>
              Integrations
            </Link>
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground" prefetch={false}>
              Enterprise
            </Link>
          </nav>
        </div>
        <div className="grid gap-4">
          <h4 className="text-lg font-semibold">Resources</h4>
          <nav className="grid gap-2">
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground" prefetch={false}>
              Documentation
            </Link>
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground" prefetch={false}>
              Blog
            </Link>
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground" prefetch={false}>
              Guides
            </Link>
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground" prefetch={false}>
              Community
            </Link>
          </nav>
        </div>
        <div className="grid gap-4">
          {/*<h4 className="text-lg font-semibold">Subscribe</h4>*/}

          <h4 className="text-lg font-semibold">Social Media</h4>
          <nav className="flex gap-4">
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground"
                  prefetch={false}>
              Twitter
            </Link>
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground"
                  prefetch={false}>
              Facebook
            </Link>
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground"
                  prefetch={false}>
              LinkedIn
            </Link>
            <Link href="#" className="text-muted-foreground hover:underline dark:text-muted-foreground"
                  prefetch={false}>
              Instagram
            </Link>
          </nav>

          <form className="flex gap-2">
            <Input type="email" placeholder="Enter your email"
                   className="flex-1 dark:bg-muted dark:text-muted-foreground" />
            <Button type="submit" className="dark:bg-primary dark:text-primary-foreground">
              Subscribe
            </Button>
          </form>
        </div>
      </div>
    </footer>
  )
}