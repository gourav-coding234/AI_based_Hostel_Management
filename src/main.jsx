import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import SetupRequired from "./pages/SetupRequired.jsx";
import { isFirebaseConfigured } from "./firebase/config.js";

const rootEl = document.getElementById("root");

// Without credentials the Firebase SDK can't be initialised at all, so the
// providers below (which open auth/Firestore listeners on mount) are never
// rendered — the setup screen is shown on its own instead.
const tree = isFirebaseConfigured() ? (
  <ErrorBoundary>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
) : (
  <SetupRequired />
);

createRoot(rootEl).render(<StrictMode>{tree}</StrictMode>);
