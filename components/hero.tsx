
import { Canvas } from "@react-three/fiber";
import ComputerSetup from './three/models/Gaming_setup.js'
import { OrbitControls } from "@react-three/drei";
import Lighting from "./three/Lighting.js";
import { Suspense } from "react";
import { Html,useProgress } from "@react-three/drei";
import HeroText from "./UI/HeroText.js";
import ParalaxBackground from "./UI/paralax.js";
const Loading = ()=>{
  const { progress } = useProgress();
  return <Html center style={{width:200}}>{`${progress.toFixed(0)}% loading`}</Html>;
}
const Hero = () => {
    return ( 
        <section id="hero" className=" h-[150vh]  verflow-hidden ">
                {/* <div className="heroContainer h-screen">
                    <h1>Bridging Logic and Aesthetics. Fullstack in Action</h1>
                          
                    <Canvas id="canvas" camera={{position:[0,2,5],fov:50,near:0.1,far:100}} gl={{antialias:true}} dpr={[1,2]}>
                      
                        <OrbitControls enableZoom={false}/>
                           <Suspense fallback={<Loading/>}>      
                        <ComputerSetup scale={0.3} position={[0,0,0]}/>
                        <Lighting/>
                        </Suspense>
                    </Canvas>
                    
                </div> */}
                    <div className="stickyContainer  sticky top-0  h-screen ">
                        <HeroText/>
                    <ParalaxBackground/>
                    </div>
                   
             
                
               
        </section>
     );
}
 
export default Hero;