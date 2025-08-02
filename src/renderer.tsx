import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./renderer/App";
import { Toaster } from "sonner";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
