import { type RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default flatRoutes() satisfies RouteConfig;

// export default flatRoutes({
//   ignoredRouteFiles: ["home.tsx"],
// }) satisfies RouteConfig;