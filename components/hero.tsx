
import { Canvas } from "@react-three/fiber";
import ComputerSetup from '../public/models/Gaming_setup.jsx'
import { OrbitControls } from "@react-three/drei";

const Hero = () => {
    return ( 
        <section id="hero">
                <div className="heroContainer h-screen">
                    <h1>Bridging Logic and Aesthetics. Fullstack in Action</h1>
                    <Canvas id="canvas" camera={{position:[0,2,5],fov:50,near:0.1,far:100}} gl={{antialias:true}} dpr={[1,2]}>
                        <OrbitControls enableZoom={false}/>
                        <ComputerSetup scale={0.3} position={[0,0,0]}/>
                        <spotLight/>
                    </Canvas>
                </div>
        </section>
     );
}
 
export default Hero;