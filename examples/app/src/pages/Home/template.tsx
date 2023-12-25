import React from "react";
import { Link } from "react-router-dom";

export default () => {
  return (
    <>
      <p>Home</p>
      <Link to="/bar">Bar</Link> | <Link to="/foo">Foo</Link>
    </>
  );
};
