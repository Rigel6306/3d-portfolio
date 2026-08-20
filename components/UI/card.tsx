
import { motion } from "motion/react";
import type { RefObject } from "react";
type cardProps ={
    text?:string,
    className:string,
    constraintRef:RefObject<HTMLDivElement|null>,
    delay?:number,
    y?:[number,number,number],
    img?:string,
    children?:React.ReactNode
}
const Card = ({text,className,constraintRef, delay,y,img,children}:cardProps) => {

    return (
        <>
      
        <motion.div
            drag
            dragConstraints={constraintRef}
            dragElastic={0.1}
            whileDrag={{ scale: 1.1, rotate: 2,  }}
            animate={{
                y: y,
                rotate: [1, -2, -2, 1],
                scale: [1, 1.02, 0.98, 1]
            }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" ,delay:delay}}
         className={`h-12 w-12 sm:h-12 sm:w-12 md:h-12 md:w-12 cursor-grab bg-white/80 p-2 rounded-2xl absolute ${className}`}>
            {children}
        </motion.div>
        </>
     );
}

export default Card;