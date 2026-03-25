
import type { Route } from "./+types/home";
import Hero from "components/hero";


import { ReactLenis } from 'lenis/react'
import { TextParallaxContentContainer } from "components/UI/stickySlider";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
 

  return (
      <ReactLenis root options={{ lerp: 0.2, duration: 1.5, smoothWheel: true }}>


   
    <div className="home">
      <Hero />
      <TextParallaxContentContainer/>
      
    
    </div>
       </ReactLenis>
  );
}
