import { p, section } from "motion/react-client";
import { projectsDetails } from '../constants/consts'
import { useRef, useState } from "react";
import { useInView } from "motion/react";
import ProjectCard from "./UI/projectCard";

const MyProjects = () => {

    const [current, setCurrent] = useState({...projectsDetails[1]})
   
    console.log(current)
    return (
        <section className="h-[450vh] mt-20 mx-10 ">
            <h1 className="text-3xl">My Projects</h1>
            <div className="projectsContainer flex w-full   gap-10">
                <div className="projectItem flex-1 flex flex-col gap-20">
                    {
                        projectsDetails.map((project) => (
                            <>
                            
                        <ProjectCard key={project.id}  setCurrent={setCurrent} project={project} />
                           <div className=" bg-transparent bg-linear-to-r from-black via-purple-500 to-black-500 h-[1.2px] w-"></div>
                        </>
                    ))
                    }
                    
                </div>
                <div className="hidden preview md:flex flex-1 justify-center relative">
                    <div className=" sticky lg:top-70  h-[20%] rounded-2xl p-10 bg-linear-to-b from-black via-purple-500 to-black-500  w-[50%]">
                        <p>{current.title}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MyProjects;