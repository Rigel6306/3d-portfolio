
import { FlipWords } from "./FlipWord";
import { motion } from "motion/react";
const HeroText = () => {


    return (

        <div className="container absolute mx-7 flex flex-col text-left bg-clip-text mt-40 ">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="flex flex-col mx-2 font-semibold text-gray-50 z-100">
                <h1 className="text-4xl  ">Hi, Im Charitha</h1>
                <h2 className="text-2xl">A FullStack Developer crafting </h2>
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2 }}
                className="flipWordContainer my-2 z-100">
                <FlipWords words={['Scalable', 'Innovative', 'Visually Stunning']} duration={1000} className="text-5xl font-medium" /> 
            </motion.div>
            <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            className="flex flex-col mx-2 text-2xl z-100 ">
                <h1>Web and Moible Applications</h1>
                <h2>From pixel perfect interfaces to powerful backend systems.</h2>
            </motion.div>

        </div>
    );
}

export default HeroText;