import { type RouteConfig, index,route} from "@react-router/dev/routes";

export default [
        index("routes/home.tsx"),
      route('projects','routes/projects.tsx'),
      route('profile','routes/profile.tsx'),
      route('contacts','routes/contacts.tsx')
  

] satisfies RouteConfig;
