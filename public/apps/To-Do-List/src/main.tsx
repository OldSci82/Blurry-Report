// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import './styles.css';
//import "./styles/style.css"; // Optional: if you have a global CSS file

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
