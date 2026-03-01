import { createBrowserRouter } from "react-router";
import { Landing } from "./pages/Landing";
import { Marketplace } from "./pages/Marketplace";
import { PropertyDetail } from "./pages/PropertyDetail";
import { Portfolio } from "./pages/Portfolio";
import { Admin } from "./pages/Admin";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/marketplace",
    Component: Marketplace,
  },
  {
    path: "/property/:id",
    Component: PropertyDetail,
  },
  {
    path: "/portfolio",
    Component: Portfolio,
  },
  {
    path: "/admin",
    Component: Admin,
  },
]);
