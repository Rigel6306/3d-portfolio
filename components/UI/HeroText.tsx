
import { FlipWords } from "./FlipWord";
import { motion } from "motion/react";
import { MorphingText } from "./morphingText";
const HeroText = () => {


    return (

        <div className="container absolute flex flex-col text-left bg-clip-text mt-20 sm:mt-40 px-4 sm:px-6 max-w-full sm:max-w-2xl ">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="flex flex-col font-semibold z-100">
                <h1 className="text-2xl sm:text-3xl md:text-4xl ">Hi, Im Charitha</h1>
                <h2 className="text-lg sm:text-xl md:text-2xl mt-2">A FullStack Developer crafting </h2>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2 }}
                className="flipWordContainer my-4 sm:my-1 z-100">
                {/* <FlipWords words={['Scalable', 'Innovative', 'Visually Stunning']} duration={1000} className="text-5xl font-medium" />  */}
                <MorphingText texts={['Scalable', 'Innovative', 'Visually Stunning']} className="text-4xl sm:text-5xl 3xl:text-3xl md:text-4xl w-200 font-medium text-start"/>
            </motion.div>
            <motion.div
                 initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            className="flex flex-col font-semibold text-sm sm:text-lg md:text-2xl z-100 mt-2 sm:mt-3">
                <h1>Web and Mobile Applications</h1>
                <h2 className="text-xs sm:text-sm md:text-base text-gray-400">From pixel perfect interfaces to powerful backend systems.</h2>
            </motion.div>

        </div>
    );
}

export default HeroText;