import { useMemo, useRef } from "react"
import About from "components/about"
import { motion, useScroll, useTransform } from 'framer-motion'
import StickyCards from "./stickyCards"
import '../../app/styles/parallax.css'
import ProjectShowcase from "./projectSchowcase"

const IMG_PADDING = 42

export const TextParallaxContentContainer = () => {
    // Static tree: built once so scroll-unrelated re-renders don't rebuild
    // About / StickyCards. Animations run on motion values, not React state.
    return useMemo(() => (
        <div className="bg-linear-to-b from-[#060606fe] via-[#141716c7] to-[#0000]">
            <TextParallaxContent
                img={'/parallax1.jpg'}
                subHeading={"Hello there, delightful essence"}
                heading={"Welcome!"}
            >
                <div className="aboutUsSection">
                    <h1 className="parallaxPageHeading text-white">About Me</h1>
                    <div className="aboutContainer h-[200vh]">
                        <About />
                    </div>
                </div>
            </TextParallaxContent>

            <TextParallaxContent
                img={'/parallax2.jpg'}
                subHeading={"I do witchery in"}
                heading={"Web and Mobile Development"}
            >
                <div className="servicesSection   h-[400vh]  ">
                    <ProjectShowcase/>
                </div>
            </TextParallaxContent>

            <TextParallaxContent
                img={'/parallax3.jpg'}
                subHeading={"Hire Me"}
                heading={"charitha1@live.com"}
            >
                <div />
            </TextParallaxContent>
        </div>
    ), [])
}

interface TextParalaxPropsType {
    img: string,
    subHeading: string,
    heading: string,
    children?: React.ReactNode
}

const TextParallaxContent = ({ img, subHeading, heading, children }: TextParalaxPropsType) => {
    return (
        <div className="mt-10 w-full max-w-full overflow-clip">
            <div className='relative h-[150vh]  p-3'>
                <StickyImage img={img} />
                <TextOverlay heading={heading} subHeading={subHeading} />
            </div>
            {children}
        </div>
    )
}

const StickyImage = ({ img }: { img: string }) => {
    const refTarget = useRef<HTMLDivElement | null>(null)
    const { scrollYProgress } = useScroll({
        target: refTarget,
        offset: ["end end", "end start"]
    })

    // scale and opacity used the exact same mapping, so compute it once
    const scale = useTransform(scrollYProgress, [0, 1], [1, 0])
    const opacity = scale

    return (
        <motion.div
            style={{
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                height: `calc(97vh - ${IMG_PADDING * 2}px)`,
                top: 100,
                scale,
                willChange: "transform",
            }}
            ref={refTarget}
            className='sticky z-0 overflow-hidden rounded-3xl'
        >
            <motion.div
                style={{ opacity }}
                className="absolute inset-0 bg-neutral-950/60 rounded-3xl"
            />
        </motion.div>
    )
}

const TextOverlay = ({ heading, subHeading }: { heading: string; subHeading: string }) => {
    const refTarget = useRef<HTMLDivElement | null>(null)
    const { scrollYProgress } = useScroll({
        target: refTarget,
        offset: ["start end", "end start"]
    })
    const y = useTransform(scrollYProgress, [0, 1], [250, -250])
    const opacity = useTransform(scrollYProgress, [0.10, 0.50, 0.75], [0, 1, 0])

    return (
        <motion.div
            ref={refTarget}
            // promote to its own compositor layer so y/opacity don't trigger repaints
            style={{ y, opacity, willChange: "transform, opacity" }}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex w-full flex-col items-center justify-center"
        >
            <div className="overlaySubHead mb-2 text-center text-sm sm:text-[3rem]  ">{subHeading}</div>
            <div className="overlayHead text-center text-3xl sm:text-[6rem] font-bold ">{heading}</div>
        </motion.div>
    )
}