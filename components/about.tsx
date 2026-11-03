import Card from "./UI/card";
import { useRef, useState } from "react";
import StackIcon from "tech-stack-icons";
import { Globe } from "./UI/globe";
import { motion, useInView } from "motion/react";
import "../app/styles/bento.css";
import DesignCursor from "./UI/designCursor";
import {
  MdEmail,
  MdCall,
  MdWhatsapp,
  MdContentCopy,
  MdCheck,
} from "react-icons/md";

import { FaGithub, FaLinkedin } from "react-icons/fa";

// Static data, so it isn't rebuilt on every render.
const toolkitIcons: Array<{
  name: string;
  label: string;
  short: string;
  delay: number;
  y: [number, number, number];
}> = [
  { name: "docker", label: "Docker", short: "D", delay: 0.05, y: [0, -4, 0] },
  { name: "typescript", label: "TypeScript", short: "TS", delay: 0.1, y: [0, 4, 0] },
  { name: "nextjs2", label: "Next.js", short: "N", delay: 0.15, y: [0, -4, 0] },
  { name: "js", label: "JavaScript", short: "JS", delay: 0.2, y: [0, 4, 0] },
  { name: "expressjs", label: "Express", short: "EX", delay: 0.25, y: [0, -4, 0] },
  { name: "react", label: "React", short: "R", delay: 0.3, y: [0, 4, 0] },
  { name: "expo", label: "React Native", short: "RN", delay: 0.35, y: [0, -4, 0] },
  { name: "threejs", label: "Three.js", short: "3D", delay: 0.4, y: [0, 4, 0] },
  { name: "motion", label: "Motion", short: "M", delay: 0.45, y: [0, -4, 0] },
  { name: "affinityphoto", label: "Design", short: "UX", delay: 0.5, y: [0, 4, 0] },
  { name: "mongodb", label: "MongoDB", short: "MD", delay: 0.55, y: [0, -4, 0] },
  { name: "mysql", label: "MySQL", short: "SQL", delay: 0.6, y: [0, 4, 0] },
  { name: "nodejs", label: "Node.js", short: "Node", delay: 0.65, y: [0, -4, 0] },
  { name: "firebase", label: "Firebase", short: "FB", delay: 0.7, y: [0, 4, 0] },
];

/**
 * ONE <DesignCursor> directs the whole section.
 *
 * The order the cursor works in is simply the order of the markup below.
 * Elements opt in with data attributes (no wrapper elements, so layout,
 * sticky and Motion behave exactly as before):
 *
 *   data-dc="card"      a big surface   -> slower drag, handles + size tag
 *   data-dc             a detail inside -> quicker
 *   data-dc-name="..."  label on the selection tag
 *
 * The toolkit icons are matched by `quickSelector` and are drawn in rapid
 * succession with no tags.
 */
const About = () => {
  const constraintRef = useRef<HTMLDivElement>(null);

  const isToolkitInView = useInView(constraintRef, {
    amount: 0.3,
    margin: "150px 0px",
    once: false,
  });

  const EMAIL = "charitha1@live.com";
  const PHONE_DISPLAY = "+94 77 3700 779";
  const WHATSAPP_URL = "https://wa.me/94773700779";

  const [copied, setCopied] = useState<"email" | "phone" | null>(null);

  const handleCopy = async (value: string, key: "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS) — the link itself still works.
    }
  };

  return (
    <DesignCursor
      style={{ position: "sticky" }}
      className="md:top-20 mt-10"
      label="Charitha"
      color="#7c5cff"
      speed={1.6}
      startDelay={400}
      selector="[data-dc], .toolkit-grid > *"
      quickSelector=".toolkit-grid > *"
    >
      <section
        id="about"
        className="p-3 pb-10 overflow-x-hidden flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bento-grid grid grid-cols-1 gap-4 md:grid-cols-6 h-full md:h-[calc(100dvh-100px)] 2xl:scale-100 md:w-full xl:w-[75%]"
        >
          {/* Intro */}
          <motion.div
            data-dc="card"
            data-dc-name="hero"
            className="bento-card bento-intro flex flex-col justify-end items-start h-60 md:h-full row-span-2 md:col-span-3 relative overflow-hidden p-6 text-white"
          >
            <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-[#8d8d977a] blur-3xl" />

            <div className="imgContainer absolute h-full w-full top-0 left-0">
              <img
                className="h-full w-full object-cover opacity-55"
                src="laptop2.jpg"
                alt="Charitha working at a laptop"
              />
            </div>

            <p
              data-dc
              data-dc-name="h1"
              className="z-10 text-2xl md:text-4xl font-extrabold tracking-tight"
            >
              Hi. I'm Charitha Iravana
            </p>

            <p
              data-dc
              data-dc-name="text"
              className="text-sm z-10 text-white/70 leading-relaxed mt-3"
            >
              I'm a full-stack adventurer who loves turning ideas into interactive
              stories on web and mobile. Whether it's sculpting 3D worlds in
              Three.js, animating smooth scrolls with GSAP, or weaving React magic
              into responsive layouts, I thrive on blending code with creativity.
              My mission? Build apps that don't just work — they delight.
            </p>
          </motion.div>

          {/* Skills cloud */}
          <motion.div
            data-dc="card"
            data-dc-name="card"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="bento-card bento-focus row-span-1 md:col-span-3 min-h-[120px]  relative overflow-hidden p-6 flex flex-col justify-between border border-white/10 bg-[#9daddf] rounded-2xl group shadow-sm hover:shadow-md transition-all"
          >
            <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-[#010101ae] blur-3xl" />

            <div data-dc data-dc-name="heading">
              <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Building with intent.
              </h2>
            </div>

            <div data-dc data-dc-name="text" className="my-3">
              <p className="text-sm leading-relaxed text-gray-700 tracking-wide font-normal">
                Crafting human-centered digital experiences through accessible interfaces, tactile motion, and resilient systems turning complex engineering into intuitive user interactions.
              </p>
            </div>

            <div
              data-dc
              data-dc-name="tags"
              className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5"
            >
              <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                Accessibility
              </span>
              <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                Fluid Motion
              </span>
              <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                System Design
              </span>
            </div>
          </motion.div>

          {/* Resume download */}
          <motion.a
            data-dc="card"
            data-dc-name="button"
            href="/resume.pdf"
            download
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            aria-label="Download my resume as a PDF"
            className="bento-card bento-resume flex flex-col items-center justify-center gap-3 row-span-1 md:col-span-1 h-60 md:h-full relative overflow-hidden p-6 text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-[#4545467a] blur-3xl" />

            <svg
              data-dc
              data-dc-name="icon"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="z-10"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            <p data-dc data-dc-name="label" className="text-2xl z-10 font-extrabold">
              My resume
            </p>
            <span data-dc className="text-sm text-white/60 z-10">
              PDF / download
            </span>
          </motion.a>

          {/* Location */}
          <div
            data-dc="card"
            data-dc-name="card"
            className="bento-card bento-location flex items-start row-span-1 md:col-span-2 h-60 md:h-full relative overflow-hidden p-6"
          >
            <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-[#050505f6] blur-3xl" />
            <div data-dc data-dc-name="text" className="subText z-10">
              <p className="text-2xl font-extrabold">Based in Earth</p>
              <p className="mt-2 text-sm text-(--ink)/70">
                Available for every time zones. whenever, wherever.
              </p>
            </div>
            <figure
              data-dc
              data-dc-name="globe"
              className="h-80 w-80 absolute top-[30%] -right-[10%]"
            >
              <Globe />
            </figure>
          </div>

          {/* Toolkit */}
          <motion.div
            ref={constraintRef}
            data-dc="card"
            data-dc-name="card"
            className="  bento-card bento-toolkit select-none row-span-1 md:col-span-4 h-60 md:h-full relative overflow-hidden p-6 flex flex-col gap-4"
          >
            <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-[#4545467a] blur-3xl" />

            <div data-dc data-dc-name="heading">
              <p className="text-2xl font-extrabold text-(--ink)">My territory</p>
            </div>

            {/* each direct child of .toolkit-grid is picked up by quickSelector */}
            <div className="toolkit-grid flex-1 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3 sm:gap-4 place-items-center content-center">
              {toolkitIcons.map((icon) => (
                <Card
                  key={icon.name}
                  text={icon.label}
                  constraintRef={constraintRef}
                  delay={icon.delay}
                  y={icon.y}
                  active={isToolkitInView}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <StackIcon
                      name={icon.name as any}
                      className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 drop-shadow-sm"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            data-dc="card"
            data-dc-name="card"
            className="bento-card bento-contact row-span-1 md:col-span-2 h-auto min-h-[240px] relative overflow-hidden p-6 text-white flex flex-col justify-between"
          >
            <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-[#4545467a] blur-3xl" />

            <div
              data-dc
              data-dc-name="heading"
              className="relative flex flex-col items-center justify-center"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold tracking-tight">Have a good idea?</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Typically responds in under 1 hour
              </p>
              <div className="h-px bg-white/10 my-4" />
            </div>

            <div className="relative flex flex-col justify-center items-center gap-2 text-sm">
              {/* Email */}
              <div
                data-dc
                data-dc-name="input"
                className="flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 transition-colors rounded-md pl-3 pr-1.5 py-1.5 w-50"
              >
                <a
                  href={`mailto:${EMAIL}`}
                  className="flex items-center gap-2 min-w-0 text-white text-xs font-medium"
                >
                  <MdEmail size={18} className="text-gray-300 shrink-0" />
                  <span className="truncate">{EMAIL}</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(EMAIL, "email")}
                  aria-label="Copy email address"
                  className="shrink-0 p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copied === "email" ? <MdCheck size={14} /> : <MdContentCopy size={14} />}
                </button>
              </div>

              {/* Phone / WhatsApp */}
              <div
                data-dc
                data-dc-name="input"
                className="flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 transition-colors rounded-md pl-3 pr-1.5 py-1.5 w-50"
              >
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 min-w-0 text-white text-xs font-medium"
                >
                  <span className="flex items-center gap-1 text-gray-300 shrink-0">
                    <MdCall size={16} />
                    <MdWhatsapp size={16} />
                  </span>
                  <span className="truncate">{PHONE_DISPLAY}</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(PHONE_DISPLAY, "phone")}
                  aria-label="Copy phone number"
                  className="shrink-0 p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copied === "phone" ? <MdCheck size={14} /> : <MdContentCopy size={14} />}
                </button>
              </div>
            </div>

            <div
              data-dc
              data-dc-name="links"
              className="relative flex items-center justify-center gap-4 pt-4 mt-1 text-gray-300"
            >
              <a
                className="flex items-center gap-1.5 hover:text-white transition-colors text-xs font-medium"
                href="https://github.com/Rigel6306"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
              >
                <FaGithub size={16} />
                <span>GitHub</span>
              </a>
              <span className="text-gray-600">•</span>
              <a
                className="flex items-center gap-1.5 hover:text-white transition-colors text-xs font-medium"
                href="https://www.linkedin.com/in/charitha-iravana/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
              >
                <FaLinkedin size={16} />
                <span>LinkedIn</span>
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </DesignCursor>
  );
};

export default About;