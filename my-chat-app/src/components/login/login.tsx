import React, {useState, useEffect} from "react";
import axios from 'axios';
import {Link, useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import { User, Lock, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import {useUser} from "../../context/userContext.tsx";
import { apiBaseUrl } from "../../config/api";

function Login() {
    const navigate = useNavigate();
    const { user, refetchUser } = useUser();

    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return; // Prevent multiple submissions

        setIsLoading(true);
        axios.post(
            `${apiBaseUrl}/auth/login`,
            { username, password },
            {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true,
            }
        )
            .then(res => {
                toast.success(res.data.message || 'Login successful!');
                refetchUser();
            })
            .catch(err => {
                const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.';
                toast.error(errorMessage);
                console.error('Login failed:', err.response ? err.response.data : err.message);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className="bg-slate-100 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200">
                    <div className="text-center mb-8">
                        <div className="inline-block bg-indigo-100 p-3 rounded-full mb-4">
                            <LogIn className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Welcome Back!</h1>
                        <p className="text-slate-500 mt-2">Sign in to continue to your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Input */}
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                name="username"
                                id="username"
                                placeholder="Username"
                                className="block w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                id="password"
                                placeholder="Password"
                                className="block w-full pl-12 pr-12 py-3 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="text-right text-sm">
                            <Link to="/reset-password" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center text-slate-600 text-sm">
                    <span>Don't have an account? </span>
                    <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                        Sign Up Now
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
