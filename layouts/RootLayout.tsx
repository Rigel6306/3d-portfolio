import { layoutLinks } from "constants/consts";
import { Link } from "react-router"
import { useState } from "react";
const RootLayout = () => {

    const [togleMenu, setTogleMenu] = useState(true);

    console.log(togleMenu)
    return ( 

        <div className="rootLayoutContainer">

                <div className="log">
                    <h1>Logo</h1>
                </div>
                <div className="links">
                {
                    layoutLinks.map(({name,href})=>(
                            <Link key={name} to={href}>{name}</Link>
                    ))
                }
                </div>
                <div className="icon">
                   <button onClick={()=>setTogleMenu(!togleMenu)}> <img src={togleMenu?'menu.png':'close.png'} alt="menu" /></button>
                </div>
        </div>
     );
}
 
export default RootLayout;