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

  const projectList = [
    {
      color: "#3d2fa9",
      name: "Fitness Gym Management System",
      stack: ["React Native", "React 19", "Node.js/Express", "Firestore/Firebase"],
      description: "a cross-platform app for gym members that manages workouts, payments, notifications, analytics etc with an admin panel and secure REST API for user and payment management",

    },
    {
      color: "#ff7722",
      name: "AI Trip Planner",
      stack: ["Next.js", "TypeScript", "AI SDK", "Firebase"],
      description: "Al-powered trip planning platform with Google Authentication, intelligent itinerary management and real-time updates.",



    },
    {
      color: "#ff3d33",
      name: "RedRooster Farm E-Commerce",
      stack: ["React", "Node.js/Express,MySQL"],
      description: "Full-stack food ordering platform with secure payment and order tracking."

    },
    {
      color: "#785f47",
      name: "FuturityLK Social Platform",
      stack: ["React Native", "React 19", "Node.js/Express", "Firestore/Firebase"],
      description: " A cross-platform app for donations, awareness posts, and emergency care services."

    },
    {
      color: "#2f9fa9",
      name: "Developer Portfolio Website",
      stack: ["Next.js", "Three.js", "Framer Motion"],
      desciption: "Showcased projects with 3D animations and interactive design."
    },

    {
      color: "#461c5a",
      name: "Mac Clone Showcase",
      stack: ["React", "Three.js", "GSAP"],
      desciption: "Apple Mac product page clone with 3D and scroll animations."
    },
    {
      color: "#6f7a24",
      name: "Mac Clone Showcase",
      stack: ["React", "Three.js", "GSAP"],
      desciption: "Apple Mac product page clone with 3D and scroll animations."
    },

     {
      color: "#261f30",
      name: "Smart House Management System",
      stack: ["React.js", "Node.js/Express", "MongoDB"],
      desciption: "A Full-stack web system for real estate housing management."
     },

      {
      color: "#2d3536",
      name: "Defender Bypass ",
      stack: ["C++,Metasploit"],
      desciption: "Extracts Metasploit Reverse shell binary concatenated into a JPEG. Undetected Execution"
     },




  ]


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
        {projectList.map((item, index) => (
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