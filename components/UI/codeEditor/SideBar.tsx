
const SideBar = ({files,openFile}) => {
    return ( 
        <div className="w-48  bg-[#1a162a] p-2 border-r border-gray-700">
      <h2 className="text-sm text-gray-400 mb-2">EXPLORER</h2>
      <ul>
        {files.map(file => (
          <li 
            key={file.id} 
            className="cursor-pointer px-2 py-1 hover:bg-gray-700 rounded text-gray-300"
            onClick={() => openFile(file)}
          >
            📄 {file.title}
          </li>
        ))}
      </ul>
    </div>

     );
}
 
export default SideBar;