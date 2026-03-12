import Card from "./UI/card";
import { useRef } from "react";
import { Globe } from "./UI/globe";
import { useScroll,useTransform,motion } from "motion/react";

const About = () => {
    const sectionRef = useRef(null)

    const {scrollYProgress} = useScroll({
        target:sectionRef,
        offset:['start end','start start']
    })
    const scale = useTransform(scrollYProgress,[0,1],[0,1])
    const x = useTransform(scrollYProgress,[0,1],[-100,0])
    const opacity = useTransform(scrollYProgress,[0,1],[0,1])
    const constraintRef = useRef<HTMLDivElement>(null);
    return (

        <section ref={sectionRef} id='about' className="p-4 sm:p-6 md:p-8  overflow-x-hidden flex flex-col items-center bg-green-300 "  >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold my-6 sm:my-10">About Me</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[18rem]  w-full md:w-[80%] lg:w-[70%] xl:w-[60%]
            ">
                {/* Grid item 1 */}
                <motion.div 
                style={{
                    
                    x,
                    opacity
                }}
                className="flex flex-col justify-end items-start row-span-1 md:row-span-2 col-span-1 md:col-span-3 h-60 md:h-full relative overflow-hidden hover:-translate-y-1 duration-200 grid-default-color ">
                    <div className="imgContainer absolute h-full w-full top-0 left-0">
                        <img className=" h-full w-full object-cover" src="laptop2.jpg" alt="" />
                    </div>
                    <p className="z-10 text-md sm:text-xl md:text-4xl font-semibold">Hi. I'm Charitha Iravana </p>
                    <p className="text-xs sm:text-sm md:text-sm z-10 text-gray-400">
                        Self‑motivated Full‑Stack Developer 
                        with 5+ years of experience building 
                        scalable web and mobile applications. 
                        Expert in React, Next.js, Node.js/ 
                        Express, and React Native, delivering 
                        secure APIs and intuitive user 
                        interfaces. Passionate about creating 
                        seamless user experiences with clean, 
                        maintainable code.
                    </p>
                </motion.div>
                {/* Grid item 2 */}
                <motion.div
                    ref={constraintRef}
                    className="flex select-none justify-center items-center row-span-1 col-span-1 md:col-span-3 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                    <p className="text-2xl sm:text-3xl md:text-5xl text-gray-600">Im Experienced In</p>
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
                    <Card img="typescript.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 bottom-15 left-10 h-10! "} />
                    <Card img="Next.js.png" constraintRef={constraintRef} delay={0.4} y={[0, -4, 0]} className={"-rotate-4 bottom-35 left-30 h-10! "} />
                </motion.div>
                {/* Grid item 3 */}
                <div className="flex items-start row-span-1 col-span-1 md:col-span-3 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color2 ">
                    <div className="subText z-10">
                        <p className="text-lg sm:text-xl md:text-2xl">I'm Located in Mars</p>
                        <p className="text-xs sm:text-sm md:text-base">Open to work in anywhere in the globe</p>
                        </div>
                    <figure className="h-60 w-60 sm:h-80 sm:w-80 absolute top-[30%] -right-[10%] ">
                         <Globe/>
                    </figure>

                </div>
                {/* Grid item 4 */}
                <div className="flex items-end row-span-1 col-span-1 md:col-span-2 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                </div>
                {/* Grid item 5 */}
                <div className="flex items-end row-span-1 col-span-1 md:col-span-4 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                </div>
            </div>

        </section>
    );
}

export default About;