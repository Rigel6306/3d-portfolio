"use client"; // overlay is a render function, so this must be a client component

import FluidCanvas from "./UI/fluidCanvas";
import HeroContent from "./UI/heroContent";
import ParallaxBackground from "./UI/paralax";

const Hero = ({ onLoad }: { onLoad: () => void }) => {
  return (
    <section id="hero" className="relative">
      <ParallaxBackground
        overlay={(progress, isMute, setIsMute) => (
          <HeroContent progress={progress} isMute={isMute} setIsMute={setIsMute} />
        )}
      >
        {(fluidActive) => <FluidCanvas active={fluidActive} onLoad={onLoad} />}
      </ParallaxBackground>
    </section>
  );
};

export default Hero;