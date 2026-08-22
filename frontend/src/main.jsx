import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import "./index.css";
import App, { SignInPage, SignUpPage } from "./App.jsx";
import Dashboard from "./Dashboard.jsx";
import { ProtectedRoute } from "./RouteGuards.jsx";
import { AttendancePage, EmployeeProfilePage, EmployeesPage, ModulePlaceholderPage, ProfilePage, SalaryPage, TimeOffPage } from "./HRMSModules.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <Navigate to="/login" replace />,
            },
            {
                path: "sign-in",
                element: <Navigate to="/login" replace />,
            },
            {
                path: "login",
                element: <SignInPage />,
            },
            {
                path: "sign-up",
                element: <SignUpPage />,
            },
            {
                path: "dashboard",
                element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
            },
            { path: "attendance", element: <ProtectedRoute><AttendancePage /></ProtectedRoute> },
            { path: "leave", element: <ProtectedRoute><TimeOffPage /></ProtectedRoute> },
            { path: "employees", element: <ProtectedRoute><EmployeesPage /></ProtectedRoute> },
            { path: "documents", element: <ProtectedRoute><ModulePlaceholderPage title="Documents" /></ProtectedRoute> },
            { path: "settings", element: <ProtectedRoute><ModulePlaceholderPage title="Settings" /></ProtectedRoute> },
            { path: "profile", element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
            { path: "employee-profile", element: <ProtectedRoute><EmployeeProfilePage /></ProtectedRoute> },
            { path: "time-off", element: <ProtectedRoute><TimeOffPage /></ProtectedRoute> },
            { path: "payslips", element: <ProtectedRoute><ModulePlaceholderPage title="Payslips" /></ProtectedRoute> },
            { path: "salary", element: <ProtectedRoute><SalaryPage /></ProtectedRoute> },
            { path: "reports", element: <ProtectedRoute><ModulePlaceholderPage title="Reports" /></ProtectedRoute> },
            { path: "activity", element: <ProtectedRoute><ModulePlaceholderPage title="Recent activity" /></ProtectedRoute> },
        ],
    },
]);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);
