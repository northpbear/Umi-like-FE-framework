import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default () => {
  useEffect(() => {
    fetch("/api/todos/1").then((resp) => {
      console.log(resp.json());
    });
  }, []);
  return (
    <>
      <p>Home</p>
      <Link to="/bar">Bar</Link> | <Link to="/foo">Foo</Link>
    </>
  );
};
