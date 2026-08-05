import React, { useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, KeyRound, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const apiBaseUrl = import.meta.env.VITE_API_BASE;

function ResetPassword() {
    const navigate = useNavigate();

    // State for UI and API calls
    const [isLoading, setIsLoading] = useState(false);
    const [mailSent, setMailSent] = useState(false);

    // Form fields state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Password visibility state
    const [showPassword, setShowPassword] = useState(false);

    // Memoize URL parameters to avoid re-calculating on every render
    const { resetToken, resetMail } = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return {
            resetToken: params.get("token"),
            resetMail: params.get("email"),
        };
    }, []);

    // --- Handler for requesting a password reset link ---
    const handleSendResetMail = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        axios.post(`${apiBaseUrl}/auth/sendResetMail`, { email }, { withCredentials: true })
            .then((res) => {
                if (res.data.success) {
                    toast.success(res.data.status);
                    setMailSent(true); // Show success view
                } else {
                    toast.error(res.data.status || "Could not send reset link.");
                }
            })
            .catch((err) => {
                const errorMessage = err.response?.data?.error || "An unexpected error occurred.";
                toast.error(errorMessage);
            })
            .finally(() => setIsLoading(false));
    };

    // --- Handler for setting the new password ---
    const handleSetNewPass = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        axios.post(`${apiBaseUrl}/auth/resetPassword`,
            { newPassword: password, token: resetToken, email: resetMail },
            { withCredentials: true }
        )
            .then((res) => {
                if (res.data.success) {
                    toast.success(res.data.status);
                    navigate("/login"); // Navigate to login on success
                } else {
                    toast.error(res.data.status || "Failed to reset password.");
                }
            })
            .catch((err) => {
                const errorMessage = err.response?.data?.error || "Invalid or expired token.";
                toast.error(errorMessage);
            })
            .finally(() => setIsLoading(false));
    };

    // --- RENDER LOGIC ---

    const renderRequestForm = () => (
        <div className="text-center">
            <div className="inline-block bg-indigo-100 p-3 rounded-full mb-4">
                <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Forgot Password?</h1>
            <p className="text-slate-500 mt-2">No worries, we'll send you reset instructions.</p>
            <form onSubmit={handleSendResetMail} className="space-y-6 mt-8 text-left">
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        className="block w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Send Reset Link"}
                </button>
            </form>
        </div>
    );

    const renderMailSentView = () => (
        <div className="text-center">
            <div className="inline-block bg-green-100 p-3 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Reset Link Sent</h1>
            <p className="text-slate-500 mt-2">
                We've sent reset instructions to <strong className="text-slate-700">{email}</strong>. Please check your inbox.
            </p>
            <Link to="/login" className="mt-8 inline-block w-full text-center bg-slate-200 text-slate-800 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors">
                Back to Login
            </Link>
        </div>
    );

    const renderResetForm = () => (
        <div className="text-center">
            <div className="inline-block bg-indigo-100 p-3 rounded-full mb-4">
                <KeyRound className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Set New Password</h1>
            <p className="text-slate-500 mt-2">Create a new, strong password for your account.</p>
            <form onSubmit={handleSetNewPass} className="space-y-6 mt-8 text-left">
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="block w-full pl-12 pr-12 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        className="block w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Reset Password"}
                </button>
            </form>
        </div>
    );

    return (
        <div className="bg-slate-100 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200">
                    {resetToken ? renderResetForm() : (mailSent ? renderMailSentView() : renderRequestForm())}
                </div>
                {!mailSent && (
                    <div className="mt-6 text-center text-slate-600 text-sm">
                        <span>Remembered your password? </span>
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Log In
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;
