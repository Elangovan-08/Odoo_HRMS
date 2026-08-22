import { Navigate, useLocation } from "react-router";
import UnderProgress from "./UnderProgress.jsx";
import { getSession } from "./services/hrmsStorage";

export function ProtectedRoute({ children }) {
    const location = useLocation();
    return getSession() ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export function ProgressRoute({ title }) {
    return <ProtectedRoute><UnderProgress title={title} /></ProtectedRoute>;
}
