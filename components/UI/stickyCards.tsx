import { useRef } from "react";
import PileCard from "./PileCard";

export default function StickyCards() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const projectList = [
    {
      color: "#181436",
      name: "Fitness Gym Management System",
      year: "2024",
      type: "Mobile & Web App",
      stack: ["React Native", "React 19", "Node.js/Express", "Firestore/Firebase"],
      description:
        "A cross-platform app for gym members to manage workouts, payments, notifications, and analytics with an admin panel and secure REST API for user and payment management.",
      img: "/project-images/fitness.png",
      githubUrl: "#",
      liveUrl: "#",
    },
    {
      color: "#331808",
      name: "AI Trip Planner",
      year: "2024",
      type: "Full-Stack Web App",
      stack: ["Next.js", "TypeScript", "AI SDK", "Firebase"],
      description:
        "AI-powered trip planning platform featuring Google Authentication, intelligent itinerary management, interactive route previews, and real-time updates.",
      img: "/project-images/trip-planner.png",
      githubUrl: "#",
      liveUrl: "#",
    },
    {
      color: "#3b0c0a",
      name: "RedRooster Farm E-Commerce",
      year: "2023",
      type: "E-Commerce",
      stack: ["React", "Node.js/Express", "MySQL"],
      description:
        "Full-stack food ordering platform built with secure online payment integration, inventory controls, and real-time order tracking.",
      img: "",
      githubUrl: "#",
      liveUrl: "#",
    },
    {
      color: "#211a14",
      name: "FuturityLK Social Platform",
      year: "2024",
      type: "Social Impact App",
      stack: ["React Native", "React 19", "Node.js/Express", "Firestore/Firebase"],
      description:
        "A cross-platform app for donations, awareness posts, and emergency care services designed for community support and instant alerts.",
      img: "/project-images/futurity.png",
      githubUrl: "#",
      liveUrl: "#",
    },
    {
      color: "#0c2b2e",
      name: "Developer Portfolio Website",
      year: "2024",
      type: "Interactive Web",
      stack: ["Next.js", "Three.js", "Framer Motion"],
      description:
        "Interactive portfolio showcasing featured engineering projects with custom 3D animations, WebGL graphics, and fluid scroll dynamics.",
      img: "/project-images/company.png",
      githubUrl: "#",
      liveUrl: "#",
    },
    {
      color: "#230e2d",
      name: "Mac Clone Showcase",
      year: "2023",
      type: "3D Product Showcase",
      stack: ["React", "Three.js", "GSAP"],
      description:
        "Apple macOS landing page clone utilizing 3D canvas rendering, dynamic camera transitions, and complex scroll-triggered timeline animations.",
      img: "/project-images/macClone.png",
      githubUrl: "#",
      liveUrl: "#",
    },
    {
      color: "#131018",
      name: "Smart House Management System",
      year: "2023",
      type: "IoT Platform",
      stack: ["React.js", "Node.js/Express", "MongoDB"],
      description:
        "Full-stack web portal for real-estate smart home management, IoT device parameters, resident ticketing, and automated housing metrics.",
      img: "",
      githubUrl: "#",
      liveUrl: "#",
    },
    {
      color: "#171c1d",
      name: "Defender Bypass",
      year: "2023",
      type: "Security Research",
      stack: ["C++", "Metasploit"],
      description:
        "Extracts Metasploit reverse shell binary concatenated into JPEG files. Designed for payload analysis and security research execution.",
      img: "/project-images/rigelGenerator.png",
      githubUrl: "#",
      liveUrl: "#",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${projectList.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden perspective-[1200px]">
        {projectList.map((item, index) => (
          <PileCard
            key={item.name}
            color={item.color}
            index={index}
            total={projectList.length}
            sectionRef={sectionRef}
          >
            <div className="w-full h-full p-6 md:p-8 flex flex-col justify-between">
              {/* Header */}
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">
                      {item.name}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded border border-white/20 text-white/70">
                      {item.year}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {item.githubUrl && (
                      <a
                        href={item.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs md:text-sm text-white/80 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        Code
                      </a>
                    )}
                    {item.liveUrl && (
                      <a
                        href={item.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs md:text-sm bg-white text-black font-semibold px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-white/50 font-medium mr-1">
                    {item.type} •
                  </span>
                  {item.stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/10"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Main Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1 my-3 overflow-hidden">
                {/* Description */}
                <div className="md:col-span-4 flex flex-col justify-center gap-3">
                  <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                {/* Large Image Showcase */}
                <div className="md:col-span-8 h-full max-h-[380px] w-full bg-black/40 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center relative group">
                  {item.img ? (
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-contain p-2 md:p-4 group-hover:scale-102 transition-transform duration-300 ease-out"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-white/40">
                      <svg
                        className="w-8 h-8 opacity-40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs italic">Preview image coming soon</span>
                    </div>
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