import React from "react";
import { Circle, CircleCheckBig } from 'lucide-react';


type AddUserProps = {
    user: any;
    isSelected: boolean;

    AvatarComponent: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

function AddUser({ user, isSelected, AvatarComponent, ...props }: AddUserProps) {
    return (
        <div
            {...props}
            className={`
                flex items-center gap-2 sm:gap-3 w-full p-2 sm:p-2.5 rounded-lg cursor-pointer 
                transition-colors duration-200
                ${isSelected ? 'bg-indigo-100 hover:bg-indigo-200' : 'hover:bg-slate-100'}
            `}
            aria-checked={isSelected}
            role="option"
        >

            <div className="flex-shrink-0">
                {AvatarComponent}
            </div>


            <p className="flex-grow font-semibold text-sm sm:text-base text-slate-700">
                {user.username}
            </p>


            <div className="flex-shrink-0">
                {isSelected ? (
                    <CircleCheckBig className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                ) : (
                    <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                )}
            </div>
        </div>
    );
}

export default AddUser;
