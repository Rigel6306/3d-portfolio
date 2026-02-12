import { motion, AnimatePresence } from "motion/react";
import type React from "react";
type ProjectModalProps = {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
const ProjectModal: React.FC<ProjectModalProps> = ({ setIsOpen }) => {
    return (
        <>
            <motion.div

                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="modelContainer flex justify-center  inset-0 left-0 fixed top-20 h-screen w-full z-50 backdrop-blur-lg overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="projectModelDetails w-[90vw] mt-10 h-[80vh] bg-gray-700/70 border rounded-2xl shadow-[0_0_20px_rgba(73,201,212,0.6)] border-white/10"
                >
                    <button onClick={() => setIsOpen(false)}>Close</button>
                </motion.div>
            </motion.div>

        </>
    );
};

export default ProjectModal;
