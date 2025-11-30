import React, { useRef, memo, useMemo } from 'react';
import type { projectDetails, details } from '../../constants/consts'
import { useInView } from 'motion/react';
import clsx from 'clsx';

type cardProps = {
    project: details,
  
    setCurrent: React.Dispatch<React.SetStateAction<details>>
}
const ProjectCard: React.FC<cardProps> = memo(({ project, setCurrent }) => {


    const ref = useRef(null)
    const inView = useInView(ref, { margin: "-50% 0px -50% 0px" })
    if (inView) {
    setCurrent(prev => prev.id === project.id ? prev : project);
    }

    return (
        <>
            <div ref={ref} className="project flex items-center r h-40" key={project.id}>
                <div className='flex flex-col  items-start'>
                    <p className={`${clsx(inView ? 'text-2xl text-gray-500' : '')} title transition-all duration-400 ease-in `}>{project.title}</p>
                    <div className="stack flex gap-10 text-amber-700 font-semibold">
                        {project.stack.map((item) => (<p key={item}>{item}</p>))}
                    </div>
                    <button className="mt-10">More Details</button>
                </div>
            </div>

        </>
    );
});

export default ProjectCard;