import { useEffect, useState } from "react";


const SearchModal = ({ isModalOpen, setIsModalOpen, files, openFile }) => {

    useEffect(() => {
        setFilterdFiles([...files])
    }, [])
    const [filterdFiles, setFilterdFiles] = useState([])
    const searchFile = (value) => {
        const results = files.filter((file) =>
            file.title.toLowerCase().includes(value.toLowerCase())
        );
        setFilterdFiles(results);
    }

    const handleFilePress = (file)=>{
        openFile(file)
        setIsModalOpen(false)
    }

    return (

        <div className="searchModalContainer z-9 flex absolute h-full top-0 w-full backdrop-blur-sm bg-white/1 items-center justify-center"
            onClick={() => { setIsModalOpen(false) }}
        >

            <div className="searchBox h-4/5 w-1/4 bg-gray-600 z-10 rounded"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="searchBar flex m-2">
                    <p> {">"} </p>
                    <input className="w-full mx-1 focus:outline-none focus:ring-0" 
                    placeholder="Search File"
                     type="text" 
                     name="" id=""
                     onChange={(e) => { searchFile(e.target.value) }} />
                </div>
                <hr className=" text-white" />
                {
                    filterdFiles.map((file,i) => (
                        <div key={i} className="item" onClick={()=>{handleFilePress(file)}}>
                            <p>{file.title}</p>
                        </div>
                    ))
                }

            </div>

        </div>
    );
}

export default SearchModal;