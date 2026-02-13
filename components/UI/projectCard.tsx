import React, { useRef, memo, useState, useEffect } from 'react';
import type {  details } from '../../constants/consts'
import { AnimatePresence, useInView } from 'motion/react';
import clsx from 'clsx';
import ProjectModal from './projectModel';
type cardProps = {
    project: details,
    setCurrent: React.Dispatch<React.SetStateAction<details>>
}
const ProjectCard: React.FC<cardProps> = memo(({ project, setCurrent }) => {

    const [isModelOpen, setIsModelOpen] = useState(false)
    const ref = useRef(null)
    const inView = useInView(ref, { margin: "-50% 0px -50% 0px" })

    useEffect(()=>{
  if (inView) {
        setCurrent(prev => prev.id === project.id ? prev : project);
    }
    },[inView,project,setCurrent])

    console.log("is Model", isModelOpen)

    return (
        <>
            <div ref={ref} onMouseOver={()=>{setCurrent(prev=>prev.id===project.id?prev:project)}} className="project relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 h-auto sm:h-40 py-4 sm:py-0" key={project.id}>
                <div className='flex flex-col items-start gap-2 sm:gap-0'>
                    <p className={`${clsx(inView ? 'text-xl sm:text-2xl text-gray-500' : 'text-base sm:text-lg')} title transition-all duration-400 ease-in `}>{project.title}</p>
                    <div className="stack flex flex-wrap gap-4 sm:gap-10 text-amber-700 font-semibold text-sm sm:text-base">
                        {project.stack.map((item) => (<p key={item}>{item}</p>))}
                    </div>
                    <button onClick={() => setIsModelOpen(true)} className="mt-4 sm:mt-10 px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-base hover:text-gray-400 transition-colors">More Details</button>
                </div>


                <AnimatePresence>
                    {isModelOpen && <ProjectModal setIsOpen={setIsModelOpen} />}
                </AnimatePresence>

            </div>

        </>
    );
});

export default ProjectCard;