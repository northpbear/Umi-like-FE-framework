import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import Bar from "./pages/Bar";
import Foo from "./pages/Foo";
import Home from "./pages/Home";

const App = () => {
  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Home />}></Route>
            <Route path="/foo" element={<Foo />}></Route>
            <Route path="/bar" element={<Bar />}></Route>
          </Route>
        </Routes>
      </HashRouter>
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(React.createElement(App));
