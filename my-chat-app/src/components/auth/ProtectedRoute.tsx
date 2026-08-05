import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../context/userContext.tsx";

const ProtectedRoute = () => {
    const { user, loading } = useUser();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
