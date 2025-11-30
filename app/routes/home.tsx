import About from "components/about";
import type { Route } from "./+types/home";
import Hero from "components/hero";
import MyProjects from "components/MyProjects";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (

    <div className="home">
      <Hero/>
      <About/>
      <MyProjects/>
    </div>
  );
}
