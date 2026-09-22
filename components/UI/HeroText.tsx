
import { FlipWords } from "./FlipWord";
import { motion } from "motion/react";
import { MorphingText } from "./morphingText";
const HeroText = () => {


    return (

        <div className="container absolute flex flex-col text-left bg-clip-text mt-28 sm:mt-44 px-6 sm:px-10 max-w-full sm:max-w-2xl text-white">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="flex flex-col font-semibold z-100">
                <h1 className="text-4xl sm:text-6xl md:text-6xl font-extrabold leading-[.95] tracking-wide">Hi, I'm Charitha.</h1>
                <p className="hero-kicker text-[#2dfcbb]">Full-stack developer</p>
                <h2 className="text-xl sm:text-2xl md:text-3xl mt-1 font-medium">I build digital experiences with a pulse.</h2>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2 }}
                className="flipWordContainer my-5 z-100">
                {/* <FlipWords words={['Scalable', 'Innovative', 'Visually Stunning']} duration={1000} className="text-5xl font-medium" />  */}
                <MorphingText texts={['Scalable', 'Innovative', 'Visually Stunning']} className="text-sm sm:text-xl md:text-xl w-full font-medium text-start text-(--mint)"/>
            </motion.div>
            <motion.div
                 initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            className="flex flex-col font-semibold text-sm sm:text-lg md:text-2xl z-100 mt-2 sm:mt-3">
                <p className="hero-copy text-sm sm:text-base">From pixel-perfect interfaces to powerful backend systems, I turn ambitious ideas into products people want to use.</p>
                <div className="flex flex-wrap items-center gap-5 mt-2"><a className="hero-cta" href="#about">Explore my work <span aria-hidden="true">↓</span></a><a className="hero-ghost" href="mailto:charitha1@live.com">Let's talk</a></div>
            </motion.div>

        </div>
    );
}

export default HeroText;