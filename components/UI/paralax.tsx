import { useRef } from "react";
import { motion,useScroll,useTransform } from "motion/react";



const ParalaxBackground = () => {

  const {scrollYProgress} = useScroll()
  const layer1X= useTransform(scrollYProgress,[0,0.5],["0%","-100%"])
  const layer2X= useTransform(scrollYProgress,[0,0.5],["0%","70%"])
  return (

    <section id="paralaxBg" className="relative h-[150vh] overflow-x-hidden">
        
      
      <div className="absolute inset-0 bg-black/40 z-40 h-screen"> 
        <motion.div className="absolute  inset-0 w-full h-screen -z-50"
          style={{
            backgroundImage: 'url(/paralax/l11.png)',
            backgroundSize: 'cover',
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
           
          }} />
        <motion.div className="absolute  inset-0 w-full h-screen -z-20"
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5 }}
          style={{
            backgroundImage: 'url(/paralax/l1.png)',
            backgroundSize: 'cover',
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
             x:layer1X
          }} />
        <motion.div className="absolute  inset-0 w-full h-screen -z-30"
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5 }}
          style={{
            backgroundImage: 'url(/paralax/l2.png)',
            backgroundSize: 'cover',
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            x:layer2X
          }} />
        <motion.div className="absolute  inset-0 w-full h-screen -z-10"
          initial={{ opacity: 0, y: 200 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2 }}
          style={{
            backgroundImage: 'url(/paralax/l3.png)',
            backgroundSize: 'cover',
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }} />
      </div>
    </section>
  );
}

export default ParalaxBackground;