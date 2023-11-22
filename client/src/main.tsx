import React from "react";
import ReactDOM from "react-dom/client";
import Login from "./Login.tsx";
import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { SignUp } from "./SignUp.tsx";
import { LoginedPage } from "./LoginedPage.tsx";

const router = createBrowserRouter([
  {
    path: "login",
    element: <Login />,
  },
  { path: "/signup", element: <SignUp /> },
  { path: "/logined-page", element: <LoginedPage /> },
  { path: "*", element: <Login /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
