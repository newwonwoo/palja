import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const MobileApp = lazy(() => import("./mobile/MobileApp.jsx"));
const mobile = import.meta.env.VITE_APP_MODE === "mobile";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={<div style={{ padding: 32, fontFamily: "sans-serif" }}>보관함을 여는 중…</div>}>
      {mobile ? <MobileApp /> : <App />}
    </Suspense>
  </React.StrictMode>
);
