import './App.css'
import {Routes, Route} from 'react-router-dom';
import Register from "./components/login/register.tsx";
import Login from "./components/login/login.tsx";
import Dashboard from "./components/dashboard/dashboard.tsx";
import {Toaster} from "react-hot-toast";
import ResetPassword from "./components/login/passReset.tsx";
import {SocketProvider} from "./context/socketHandler.tsx";
import {UserProvider} from "./context/userContext.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";

function App() {


    return (
        <>
            <Toaster position="top-center" reverseOrder={false}/>
            <UserProvider>
                <SocketProvider>
                    <Routes>
                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Dashboard/>}/>
                        </Route>
                        <Route path="/register" element={<Register/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/reset-password" element={<ResetPassword/>}/>
                    </Routes>
                </SocketProvider>
            </UserProvider>

        </>
    );

}

export default App
