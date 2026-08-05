import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useUser } from "./userContext.tsx";

const SocketContext = createContext<typeof Socket | null>(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<typeof Socket | null>(null);
    const socketRef = useRef<typeof Socket | null>(null);
    const { user } = useUser();
    const userId = user?._id;

    useEffect(() => {
        if (!userId) return;

        const newSocket = io(import.meta.env.VITE_API_BASE.replace(/\/chatApp\/?$/, ""), {
            path: "/chatApp/socket.io",
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on("connect", () => newSocket.emit("setup", userId));
        newSocket.on("connected", () => console.log("Setup complete:", userId));
        newSocket.on("disconnect", (r: never) => console.warn("Disconnected:", r));
        newSocket.on("connect_error", (e: never) => console.error("Connect error:", e));

        return () => {
            newSocket.disconnect();
            setSocket(null);
            socketRef.current = null;
        };
    }, [userId]);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
