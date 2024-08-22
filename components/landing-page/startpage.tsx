import { Carousel } from './carousel';
import { LandingNavbar } from './LandingNavbar';
import { PricingComponent } from './pricing';
import { HeroScrollDemo } from '@/components/HeroScroll';
import LandingFooter from '@/components/landing-page/footer-landing';

export function StartPage() {
  return (
    <>
      <LandingNavbar />
      {/*<Hero />*/}
      <div className="to-zinc-800/34 relative overflow-clip bg-gradient-to-b from-zinc-950 to-[#3f3f46_82%] to-[#71717a] py-[42px] text-white sm:py-24 ">
        <HeroScrollDemo />

        {/*<MacbookScroll src={dashboard} showGradient={false}/>*/}
      </div>
      {/*<ProductShowCase />*/}

      <Carousel />
      <PricingComponent />
      {/* <SectionOne />
      <SectionTwo />
      <SectionThree /> */}
      <LandingFooter />
    </>
  );
}
