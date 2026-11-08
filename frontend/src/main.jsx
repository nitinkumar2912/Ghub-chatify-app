import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3200,
          style: {
            border: "1px solid #eeeaf3",
            borderRadius: "12px",
            color: "#514b5a",
            background: "#fff",
            fontSize: "12px",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
