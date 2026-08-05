import {createContext, type ReactNode, useContext, useEffect, useState,} from "react";
import axios from "axios";
import type { User as TypeUser } from "../components/chats/types.tsx";

interface UserContextType {
    user: TypeUser | null;
    setUser: (user: TypeUser | null) => void;
    loading: boolean;
    refetchUser: () => void;
}

const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => {},
    loading: true,
    refetchUser: () => {},
});

const apiBaseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3000/chatApp';

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<TypeUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = () => {
        setLoading(true);
        axios.post(`${apiBaseUrl}/auth/validate`, {}, { withCredentials: true })
            .then(res => {
                if (res.data?.user) setUser(res.data.user);
                else setUser(null);
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading, refetchUser: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
