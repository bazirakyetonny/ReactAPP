import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { dataStore } from "./data/datastore";

export function createWidget(
  UC: any[],
) {
  dataStore.set("UC", UC);
  console.log("UC", UC);
  return createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

if (import.meta.env.DEV) {
  createWidget([]);
}
