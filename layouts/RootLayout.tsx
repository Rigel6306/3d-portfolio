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
                    <div key={name} className="navLink pb-3 sm:pb-5 text-center font-semibold sm:flex text-sm sm:text-base ">
                        <Link key={name} to={href} aria-label={`Go to ${name}`}>{name}</Link>
                    </div>

                ))
            }
        </>)
    }

    return (
        <>


            <div className="rootLayoutContainer w-full  ">

                <div className="logo pb-2 sm:pb-5 text-xs sm:text-base">
                    <h1 aria-label="Charitha Iravana home">Charitha Iravana<span>.</span></h1>
                </div>
                <div className="links ">
                    <Nav />
                </div>

                <button onClick={() => setTogleMenu(!togleMenu)} className="sm:hidden" aria-expanded={!togleMenu} aria-label={togleMenu ? "Open navigation" : "Close navigation"}>
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
            className="mobileNav block overflow-y-auto text-center sm:hidden pt-20 pb-5  ">
                <div className="nav pb-5">

                    <Nav />

                </div>
            </motion.div>}
            </AnimatePresence>
        </>
    );
}

export default RootLayout;