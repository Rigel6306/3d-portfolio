import Card from "./UI/card";
import { useRef } from "react";
import { Globe } from "./UI/globe";
import { motion } from "framer-motion";
import StackIcon from "tech-stack-icons";

const About = () => {
    // Plain useRef — no TS generic here. If this file is really .tsx,
    // restore `useRef<HTMLDivElement>(null)`; in a .jsx file the generic
    // silently parses as a comparison, not a ref, which breaks Card's
    // drag/motion bounds.
    const constraintRef = useRef(null);

    return (
        <section
            id="about"
            className="sticky md:top-20 p-3 pb-10 mt-10 overflow-x-hidden flex flex-col items-center"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-4 md:grid-cols-6 h-full md:h-[calc(100dvh-100px)] 2xl:scale-100 md:w-full xl:w-[75%]"
            >
                {/* Intro */}
                <motion.div className="flex flex-col justify-end items-start h-60 md:h-full row-span-2 md:col-span-3 relative overflow-hidden hover:-translate-y-1 duration-200 grid-default-color">
                    <div className="imgContainer absolute h-full w-full top-0 left-0">
                        <img
                            className="h-full w-full object-cover"
                            src="laptop2.jpg"
                            alt="Charitha working at a laptop"
                        />
                    </div>
                    <p className="z-10 text-2xl md:text-4xl font-semibold">
                        Hi. I'm Charitha Iravana
                    </p>
                    <p className="text-sm z-10 text-gray-400">
                        I'm a full-stack adventurer who loves turning ideas into interactive
                        stories on web and mobile. Whether it's sculpting 3D worlds in
                        Three.js, animating smooth scrolls with GSAP, or weaving React magic
                        into responsive layouts, I thrive on blending code with creativity.
                        My mission? Build apps that don't just work — they delight.
                    </p>
                </motion.div>

                {/* Skills cloud */}
                <motion.div
                    ref={constraintRef}
                    className="flex select-none justify-center items-center row-span-1 md:col-span-3 h-60 md:h-full relative overflow-hidden hover:-translate-y-1 duration-200 bg-gray-200 rounded-2xl p-6"
                >
                    <p className="text-5xl text-black">My Territory</p>

                    <Card text={"Web Development"} constraintRef={constraintRef} delay={0.1} y={[0, 12, 0]} className={"-rotate-10"}>
                        <StackIcon name="affinityphoto" />
                    </Card>
                    <Card text={"React"} constraintRef={constraintRef} delay={0.3} y={[0, -12, 0]} className={"rotate-10 left-1 bottom-4"}>
                        <StackIcon name="react" />
                    </Card>
                    <Card text={"Motion"} constraintRef={constraintRef} delay={0.5} y={[0, 5, 0]} className={"rotate-5 right-2"}>
                        <StackIcon name="motion" />
                    </Card>
                    <Card text={"React Native"} constraintRef={constraintRef} delay={0.2} y={[0, -7, 0]} className={"rotate-10 top-7"}>
                        <StackIcon name="expo" />
                    </Card>
                    <Card text={"ThreeJs"} constraintRef={constraintRef} delay={0.2} y={[0, -7, 0]} className={"right-10 top-17"}>
                        <StackIcon name="threejs" />
                    </Card>
                    <Card text={"NodeJs"} constraintRef={constraintRef} delay={0.2} y={[0, 6, 0]} className={"-rotate-10 right-10 bottom-10"}>
                        <StackIcon name="nodejs" />
                    </Card>
                    <Card text={"Express"} constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 top-20 left-2"}>
                        <StackIcon name="expressjs" />
                    </Card>
                    <Card img="js.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 top-20 right-2"}>
                        <StackIcon name="js" />
                    </Card>
                    <Card img="docker.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 top-10 left-12"}>
                        <StackIcon name="docker" />
                    </Card>
                    <Card img="mongo.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 top-12"}>
                        <StackIcon name="mongodb" />
                    </Card>
                    <Card img="mysql.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 bottom-10"}>
                        <StackIcon name="mysql" />
                    </Card>
                    <Card img="firebase.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 bottom-15 left-30"}>
                        <StackIcon name="firebase" />
                    </Card>
                    <Card img="typescript.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 bottom-15 left-10"}>
                        <StackIcon name="typescript" />
                    </Card>
                    <Card img="Next.js.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 bottom-35 left-30"}>
                        <StackIcon name="nextjs2" />
                    </Card>
                </motion.div>

                {/* Resume download — now an actual functional, accessible link */}
                <motion.a
                    href="/resume.pdf"
                    download
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    aria-label="Download my resume as a PDF"
                    className="flex flex-col items-center justify-center gap-3 row-span-1 md:col-span-1 h-60 md:h-full relative overflow-hidden hover:-translate-y-1 duration-200 bg-black/90 rounded-2xl p-6 text-white cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                    <svg
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
                    <p className="text-2xl z-10">My Resume</p>
                    <span className="text-sm text-gray-400 z-10">Download</span>
                </motion.a>

                {/* Location */}
                <div className="flex items-start row-span-1 md:col-span-2 h-60 md:h-full relative overflow-hidden hover:-translate-y-1 duration-200 bg-[#7298d4] rounded-2xl p-6">
                    <div className="subText z-10">
                        <p className="text-2xl">I'm Located in Mars</p>
                        <p>Open to work anywhere in the globe</p>
                    </div>
                    <figure className="h-80 w-80 absolute top-[30%] -right-[10%]">
                        <Globe />
                    </figure>
                </div>

                {/* Accent panels — currently empty spacer blocks completing the bento
                    grid. Fine as-is if that's the intended look; flagging in case
                    they were meant to hold content later. */}
                <div className="row-span-1 md:col-span-2 h-60 md:h-full relative overflow-hidden hover:-translate-y-1 duration-200 bg-[#644783f5] rounded-2xl p-6" />
                <div className="row-span-1 md:col-span-4 h-60 md:h-full relative overflow-hidden hover:-translate-y-1 duration-200 bg-[#3de9dddd] rounded-2xl p-6" />
            </motion.div>
        </section>
    );
};

export default About;