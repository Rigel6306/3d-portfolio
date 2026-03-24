
const TabBar = ({tabs,activeTab,setActiveTab,closeTab}) => {

    return ( 

        <div className="flex bg-[#0f0a1dc5] text-white overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`px-4 py-2 cursor-pointer flex items-center whitespace-nowrap
            ${activeTab === tab.id ? "bg-[#1a1c1efe] border-b-2 border-blue-400" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.title}
          <button
            onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
            className="ml-2 text-gray-400 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      ))}
    </div>

     );
}
 
export default TabBar;