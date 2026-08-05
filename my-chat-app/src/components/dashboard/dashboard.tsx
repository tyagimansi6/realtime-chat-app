import {type Dispatch, type SetStateAction, useCallback, useEffect, useState} from "react";
import {ArrowLeft, LogOut, MessageSquarePlus, Plus, Search, Users, Video, VideoOff, X} from 'lucide-react';
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import Chat from "../chats/chat.tsx";
import MessageArea from "../chats/messageArea.tsx";
import Modal from "../modal/modal.tsx";
import AddUser from "../chats/addUser.tsx";
import {useUser} from "../../context/userContext.tsx";
import VideoCall from "../chats/VideoCall.tsx";
import type {Chat as TypeChat, Message as TypeMessage, User as TypeUser} from "../chats/types.tsx";
import MessageInput from "../chats/messageInput.tsx";
import {useSocket} from "../../context/socketHandler.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3000/chatApp';
const notificationSound = new Audio('/notification.mp3');

const UserAvatar = ({name, isOnline, size = 'w-11 h-11'}: { name?: string, isOnline?: boolean, size?: string }) => {
    if (!name) return <div className={`${size} bg-slate-300 rounded-full`}></div>;
    const initial = name.charAt(0).toUpperCase();
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
    const colors = [
        'from-indigo-500 to-blue-500',
        'from-green-500 to-emerald-500',
        'from-purple-500 to-violet-500',
        'from-red-500 to-rose-500',
        'from-amber-500 to-orange-500',
    ];
    return (
        <div className="relative inline-block">
            <div
                className={`rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br ${size} ${colors[colorIndex]}`}>
                <span style={{fontSize: `calc(${size.replace('w-', '')}rem / 2.5)`}}>{initial}</span>
            </div>
            {isOnline && (
                <span
                    className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
            )}
        </div>
    );
};

const ChatListSkeleton = () => (
    <div className="px-3 space-y-3 mt-4">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-11 h-11 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mt-2"></div>
                </div>
            </div>
        ))}
    </div>
);

const VideoCallModal = ({chat, onClose}: { chat: TypeChat, onClose: () => void }) => (
    <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-2 sm:p-4 transition-opacity duration-300"
        style={{animation: 'fadeIn 0.3s ease-out'}}
    >
        <div
            className="relative w-full h-full max-w-7xl bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <header className="flex items-center justify-between p-3 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Video className="text-indigo-400" size={20}/>
                    <h3 className="font-bold text-white truncate">
                        <span className="hidden sm:inline">Video Call: </span>{chat.name}
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-red-500 text-white hover:bg-red-600"
                >
                    <X size={18}/>
                    <span className="hidden sm:inline">Leave Call</span>
                </button>
            </header>
            <div className="flex-1 min-h-0">
                {chat && <VideoCall chat={chat}/>}
            </div>
        </div>
    </div>
);

const IncomingCallModal = ({ chat, onAccept, onDecline }: { chat: TypeChat, onAccept: () => void, onDecline: () => void }) => (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-sm w-full text-center transform transition-all" style={{animation: 'fadeInUp 0.3s ease-out'}}>
            <UserAvatar name={chat.name} size="w-20 h-20 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800 mt-4">Incoming Call</h2>
            <p className="text-slate-500 mt-1">
                You have an incoming video call from <span className="font-semibold">{chat.name}</span>.
            </p>
            <div className="flex justify-center gap-4 mt-6">
                <button
                    onClick={onDecline}
                    className="px-6 py-3 rounded-full font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md"
                >
                    Decline
                </button>
                <button
                    onClick={onAccept}
                    className="px-6 py-3 rounded-full font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors shadow-md"
                >
                    Accept
                </button>
            </div>
        </div>
    </div>
);


function Dashboard() {
    const {user, setUser, loading: userLoading} = useUser();
    const navigate = useNavigate();

    const [chats, setChats] = useState<TypeChat[]>([]);
    const [currChat, setCurrChat] = useState<TypeChat | null>(null);
    const [messages, setMessages] = useState<TypeMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<TypeUser[]>([]);
    const [chatUsers, setChatUsers] = useState<TypeUser[]>([]);
    const [newChatName, setNewChatName] = useState<string>('');
    const [showMobileChat, setShowMobileChat] = useState<boolean>(false);
    const [videoCallChat, setVideoCallChat] = useState<TypeChat | null>(null);
    const [incomingCall, setIncomingCall] = useState<TypeChat | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [onlineMembers, setOnlineMembers] = useState<TypeUser[]>([]);


    const socket = useSocket();

    const logOut = useCallback(() => {
        if (videoCallChat && socket) {
            socket.emit('leaveVideoCall', {chatId: videoCallChat._id});
            setVideoCallChat(null);
        }
        if (socket) {
            socket.off('disconnect');
            socket.disconnect();
        }
        axios.post(`${apiBaseUrl}/auth/logout`, {}, {withCredentials: true})
            .then(() => {
                toast.success('You have been logged out.');
            })
            .catch((error) => {
                console.error('Logout Error:', error);
            });
        if (setUser) {
            setUser(null);
        }
    }, [socket, videoCallChat, setUser]);

    useEffect(() => {
        axios.post(`${apiBaseUrl}/auth/validate`, {}, {withCredentials: true})
            .catch(() => {
                toast.error('Session expired. Please log in again.');
                logOut();
            });
    }, [logOut]);


    useEffect(() => {
        if (!socket || !user?._id) {
            return;
        }

        const newChatHandler = (newChat: TypeChat) => {
            toast.success("You joined New Chat");
            setChats(prev => {
                const exists = prev.some(chat => chat._id === newChat._id);
                if (exists) return prev;
                return [newChat, ...prev];
            });
        }

        const newUserHandler = (newUser: TypeUser) => {
            setAllUsers(prev => [newUser, ...prev]);
        }

        const handleTest=(info:string)=>{
            console.log(info);
        }

        
        const onlineUsersHandler = (users: string[]) => {
            setOnlineUsers(users);
        }
        
        const handleConnect = () => {
            toast.success('Connected to server!', { icon: '🚀' });
            socket.emit('setup', user._id);
        };

        const handleDisconnect = (reason: string) => {
            if (reason === 'io server disconnect') {
                // the disconnection was initiated by the server, you need to reconnect manually
                toast.error('Server disconnected. Please log in again.');
                navigate('/login');
            } else {
                toast.error('Disconnected from server. Reconnecting...');
            }
        };

        socket.on('newChatCreated', newChatHandler);
        socket.on('newUserCreated', newUserHandler);
        socket.on('onlineUsers', onlineUsersHandler);
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('test',handleTest)

        if (socket.connected) {
            socket.emit('setup', user._id);
        }

        return () => {
            socket.off('newChatCreated', newChatHandler);
            socket.off('newUserCreated', newUserHandler);
            socket.off('onlineUsers', onlineUsersHandler);
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        }
    }, [socket, navigate, user?._id]);
    useEffect(() => {
        if (!socket || !user?._id) return;

        const handleVideoCallInitiated = ({chat, initiatorId}: { chat: TypeChat, initiatorId: string }) => {
            if (initiatorId === user._id || videoCallChat || incomingCall) return;
            setIncomingCall(chat);
        };

        const handleVideoCallEnded = ({chatId}: { chatId: string }) => {
            if (videoCallChat?._id === chatId) {
                // setVideoCallChat(null);
                toast.success(`Video call ended.`);
            }
            if (incomingCall?._id === chatId) {
                setIncomingCall(null);
                toast.error(`Call in ${incomingCall.name} was cancelled.`);
            }
        };
        
        const handleMessageReceived = (msg: TypeMessage) => {
            const msgChatId = typeof msg.chat === 'string' ? msg.chat : msg.chat._id;

            // Update messages if it's for the current chat
            if (msgChatId === currChat?._id) {
                setMessages(prev => {
                    const exists = prev.some((m) => m._id && m._id === msg._id);
                    return exists ? prev : [...prev, msg];
                });
            } else {
                // Otherwise, show a notification for inactive chat
                const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
                if (senderId !== user._id) {
                    const senderName = typeof msg.sender === 'object' ? msg.sender.username : 'Someone';
                    const notificationMessage = msg.content
                        ? `${senderName}: ${msg.content.substring(0, 40)}${msg.content.length > 40 ? '...' : ''}`
                        : `${senderName} sent a file.`;

                    toast(notificationMessage, {
                        icon: '💬',
                    });

                    notificationSound.play().catch(error => {
                        console.warn("Could not play notification sound:", error);
                    });
                }
            }

            //Chat Update Here

            setChats(prevChats =>
                prevChats.map((ch) =>
                    ch._id === msgChatId
                        ? { ...ch, latestMessage: msg }
                        : ch
                )
            );


        };

        socket.on('videoCallInitiated', handleVideoCallInitiated);
        socket.on('videoCallEnded', handleVideoCallEnded);
        socket.on('messageReceived', handleMessageReceived);

        return () => {
            socket.off('videoCallInitiated', handleVideoCallInitiated);
            socket.off('videoCallEnded', handleVideoCallEnded);
            socket.off('messageReceived', handleMessageReceived);
        };
    }, [socket, user?._id, videoCallChat, incomingCall, currChat]);

    const fetchChats = useCallback(async () => {
        if (!user?._id) return;
        try {
            setIsChatLoading(true);
            const response = await axios.post(`${apiBaseUrl}/chat/getChats`, {}, {withCredentials: true});
            setChats(response.data);
        } catch (error) {
            console.log(error);
            toast.error("Could not fetch your chats.");
        } finally {
            setIsChatLoading(false);
        }
    }, [user?._id]);

    useEffect(() => {
        fetchChats().then(() =>{console.log('ChatsFetched')});
    }, [fetchChats]);

    useEffect(() => {
        if (socket && chats.length > 0) {
            for (const chat of chats) {
                socket.emit("joinChat", chat._id, (response: { success: boolean; message?: string }) => {
                    if (response?.success) {
                        console.log("Joined Chat:", chat._id);
                    } else {
                        console.error(`Failed to join chat ${chat._id}:`, response?.message || "Unknown error");
                    }
                });
            }
        }
    }, [socket, chats]);

    useEffect(() => {
        if (currChat?._id) {
            axios.post(`${apiBaseUrl}/chat/getMessages`, {chat: currChat._id}, {withCredentials: true})
                .then((response) => setMessages(response.data))
                .catch((error) => console.error('Error fetching messages:', error));
        } else {
            setMessages([]);
        }
    }, [currChat?._id]);

    useEffect(() => {
        if (!userLoading && user) setChatUsers([user]);
    }, [userLoading, user]);

    const handleOpenChatModal = () => {
        if (allUsers.length === 0) getAllUsers();
        setIsChatModalOpen(true);
    };

    const handleCloseChatModal = () => {
        setIsChatModalOpen(false);
        setNewChatName('');
        setUserSearchQuery('');
        if (user) setChatUsers([user]);
    };

    const getAllUsers = () => {
        axios.get(`${apiBaseUrl}/chat/allUsers`, {withCredentials: true})
            .then((response) => setAllUsers(response.data))
            .catch(() => toast.error("Could not fetch users."));
    };

    const addChatUser = (selectedUser: TypeUser) => {
        setChatUsers(prev =>
            prev.some(u => u._id === selectedUser._id)
                ? prev.filter(u => u._id !== selectedUser._id)
                : [...prev, selectedUser]
        );
    };

    const createChat = () => {
        if (!newChatName.trim() || chatUsers.length < 2) {
            toast.error("Please provide a chat name and select at least one other member.");
            return;
        }
        axios.post(`${apiBaseUrl}/chat/newChat`, {
            name: newChatName,
            participants: chatUsers.map(user => user._id)
        }, {withCredentials: true})
            .then(res => {
                toast.success(res.data.message);
                const newChat = res.data.chat;
                setCurrChat(newChat);
                handleCloseChatModal();
                setChats(prev => [newChat, ...prev]);
            })
            .catch(err => toast.error(err.response.data.message));
    };

    const handleChatSelect = (chat: TypeChat) => {
        setCurrChat(chat);
        setShowMobileChat(true);
    };

    const handleInitiateVideoCall = () => {
        if (!currChat || !socket) return;
        socket.emit('initiateVideoCall', {chatId: currChat._id});
        setVideoCallChat(currChat);
    };

    const handleLeaveVideoCall = () => {
        if (!videoCallChat || !socket) return;
        socket.emit('leaveVideoCall', {chatId: videoCallChat._id});
        setVideoCallChat(null);
    };

    const filteredChats = chats.filter(chat =>
        chat?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = allUsers.filter(u =>
        u._id !== user?._id &&
        u.username.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    const isCallActiveInCurrentChat = currChat?._id === videoCallChat?._id;

    const getOtherParticipant = (chat: TypeChat) => {
        if (!user) return null;
        return chat.participants.find(p => p._id !== user._id);
    }
    
    useEffect(() => {
        if (currChat && onlineUsers) {
            const members = currChat.participants.filter(p => onlineUsers.includes(p._id));
            setOnlineMembers(members);
        } else {
            setOnlineMembers([]);
        }
    }, [currChat, onlineUsers]);

    return (
        <div className="flex flex-col h-[100dvh] font-sans bg-slate-100">
            <div className="flex flex-1 overflow-hidden m-0 md:m-4 md:rounded-2xl md:shadow-lg">
                <aside
                    className={`flex flex-col w-full md:w-80 lg:w-96 bg-white text-slate-800 border-r border-slate-200 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                    <header className="flex items-center justify-between p-4 border-b border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <MessageSquarePlus className="text-indigo-500" size={28}/>
                            <h1 className="text-xl font-bold tracking-wider text-slate-800">ChatApp</h1>
                        </div>
                        <button onClick={handleOpenChatModal}
                                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-500 transition-colors"
                                title="Create New Chat">
                            <Plus size={22}/>
                        </button>
                    </header>
                    <div className="p-3 border-b border-slate-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                            <input type="text" placeholder="Search chats..." value={searchQuery}
                                   onChange={(e) => setSearchQuery(e.target.value)}
                                   className="w-full bg-slate-100 border border-transparent rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 text-slate-700 placeholder:text-slate-500 transition"/>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {isChatLoading ? <ChatListSkeleton/> : (
                            <div className="px-3 space-y-1 py-2">
                                {filteredChats.map((chat: TypeChat) => {
                                    const otherParticipant = getOtherParticipant(chat);
                                    const isOnline = otherParticipant ? onlineUsers.includes(otherParticipant._id) : false;
                                    return (
                                        <Chat key={chat._id} onClick={() => handleChatSelect(chat)}
                                              activeChat={currChat?._id === chat._id}
                                              AvatarComponent={<UserAvatar name={chat.name} isOnline={isOnline}/>} chat={chat}/>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    <footer className="flex items-center gap-3 p-4 mt-auto border-t border-slate-200">
                        {!userLoading && user && <UserAvatar name={user.username} isOnline={true}/>}
                        <div className="flex-grow overflow-hidden">
                            <p className="font-semibold text-slate-700 truncate">{user?.username || 'Loading...'}</p>
                        </div>
                        <button onClick={logOut} title="Log Out"
                                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-rose-500 transition-colors">
                            <LogOut size={20}/>
                        </button>
                    </footer>
                </aside>
                <main
                    className={`flex flex-col flex-grow bg-white relative ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
                    <div className="flex-grow flex flex-col overflow-y-auto">
                        {currChat ? (
                            <>
                                <header
                                    className="flex items-center justify-between gap-4 p-3 shadow-sm sticky top-0 bg-white z-10">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setShowMobileChat(false)}
                                            className="md:hidden p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-500 transition-colors"
                                            aria-label="Back to chat list"
                                        >
                                            <ArrowLeft size={20}/>
                                        </button>
                                        <UserAvatar name={currChat.name} isOnline={onlineUsers.includes(getOtherParticipant(currChat)?._id || '')}/>
                                        <div>
                                            <h2 className="text-xl font-bold tracking-wider text-slate-800">{currChat.name}</h2>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Users size={14}/>
                                                    <span>{currChat.participants.length} Members</span>
                                                </div>
                                                {currChat.isGroupChat && onlineMembers.length > 0 && (
                                                    <div className="relative group flex items-center gap-1 cursor-pointer">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        <span>{onlineMembers.length} Online</span>
                                                        <div className="absolute bottom-full mb-2 w-max bg-slate-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {onlineMembers.map(m => m.username).join(', ')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={isCallActiveInCurrentChat ? handleLeaveVideoCall : handleInitiateVideoCall}
                                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                            isCallActiveInCurrentChat
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                : 'bg-slate-800 text-white hover:bg-slate-900'
                                        }`}
                                    >
                                        {isCallActiveInCurrentChat ? <VideoOff size={18}/> : <Video size={18}/>}
                                        <span>{isCallActiveInCurrentChat ? 'Leave Call' : 'Join Call'}</span>
                                    </button>
                                </header>
                                <MessageArea messages={messages} chat={currChat}
                                             setMessages={setMessages as Dispatch<SetStateAction<TypeMessage[]>>}/>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center bg-slate-50">
                                <UserAvatar name="ChatApp" size="w-24 h-24"/>
                                <h2 className="mt-6 text-2xl font-semibold text-slate-700">Welcome to ChatApp</h2>
                                <p className="mt-2 text-slate-500">Select a chat to start messaging.</p>
                                <button onClick={handleOpenChatModal}
                                        className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md">
                                    <Plus size={20}/> Create a New Chat
                                </button>
                            </div>
                        )}
                    </div>
                    <MessageInput
                        chat={currChat || null}
                        setMessages={setMessages as Dispatch<SetStateAction<TypeMessage[]>>}
                        disabled={!currChat}   setChats={setChats}
                    />

                    {videoCallChat && (
                        <VideoCallModal chat={videoCallChat} onClose={handleLeaveVideoCall}/>
                    )}
                </main>
            </div>
            <Modal isOpen={isChatModalOpen} onClose={handleCloseChatModal} onSubmit={createChat}
                   title="Create a New Chat">
                <div className="space-y-4">
                    <input type="text" value={newChatName} onChange={(e) => setNewChatName(e.target.value)}
                           placeholder="Enter chat name (e.g., Project Team)"
                           className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700"/>
                    <div>
                        <p className="font-semibold text-slate-600 mb-2">Select Members:</p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input
                                type="text"
                                placeholder="Search for users..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder:text-slate-500 transition"
                            />
                        </div>
                        <div
                            className="mt-2 max-h-52 overflow-y-auto p-1 rounded-md border border-slate-200 bg-slate-50 space-y-1">
                            {filteredUsers.map((u: TypeUser) => (
                                <AddUser key={u._id} user={u} isSelected={chatUsers.some(cu => cu._id === u._id)}
                                         onClick={() => addChatUser(u)}
                                         AvatarComponent={<UserAvatar name={u.username} size="w-10 h-10" isOnline={onlineUsers.includes(u._id)}/>}/>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
            {incomingCall && (
                <IncomingCallModal
                    chat={incomingCall}
                    onAccept={() => {
                        setCurrChat(incomingCall);
                        setVideoCallChat(incomingCall);
                        setShowMobileChat(true);
                        setIncomingCall(null);
                    }}
                    onDecline={() => {
                        setIncomingCall(null);
                    }}
                />
            )}
            <footer className="text-center text-sm text-slate-500 py-2 bg-white border-t border-slate-200">
            </footer>
        </div>
    );
}

export default Dashboard;
