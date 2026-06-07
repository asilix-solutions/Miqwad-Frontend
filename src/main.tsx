import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installMocks } from "@shared/mocks/server";
import "./index.css";

installMocks();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("#root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
