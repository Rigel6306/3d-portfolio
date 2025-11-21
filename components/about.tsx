const About = () => {
    return (

        <section id='about' className="p-3 mt-20 "  >
                <h2 className="text-4xl font-semibold">About Me</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[18rem]">

                    <div className="flex items-end row-span-2 md:col-span-3 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                    </div>

                     <div className="flex items-end row-span-1 md:col-span-3 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                    </div>

                     <div className="flex items-end row-span-1 md:col-span-3 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                    </div>

                     <div className="flex items-end row-span-1 md:col-span-2 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                    </div>

                     <div className="flex items-end row-span-1 md:col-span-4 h-60 md:h-full relative overflow-hidden hover-translate-y-1 duration-200 grid-default-color ">
                    </div>


                </div> 

        </section>
    );
}

export default About;