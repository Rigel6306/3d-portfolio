import { projectsDetails } from '../constants/consts'
import {  useState } from "react";
import ProjectCard from "./UI/projectCard";
const MyProjects = () => {

    const [current, setCurrent] = useState({...projectsDetails[1]})

    console.log(current)
    return (
        <section className="h-auto md:h-[450vh] mt-10 sm:mt-20 mx-4 sm:mx-8 md:mx-10  ">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-10">My Projects</h1>
            <div className="projectsContainer flex flex-col md:flex-row w-full relative gap-6 md:gap-10">
                <div className="projectItem w-full md:flex-1 flex flex-col gap-10 md:gap-20">
                    {
                        projectsDetails.map((project) => (
                            <>

                        <ProjectCard key={project.id}  setCurrent={setCurrent} project={project} />
                           <div className=" bg-transparent bg-linear-to-r from-black via-purple-500 to-black-500 h-[1.2px] w-full"></div>
                        </>
                    ))
                    }

                </div>
                <div className="hidden md:flex md:flex-1 justify-center relative">
                    <div className=" sticky lg:top-70 h-[20%] rounded-2xl p-6 md:p-10 bg-linear-to-b from-black via-purple-500 to-black-500  w-full md:w-[80%] lg:w-[50%]">
                        <p className="text-lg sm:text-xl md:text-2xl font-semibold">{current.title}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default MyProjects;