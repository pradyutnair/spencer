import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

export const LandingNavbar = () => {
  return (
    <div className="relative min-w-full">
      <div className=" px-4">
        <div className="flex items-center justify-between py-6">
          <div className="relative">
            <div className="absolute bottom-2 top-2 w-full bg-gradient-to-r from-zinc-50 via-zinc-500 to-zinc-50 blur-md "></div>
            <Image
              src={'/logo-v1.png'}
              alt={'Logo'}
              width={50}
              height={50}
              className=" relative h-10 w-10 md:h-12 md:w-12"
            />
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white border-opacity-30 sm:hidden">
            <Sheet>
              <SheetTrigger>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="font-bold">MENU</SheetTitle>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
          <nav className="mr-4 hidden items-center gap-6 sm:flex">
            <a
              href="#features"
              className="text-white text-opacity-60 transition hover:text-opacity-100"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-white text-opacity-60 transition hover:text-opacity-100"
            >
              Pricing
            </a>
            <a
              href="/about"
              className="text-white text-opacity-60 transition hover:text-opacity-90"
            >
              About
            </a>
            {/*<button className="rounded-sm bg-white px-4 py-2 text-black transition hover:bg-opacity-90">*/}
            {/*  Try now*/}
            {/*</button>*/}
          </nav>
        </div>
      </div>
    </div>
  );
};
