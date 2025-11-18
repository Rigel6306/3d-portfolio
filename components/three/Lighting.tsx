import { Environment, Lightformer } from "@react-three/drei";
const Lighting = () => {

    return ( 
        <group>
            <Environment >
                 <Lightformer
                        form="rect"
                        intensity={1}
                        position={[-10, 5, -5]}
                        scale={10}
                        rotation-y={Math.PI / 2}
                    />

                    <Lightformer
                        form="rect"
                        intensity={4}
                        position={[10, 0, 1]}
                        scale={10}
                        rotation-y={Math.PI / 2}
                    />
            </Environment>
             <spotLight
           position={[-2,10,15]}
           angle={0.15}
           decay={0}
           intensity={Math.PI *0.2}
           />

            <spotLight
           position={[0,-25,10]}
           angle={0.15}
           decay={0}
           intensity={Math.PI *0.2}
           />

            <spotLight
           position={[0,15,5]}
           angle={0.15}
           decay={0}
           intensity={Math.PI *1}
           />


        </group>
     );
}
 
export default Lighting;