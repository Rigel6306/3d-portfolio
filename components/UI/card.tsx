
import { motion } from "motion/react";
import type { RefObject } from "react";
type cardProps ={
    text?:string,
    className:string,
    constraintRef:RefObject<HTMLDivElement|null>,
    delay?:number,
    y?:[number,number,number],
    img?:string
}
const Card = ({text,className,constraintRef, delay,y,img}:cardProps) => {

    return ( 
        <>
       { img?<motion.img 
        src={img} 
        className={`h-15 cursor-grab absolute ${className}`  }
         drag
            dragConstraints={constraintRef}
            dragElastic={0.1}
            whileDrag={{ scale: 1.1, rotate: 2,  }}
            animate={{ 
                y: y, 
                rotate: [0, 2, -2, 0], 
                scale: [1, 1.02, 0.98, 1] 
            }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" ,delay:delay}}
        />
        :
        <motion.div
            drag
            dragConstraints={constraintRef}
            dragElastic={0.1}
            whileDrag={{ scale: 1.1, rotate: 2,  }}
            animate={{ 
                y: y, 
                rotate: [0, 2, -2, 0], 
                scale: [1, 1.02, 0.98, 1] 
            }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" ,delay:delay}}
         className={`cardContainer cursor-grab font-semibold text-gray-50 absolute w-40 flex items-center justify-center bg-linear-to-r from-gray-500 to-black-600 p-2 rounded-4xl ${className}`}>
            <p style={{willChange:"transform"}} >{text}</p>
        </motion.div>}
        </>
     );
}
 
export default Card;