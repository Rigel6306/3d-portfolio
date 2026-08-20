import { Fragment, useState } from "react";
import { projectsDetails } from "../constants/consts";
import ProjectCard from "./UI/projectCard";

const MyProjects = () => {
    // Default to the first project, and stay safe if the array is ever empty.
    const [current, setCurrent] = useState(projectsDetails[0]);

    return (
        <section className="h-auto mt-10 sm:mt-20 mx-4 sm:mx-8 md:mx-10">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-10">My Projects</h1>
            <div className="projectsContainer flex flex-col md:flex-row w-full relative gap-6 md:gap-10">
                <div className="projectItem w-full md:flex-1 flex flex-col gap-10 md:gap-20">
                    {projectsDetails.map((project, index) => (
                        <Fragment key={project.id}>
                            <ProjectCard setCurrent={setCurrent} project={project} index={index + 1} />
                            {index < projectsDetails.length - 1 && (
                                <div className="bg-transparent bg-linear-to-r from-black via-purple-500 to-black h-[1.2px] w-full" />
                            )}
                        </Fragment>
                    ))}
                </div>

                <div className="hidden md:flex md:flex-1 justify-center relative">
                    <div className="sticky top-24 h-[40vh] rounded-2xl p-6 md:p-10 bg-linear-to-b from-black via-purple-500 to-black w-full md:w-[80%] lg:w-[50%] flex flex-col justify-between">
                        {current && (
                            <>
                                <p className="text-lg sm:text-xl md:text-2xl font-semibold">
                                    {current.title}
                                </p>
                                {current.stack && (
                                    <div className="flex flex-wrap gap-3 text-amber-400 text-sm font-medium">
                                        {current.stack.map((item) => (
                                            <span key={item}>{item}</span>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MyProjects;