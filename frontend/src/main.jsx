import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
    <AppProvider>
      <App />
    </AppProvider>
    </ErrorBoundary>
  </StrictMode>
);
