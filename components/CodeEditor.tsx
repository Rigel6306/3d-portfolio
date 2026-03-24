
import TabBar from "./UI/codeEditor/TabBar";
import {  useState } from "react";
import SideBar from "./UI/codeEditor/SideBar";
import { LuFiles,LuSearch  } from "react-icons/lu";
const CodeEditor = () => {
  const [tabs, setTabs] = useState([]);

  const files = [
    { id: 1, title: "About.js", content: "Hi, I'm Charitha — a full-stack developer passionate about creative coding and portfolio design." },
    { id: 2, title: "Projects.js", content: "Projects:\n- Portfolio with VS Code UI\n- Fitness App\n- Creative Shader Animations" },
    { id: 3, title: "Contact.js", content: "Email: charitha@example.com\nLinkedIn: linkedin.com/in/charitha" }
  ];

  const [activeTab, setActiveTab] = useState(1);
  const openFile = (file) => {
    if (!tabs.find(tab => tab.id === file.id)) {
      setTabs(prev => [...prev, file]);
    }
    setActiveTab(file.id);
  };

  const closeTab = (id) => {
    setTabs(prev => prev.filter(tab => tab.id !== id));
    if (activeTab === id && tabs.length > 1) {
      setActiveTab(tabs[0].id);
    } else if (tabs.length === 1) {
      setActiveTab(null);
    }
  };


  // useEffect(() => {

  //   if (tabs.length > 1) {
  //     setActiveTab(tabs[0].id);
  //   }

  // }, [tabs])

  //main content display section - code editor
  const TabContent = ({ tabs, activeTab }) => {
    const active = tabs.find(tab => tab.id === activeTab);
    return (
      <div className="p-6 h-full bg-[#0f0e1e71] text-green-300 whitespace-pre-line">
        {active?.content || "No tab selected"}
      </div>
    );

  }


  return (
    // code Editor section
    <section className={"code-editor text-black  h-[300vh]"}>
   

      <div className={`h-[calc(100vh-80px)] sticky top-[80px] flex flex-col bg-gray-900 text-gray-200 font-mono`}>
        {/* toolbar At head */}
        <div className="toolbar flex justify-between  h-[30px] bg-[#252429]  w-full ">
          <ul className="flex gap-2 mx-2">
            <li>
              <p>File</p>
            </li>
            <li>
              <p>View</p>
            </li>
            <li>
              <p>Terminal</p>
            </li>
             <li>
              <p>Run</p>
            </li>
          </ul>

          <div className="search-bar rounded border-1 border-gray-600 bg-gray-600 h-[20px] w-1/4 m-1"></div>

          <div className="icons flex items-center gap-2 mx-2">
            {/* <IoCloseOutline />
            <FaRegWindowRestore size={14} /> */}
            <div className="rounded-full h-[10px] w-[10px] hover:cursor-pointer  hover:scale-115 bg-green-400"></div>
            <div className="rounded-full h-[10px] w-[10px] hover:cursor-pointer hover:scale-115 bg-yellow-400"></div>
            <div className="rounded-full h-[10px] w-[10px] hover:cursor-pointer hover:scale-115 bg-red-400"></div>
          </div>

        </div>


        <div className="flex h-full  ">
          <div className="activityBar flex flex-col items-center w-[50px] bg-[#161617]">
                <LuFiles />
                <LuSearch />

          </div>
          <SideBar files={files} openFile={openFile} />
          <div className="flex flex-col flex-1">
            <TabBar
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              closeTab={closeTab}
            />
            <TabContent tabs={tabs} activeTab={activeTab} />
          </div>
        </div>
        <div className="toolbar h-[20px] bg-[#18122B] w-full "></div>
      </div>

     
    </section>
  );
}

export default CodeEditor;