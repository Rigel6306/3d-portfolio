

const IMG_PADDING = 42
import { useRef,useMemo, useState } from "react"
import About from "components/about"
import { motion, useScroll, useTransform } from 'framer-motion'
import StickyCards from "./stickyCards"
import '../../app/styles/parallax.css'

export const TextParallaxContentContainer = () => {

    const parallexMemoized  = useMemo(()=>(
    
    <div > 
            <TextParallaxContent
            
                img={'/parallax1.jpg'}
                subHeading={"Hello there, delightful essence"}
                heading={"Welcome!"}
            >       
                <div className="aboutUsSection">
                    <h1 className="parallaxPageHeading text-white">About Me</h1>
                   <About/>
                </div>   
        </TextParallaxContent >

        <TextParallaxContent
            img={'/parallax2.jpg'}
            subHeading={"I do witchery in"}
            heading={"Web and Mobile Development"}
        >
            <div className="servicesSection  bg-linear-to-b from-white-300 h-[600vh]  via-gray-600 to-gray-100">
              
                <StickyCards />
                
               
            </div>
        </TextParallaxContent> 
                                                            
        <TextParallaxContent
            img={'/parallax3.jpg'}
            subHeading={"Hire Me"}
            heading={"charitha1@live.com"}
        >             
            <p>Footer Comming Soon</p>
        </TextParallaxContent>
    </div>),[]
)
    return parallexMemoized

}

const TextParallaxContent = ({ img, subHeading, heading, children }) => {

    return (
        <div className="mt-10 w-full max-w-full overflow-clip" style={{
            
           
            
        }} >
            <div className='relative h-[150vh]  p-3'>
                <StickyImage img={img} />
                <TextOverlay heading={heading} subHeading={subHeading} />
            </div>
            {children}
        </div>
    )
}

const StickyImage = ({ img }:any) => {
    const refTarget = useRef(null)
    const { scrollYProgress } = useScroll({
        target: refTarget,
        offset: ["end end", "end start"]
    })

    const scale = useTransform(scrollYProgress, [0, 1], [1, 0])
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])

    return (
        <motion.div
            style={{
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                height: `calc(97vh - ${IMG_PADDING * 2}px)`,
                top: 100,
                scale,
                willChange:"transform",
            }}
            ref={refTarget}
            className='sticky z-0 overflow-hidden rounded-3xl'
        >
            <motion.div
                style={{
                    opacity
                }}
                className="absolute inset-0 bg-neutral-950/60 rounded-3xl"
            />
        </motion.div>
    )
}

const TextOverlay = ({ heading, subHeading }) => {

    const refTarget = useRef(null)
    const { scrollYProgress } = useScroll({
        target: refTarget,
        offset: ["start end", "end start"]
    })
    const y = useTransform(scrollYProgress, [0, 1], [250, -250])
    const opacity = useTransform(scrollYProgress, [0.10, 0.50, 0.75], [0, 1, 0])
    return (
        <motion.div
            ref={refTarget}
            style={{ y, opacity }}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex w-full flex-col items-center justify-center"
        >
            <div className="overlaySubHead mb-2 text-center text-sm sm:text-[3rem]  ">{subHeading}</div>
            <div className="overlayHead text-center text-3xl sm:text-[6rem] font-bold ">{heading}</div>
        </motion.div>
    )
}