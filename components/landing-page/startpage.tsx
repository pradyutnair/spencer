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
import dashboard from '@/public/Main_Dashboard.png'

export function StartPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <MacbookScroll src={dashboard} showGradient={false}/>
      <Features />
      {/*<ProductShowCase />*/}

      <Carousel />
      <PackagesComponent />
      {/* <SectionOne />
      <SectionTwo />
      <SectionThree /> */}
    </>
  );
}
