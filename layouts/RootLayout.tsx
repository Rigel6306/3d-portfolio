import { layoutLinks } from "constants/consts";
import { Link } from "react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "motion/react";
// Extracted outside to prevent unnecessary re-mounting/re-renders

const toStart = (href) => {
  // Remove the '#' if it exists, or fallback to 'hero'
  const targetId = href.startsWith("#") ? href.substring(1) : href;
  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
};

const NavLinks = ({ onLinkClick }) => (
  <>
    {layoutLinks.map(({ name, href }) => (
      <div 
        key={name} 
        className="navLink text-center font-light sm:flex text-sm sm:text-lg tracking-widest"
      >
        {/* Change <Link> to a standard <a> tag or button */}
        <a 
          href={href} 
          aria-label={`Go to ${name}`}
          onClick={(e) => {
            e.preventDefault(); // Stop default jump
            onLinkClick(href);
          }}
        >
          {name}
        </a>
      </div>
    ))}
  </>
);

const RootLayout = () => {
  const [toggleMenu, setToggleMenu] = useState(false); // Default to false (closed) is standard practice

  const handleToggle = () => setToggleMenu((prev) => !prev);
  const closeMenu = () => setToggleMenu(false);

  return (
    <header className="rootLayoutContainer flex items-center justify-end sm:justify-center px-6 py-4  sm:backdrop-blur-sm  ">
      
      {/* Brand Logo / Name */}
    

      {/* Desktop Navigation */}
      <nav className="links hidden sm:flex items-center gap-6">
        <NavLinks onLinkClick={toStart} />
      </nav>

      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={handleToggle} 
        className="sm:hidden p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary " 
        aria-expanded={toggleMenu} 
        aria-label={toggleMenu ? "Close navigation menu" : "Open navigation menu"}
      >
        <img 
          src={toggleMenu ? 'close.png' : 'menu.png'} 
          alt="" 
          className="w-6 h-6 select-none"
        />
      </button>

      {/* Mobile Dropdown Navigation */}
      <AnimatePresence>
        {toggleMenu && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          className="bg-[#00000033] backdrop-blur-2xl absolute top-full left-0 w-full block overflow-y-auto text-center sm:hidden pt-6 pb-8"
            style={{ maxHeight: 'calc(100vh - 4rem)' }}
          >
            <div className="flex flex-col gap-4 ">
              <NavLinks onLinkClick={closeMenu} />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      
    </header>
  );
};

export default RootLayout;