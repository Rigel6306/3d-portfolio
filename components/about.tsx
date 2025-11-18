const About = () => {
    return (

        <section id='about' className="p-3 mx-10" >
            <div className="container h-screen grid grid-cols-1 gap-4 sm:grid-cols-3 sm:grid-rows-3  md:grid-cols-3 md:grid-rows-3  max-w-full ">
                <div className="gridContainer sm:row-span-2 rounded-2xl  ">
                    <div className="gridItems  p-2 rounded-2xl shadow-2xl bg-gray-900 ">
                        <img src="myProfileImg.jpg" alt="myProfile" className=" object-contain  rounded-2xl" />
                        <div className="content  top-10  ">
                            <p className="headText text-center">Hi, Im Charitha Iravana</p>
                            <p className="subText"> Im </p>
                        </div>
                    </div>


                </div>
                <div className="gridContainer col-span-1 lg:row-span-1 bg-green-600 ">

                </div>
                <div className="gridContainer col-span-1 lg:row-span-1 bg-green-100 ">

                </div>
                <div className="gridContainer col-span-2 lg:row-span-1 bg-green-100 ">

                </div>

            </div>
        </section>
    );
}

export default About;