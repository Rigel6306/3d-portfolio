export const layoutLinks = [
  {
    name: "Home",
    href: '#hero'
  },
  {
    name: "About",
    href: '#about'
  },
  {
    name: "Work",
    href: '#work'
  },
  {
    name: "Contacts",
    href: "#contact"
  }
]
export type details = {
  id: number;
  title: string;
  description: string;
  stack: string[];
}
// export type projectDetails = details[]
// export const projectsDetails:projectDetails = [
//     {
//         id: 1,
//         title: "futurity",
//         description: "Full stack React native cross platforl Social Application ",
//         stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
//     },
//     {
//         id: 2,
//         title: "Fitness Mobile Application",
//         description: "A ReactNative cross platform mobile application to manage a fitness Gym",
//         stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
//     },
//     {
//         id: 3,
//         title: "Developer Mobile Application",
//         description: 'React Native mobile application to provide fullstack developer training',
//         stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
//     },
//     {
//         id: 4,
//         title: "Mac Clone ",
//         description: 'Apple Mac Clone website built with ThreeJs and NEXT',
//         stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
//     },
//     {
//         id: 5,
//         title: "CodeMentorian ",
//         description: 'Web Application Development Company Web site built with React Router V7',
//         stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
//     },
//     {
//         id: 6,
//         title: "Trip Planer With AI ",
//         description: 'Next js Application Powerd with AI to manage and plan Trips',
//         stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
//     },
//       {
//         id: 7,
//         title: "Wordel ",
//         description: 'Web based Wordle Game built with react',
//         stack:["React Native",'React',"Node/Express","Firebase/Firestor"]
//     },
// ]

export type Project = {
  id: string;
  title: string;
  kind: string;
  description: string;
  highlights: string[];
  stack: string[];
  device: "web" | "mobile";
  image: string;
  images: string[];
  accent: string;
  host?: string;
  href?: string;
  repo?: string;
};



export const PROJECTS: Project[] = [
  {
    id: "superbody",
    title: "Superbody Mobile",
    kind: "Mobile app",
    description:
      "A fitness app built with React Native and Expo, designed to feel fast and native on both platforms.",
    highlights: [
      "Custom design system and reusable component library",
      "One TypeScript codebase for iOS and Android",
    ],
    stack: ["React Native", "Expo", "TypeScript","payhere"],
    device: "mobile",
    image: "/projects/fitness.jpg",
    images: ['/projects/fitness-mobile/fitness1.png', '/projects/fitness-mobile/fitness2.png', '/projects/fitness-mobile/fitness3.png', '/projects/fitness-mobile/fitness4.png', '/projects/fitness-mobile/fitness5.png', '/projects/fitness-mobile/fitness6.png', '/projects/fitness-mobile/fitness7.png', '/projects/fitness-mobile/fitness8.png'],
    accent: "#5b8cff",
 
     repo: "https://github.com/Rigel6306/fitness.git",
  },
  {
    id: "fitness-admin",
    title: "Fitness Admin ",
    kind: "Website",
    description:
      "AI powerd admin dashboard for managing fitness gym members, workout schedules,meal plans, payments. ",
    highlights: [
      "Multiple AI assistent support for generating workout schedules and meal plans ",
      "Manual and automatic Schedule generation and updation ",
      "Online payment and manual payment support with QR scan",
      "Real time updates",
    ],
    stack: ["Next.js", "Three.js", "Motion", "TypeScript","Firebase"],
    device: "web",
    image: "/projects/fitness-admin.png",
    images: ["/projects/fitness-admin/fitness-admin.png", "/projects/fitness-admin/fitness-admin8.png", "/projects/fitness-admin/fitness-admin1.png", "/projects/fitness-admin/fitness-admin2.png", "/projects/fitness-admin/fitness-admin3.png", "/projects/fitness-admin/fitness-admin4.png", "/projects/fitness-admin/fitness-admin5.png", "/projects/fitness-admin/fitness-admin6.png", "/projects/fitness-admin/fitness-admin7.png"],
    accent: "#34d399",
    host: "www.superbody.com/admin",
    repo: "https://github.com/Rigel6306/fitness.git",
  },
  {
    id: "mac-clone",
    title: "Mac Clone",
    kind: "Web app",
    description: "Showcasing apple macbooks with 3d modals and advanced scroll animations",
    highlights: ["3d model rendering", "Advanced scroll animations",],
    stack: ["Next.js", "TypeScript", "GSAP", "ThreeJs", "Tailwind"],
    device: "web",
    image: "/projects/",
    images: ["/projects/mac-clone/mac-clone1.png", "/projects/mac-clone/mac-clone2.png", "/projects/mac-clone/mac-clone3.png", "/projects/mac-clone/mac-clone4.png", "/projects/mac-clone/mac-clone5.png"],
    accent: "#c084fc",
    host: "project.app",
    href: "https://mac-clone-17yexwo6c-pisso.vercel.app/",
    repo: "https://github.com/Rigel6306/mac-clone.git",
  },

  {
    id: "developer-wizard",
    title: "Developer Wizard",
    kind: "Mobile app",
    description: "An engaging e-learning mobile app developed with React Native Expo that teaches programming through high-quality video lessons, interactive quizzes, rewards, and gamified learning experiences.",
    highlights: ["online video streaming", "achivement based rewards","progress tracking"],
    stack: ["React Native", "Expo"],
    device: "mobile",
    image: "/projects/",
    images: ["/projects/dev-mobile/devMobile2.png","/projects/dev-mobile/devMobile1.png","/projects/dev-mobile/devMobile3.png","/projects/dev-mobile/devMobile4.png","/projects/dev-mobile/devMobile5.png","/projects/dev-mobile/devMobile6.png"],
    accent: "#c084fc",
    host: "project.app",
    repo: "https://github.com/Rigel6306/developer.git",
  },

];






  //   {
  //   id: "trip-planner",
  //   title: "AI Trip Planner",
  //   kind: "Web app",
  //   description: "A smart travel planning web application that leverages AI to generate complete trip itineraries in seconds. Simply enter your starting point, destination, and number of travel days, and receive a fully customizable travel plan tailored to your preferences.",
  //   highlights: ["AI Smart planning", "Fully customizable plan","Instent planning"],
  //   stack: ["Next.js", "TypeScript","Tailwind","ai-sdk","Firebase"],
  //   device: "web",
  //   image: "/projects/",
  //   images: ["/projects/trip-planer/trip-planer1.png","/projects/trip-planer/trip-planer2.png","/projects/trip-planer/trip-planer3.png","/projects/trip-planer/trip-planer4.png", ],
  //   accent: "#c084fc",
  //   host: "www.tripplanner.com",
  //   href: "https://planer-trip-kghyqxj59-pisso.vercel.app/",
  //     repo: "https://github.com/Rigel6306/planer-trip.git",
  // },