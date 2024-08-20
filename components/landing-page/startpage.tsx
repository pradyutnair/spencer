import { Carousel } from './carousel';
import { Features } from './features';
import { Hero } from './hero';
import { Navbar } from './Navbar';
import { PackagesComponent } from './packages';
import { ProductShowCase } from './product-showcase';
import { SectionOne } from './section-one';
import { SectionThree } from './section-three';
import { SectionTwo } from './section-two';
import { MacbookScroll } from '@/components/landing-page/macbook-scroll';
import dashboard from '@/public/main-dashboard-cropped.png'
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { HeroScrollDemo } from '@/components/HeroScroll';

export function StartPage() {
  return (
    <>
      <Navbar />
      {/*<Hero />*/}
      <div
        className="bg-gradient-to-b from-zinc-950 to-zinc-800/34 to-[#71717a] to-[#3f3f46_82%] py-[42px] sm:py-24 text-white relative overflow-clip mt-6">
        <HeroScrollDemo />
        {/*<MacbookScroll src={dashboard} showGradient={false}/>*/}
      </div>
        {/*<ProductShowCase />*/}

        <Carousel />
        <PackagesComponent />
        {/* <SectionOne />
      <SectionTwo />
      <SectionThree /> */}

      </>
      );
      }
