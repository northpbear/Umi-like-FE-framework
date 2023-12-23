import React from "react";
import { Outlet, useLocation } from "react-router-dom";

export const Layout = () => {
  const { pathname } = useLocation();
  console.log("pathname:: ", pathname);

  return (
    <>
      <div>current pathname: {pathname}</div>
      <div>
        <Outlet />
      </div>
    </>
  );
};
