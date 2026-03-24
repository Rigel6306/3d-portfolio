import { useEffect, useRef } from "react";

import PileCard from "./pileCard";

export default function StickyCards() {
  const sectionRef = useRef<HTMLDivElement>(null);



  const projectList = [
    {
      color: "#3d2fa9",
      name: "Fitness Gym Management System",
      stack: ["React Native", "React 19", "Node.js/Express", "Firestore/Firebase"],
      description: "a cross-platform app for gym members that manages workouts, payments, notifications, analytics etc with an admin panel and secure REST API for user and payment management",
      img: '/project-images/fitness.png'
    },
    {
      color: "#ff7722",
      name: "AI Trip Planner",
      stack: ["Next.js", "TypeScript", "AI SDK", "Firebase"],
      description: "Al-powered trip planning platform with Google Authentication, intelligent itinerary management and real-time updates.",
      img: '/project-images/trip-planner.png'


    },
    {
      color: "#ff3d33",
      name: "RedRooster Farm E-Commerce",
      stack: ["React", "Node.js/Express","MySQL"],
      description: "Full-stack food ordering platform with secure payment and order tracking."

    },
    {
      color: "#785f47",
      name: "FuturityLK Social Platform",
      stack: ["React Native", "React 19", "Node.js/Express", "Firestore/Firebase"],
      description: " A cross-platform app for donations, awareness posts, and emergency care services.",
      img:'/project-images/futurity.png'

    },
    {
      color: "#2f9fa9",
      name: "Developer Portfolio Website",
      stack: ["Next.js", "Three.js", "Framer Motion"],
      description: "Showcased projects with 3D animations and interactive design.",
      img:'/project-images/company.png'
    },

    {
      color: "#461c5a",
      name: "Mac Clone Showcase",
      stack: ["React", "Three.js", "GSAP"],
      description: "Apple Mac product page clone with 3D and scroll animations.",
      img:'/project-images/macClone.png'
    },
   
 

    {
      color: "#261f30",
      name: "Smart House Management System",
      stack: ["React.js", "Node.js/Express", "MongoDB"],
      description: "A Full-stack web system for real estate housing management."
    },

    {
      color: "#2d3536",
      name: "Defender Bypass ",
      stack: ["C++", "Metasploit"],
      description: "Extracts Metasploit Reverse shell binary concatenated into a JPEG. Undetected Execution",
      img:'/project-images/rigelGenerator.png'
    },

  ]


  return (
    <section 
      ref={sectionRef}
      className="  relative bg-linear-to-b  h-[600vh] "
      style={{
        //  height: `${projectList.length * 300}vh`
        // enough scroll space — adjust if too fast/slow
      }}
    >
      {/* Sticky viewport container */}
      <div className="sticky top-0 h-screen w-full flex   perspective-[1400px]">
        {projectList.map((item, index) => (
          <PileCard
            key={item.name}
            color={item.color}
            index={index}
            total={projectList.length}
            sectionRef={sectionRef} 
          >
            <div className="w-full h-full sm:p-2 flex flex-col">
              <div className="card-header h-[30%] flex flex-col sm:flex-row   ">
                <div className="project-name items-center  flex flex-1 pl-5 sm:p-5 ">
                  <h2 className="text-white text-[13px] md:text-2xl font-semibold tracking-tight drop-shadow-2xl">
                    {item.name}
                  </h2>
                </div>

                <div className="stack-list  flex pl-3 sm:p-5 sm:flex-4  max-w-full sm:items-center sm:justify-end">

                  {
                    item.stack.map((item, index) => (
                      <p key={index} className="text-[6px] p-2 font-semibold font-sans sm:text-lg">{item} | </p>
                    ))
                  }
                </div>
              </div>

          <div className="flex flex-col justify-center h-full overflow-hidden items sm:flex-row flex-1 m-3 gap-4 mt-2">
            {/* Description */}
            <div className="card-description sm:w-[30%] p-2 text-xs sm:text-sm md:text-lg">
              <p>{item.description}</p>
            </div>

            {/* Image */}
            <div className="img-container w-full   rounded-2xl overflow-hidden ">
              {item.img && (
                <img
                  src={item.img}
                  className="w-full h-full object-fit rounded-2xl"
                  alt={item.name}
                />
              )}
            </div>
          </div>


            </div>
          </PileCard>
        ))}
      </div>

     
    </section>
  );
}