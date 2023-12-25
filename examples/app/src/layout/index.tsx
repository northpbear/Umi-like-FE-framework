import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import "./index.css";

const Layout = () => {
  const { pathname } = useLocation();
  console.log("pathname:: ", pathname);

  return (
    <div className="umi-like-layout">
      <div className="umi-like-layout-header">current pathname: {pathname}</div>
      <div className="umi-like-layout-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
