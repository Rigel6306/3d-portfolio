import { layoutLinks } from "constants/consts";
import { Link } from "react-router"
import { useState } from "react";
import { motion,AnimatePresence  } from 'motion/react'
const RootLayout = () => {

    const [togleMenu, setTogleMenu] = useState(true);

    const Nav = () => {
        return (<>
            {
                layoutLinks.map(({ name, href }) => (
                    <div className="navLink pb-5 text-center font-semibold sm:flex ">
                        <Link key={name} to={href}>{name}</Link>
                    </div>

                ))
            }
        </>)
    }

    return (
        <>


            <div className="rootLayoutContainer  ">

                <div className="logo pb-5">
                    <h1>Logo</h1>
                </div>
                <div className="links ">
                    <Nav />
                </div>

                <button onClick={() => setTogleMenu(!togleMenu)} className="sm:hidden">
                    <img src={togleMenu ? 'menu.png' : 'close.png'} alt="menu" />
                </button>

            </div>
            <AnimatePresence>
            {!togleMenu &&
             <motion.div 
             
                initial={{opacity:0,x:-10}}
                animate={{opacity:1,x:0}}
                style={{maxHeight:'100vh'}}
                transition={{duration:0.3}}
                 exit={{ opacity: 0 }}
            className="block overflow-hidden text-center sm:hidden">
                <div className="nav pb-5 mt-40">

                    <Nav />

                </div>
            </motion.div>}
            </AnimatePresence>
        </>
    );
}

export default RootLayout;