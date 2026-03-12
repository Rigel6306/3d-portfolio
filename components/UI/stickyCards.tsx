import { useEffect, useRef } from "react";

import PileCard from "./pileCard";

export default function StickyCards() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const pilelist = [
    { color: "#3d2fa9", name: "Jello" },
    { color: "#ff7722", name: "Mello" },
    { color: "#ff3d33", name: "Hellow" },
    { color: "#785f47", name: "Pillow" },
    { color: "#2f9fa9", name: "Mellow" },
  ];



  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-b from-yellow-300 h-[800vh] via-purple-700 to-purple-600"
      style={{
        
         // enough scroll space — adjust if too fast/slow
      }}
    >
      {/* Sticky viewport container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center perspective-[1400px]">
        {pilelist.map((item, index) => (
          <PileCard
            key={item.name}
            color={item.color}
            index={index}
            total={pilelist.length}
            sectionRef={sectionRef} // ← pass the ref here
          >
            <div className="w-full h-full p-10 md:p-16 flex items-center justify-center">
              <h2 className="text-white text-5xl md:text-7xl font-bold tracking-tight drop-shadow-2xl">
                {item.name}
              </h2>
            </div>
          </PileCard>
        ))}
      </div>

      {/* Optional footer / continuation so you can keep scrolling */}
      <div className="relative z-10 h-[80vh] flex items-center justify-center text-white text-4xl font-light">
    
      </div>
    </section>
  );
}