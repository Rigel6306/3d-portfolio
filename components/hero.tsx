"use client"; // overlay is a render function, so this must be a client component

import { useState } from "react";
import FluidCanvas from "./UI/fluidCanvas";
import HeroContent from "./UI/heroContent";
import ParallaxBackground from "./UI/paralax";

const Hero = ({ onLoad }: { onLoad: () => void }) => {


  return (
    <section id="hero" className="relative">
      <ParallaxBackground overlay={(progress,isMute,setIsMute) => <HeroContent progress={progress} isMute={isMute} setIsMute={setIsMute} />} >
        <FluidCanvas onLoad={onLoad} />
      </ParallaxBackground>
    </section>
  );
};

export default Hero;