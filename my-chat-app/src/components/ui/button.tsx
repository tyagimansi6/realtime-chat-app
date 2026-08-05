import React from 'react';

type ButtonVariant = 'success' | 'error' | 'warning' | 'info';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading: boolean;
    variant?: ButtonVariant;
    children: React.ReactNode;
    loadText?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
    success: 'bg-green-600 hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    info: 'bg-blue-600 hover:bg-blue-700',
};

const LoadingButton: React.FC<LoadingButtonProps> = ({
                                                         loading,
                                                         variant = 'info',
                                                         children,
                                                         className = '',
                                                         disabled,
                                                         loadText = 'Loading...',
                                                         ...props
                                                     }) => {
    const colorClasses = variantStyles[variant] || variantStyles.info;

    return (
        <button
            {...props}
            disabled={loading || disabled}
            className={`relative flex items-center justify-center gap-2 px-4 py-2 rounded text-white disabled:opacity-70 ${colorClasses} ${className}`}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{loading ? loadText : children}</span>
        </button>
    );
};

export default LoadingButton;
