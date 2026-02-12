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
            <div ref={ref} onMouseOver={()=>{setCurrent(prev=>prev.id===project.id?prev:project)}} className="project relative flex items-center r h-40" key={project.id}>
                <div className='flex flex-col  items-start'>
                    <p className={`${clsx(inView ? 'text-2xl text-gray-500' : '')} title transition-all duration-400 ease-in `}>{project.title}</p>
                    <div className="stack flex gap-10 text-amber-700 font-semibold">
                        {project.stack.map((item) => (<p key={item}>{item}</p>))}
                    </div>
                    <button onClick={() => setIsModelOpen(true)} className="mt-10">More Details</button>
                </div>


                <AnimatePresence>
                    {isModelOpen && <ProjectModal setIsOpen={setIsModelOpen} />}
                </AnimatePresence>

            </div>

        </>
    );
});

export default ProjectCard;