
import HeroText from "./UI/HeroText.js";
import FluidCanvas from "./UI/fluidCanvas.js";
const Hero = () => {
    return (
        <section id="hero" className="relative h-[100vh] sm:h-[100vh] overflow-x-hidden">
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
                    
                        <HeroText/>
                    {/* <ParalaxBackground/> */}
                    <FluidCanvas/>
                   


        </section>
     );
}

export default Hero;