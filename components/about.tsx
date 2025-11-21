import Card from "./UI/card";
import { useRef } from "react";
const About = () => {
    const constraintRef = useRef<HTMLDivElement>(null);
    return (

        <section id='about' className="p-3 mt-20 "  >
            <h2 className="text-4xl font-semibold">About Me</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[18rem]">
                {/* Grid item 1 */}
                <div className="flex flex-col justify-end items-start  row-span-2 md:col-span-3 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                    <div className="imgContainer absolute h-full w-full  top-0 left-0">
                        <img className=" h-full w-full object-cover" src="laptop.jpg" alt="" />
                    </div>
                    <p className="z-10 text-4xl font-semibold">Hi. I'm Charitha Iravana </p>
                    <p className="text-sm z-10 text-gray-400">I’m a full‑stack adventurer who loves turning ideas into interactive stories on web and mobile. Whether it’s sculpting 3D worlds in Three.js, animating smooth scrolls with GSAP, or weaving React magic into responsive layouts, I thrive on blending code with creativity. My mission? Build apps that don’t just work — they delight</p>
                </div>
                {/* Grid item 2 */}
                <div
                    ref={constraintRef}
                    className="flex select-none  justify-center items-center row-span-1 md:col-span-3 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                    <p className="text-5xl text-gray-600">Im Experienced In</p>
                    <Card text={"Web Development"} constraintRef={constraintRef} delay={0.1} y={[0, 12, 0]} className={"-rotate-10"} />
                    <Card text={"React"} constraintRef={constraintRef} delay={0.3} y={[0, -12, 0]} className={"rotate-10 left-1 bottom-4"} />
                    <Card text={"Motion"} constraintRef={constraintRef} delay={0.5} y={[0, 5, 0]} className={"rotate-5 right-2  "} />
                    <Card text={"React Native"} constraintRef={constraintRef} delay={0.2} y={[0, -7, 0]} className={"rotate-10  top-7"} />
                    <Card text={"ThreeJs"} constraintRef={constraintRef} delay={0.2} y={[0, -7, 0]} className={" right-10  top-17"} />
                    <Card text={"NodeJs"} constraintRef={constraintRef} delay={0.2} y={[0, 6, 0]} className={"-rotate-10 right-10  bottom-10"} />
                    <Card text={"Express"} constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 top-20 left-2"} />
                    <Card img="js.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 top-20 right-2"} />
                    <Card img="docker.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 top-10 left-12"} />
                    <Card img="mongo.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 top-12 "} />
                    <Card img="mysql.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 bottom-10 "} />
                    <Card img="firebase.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 bottom-15 left-30 "} />
                    <Card img="typescript.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 bottom-15 left-30 h-10! "} />
                </div>
                {/* Grid item 3 */}
                <div className="flex items-end row-span-1 md:col-span-3 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                </div>
                {/* Grid item 4 */}
                <div className="flex items-end row-span-1 md:col-span-2 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                </div>
                {/* Grid item 5 */}
                <div className="flex items-end row-span-1 md:col-span-4 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                </div>
            </div>

        </section>
    );
}

export default About;