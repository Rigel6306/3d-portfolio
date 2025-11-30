import { details } from "motion/react-client"


export const layoutLinks = [
    {
        name: "Home",
        href: '/'
    },
    {
        name: "Projects",
        href: '/projects'
    },
    {
        name: "Profile",
        href: '/profile'
    },
    {
        name: "Contacts",
        href: "/contacts"
    }
]
export type details={
    id:number;
    title:string;
    description:string;
    stack:string[];
}
export type projectDetails = details[]
export const projectsDetails:projectDetails = [
    {
        id: 1,
        title: "futurity",
        description: "Full stack React native cross platforl Social Application ",
        stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
    },
    {
        id: 2,
        title: "Fitness Mobile Application",
        description: "A ReactNative cross platform mobile application to manage a fitness Gym",
        stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
    },
    {
        id: 3,
        title: "Developer Mobile Application",
        description: 'React Native mobile application to provide fullstack developer training',
        stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
    },
    {
        id: 4,
        title: "Mac Clone ",
        description: 'Apple Mac Clone website built with ThreeJs and NEXT',
        stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
    },
    {
        id: 5,
        title: "CodeMentorian ",
        description: 'Web Application Development Company Web site built with React Router V7',
        stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
    },
    {
        id: 6,
        title: "Trip Planer With AI ",
        description: 'Next js Application Powerd with AI to manage and plan Trips',
        stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
    },
      {
        id: 7,
        title: "Wordel ",
        description: 'Web based Wordle Game built with react',
        stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
    },
]