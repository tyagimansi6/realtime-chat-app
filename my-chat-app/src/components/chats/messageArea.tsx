import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "../../context/userContext.tsx";
import type {TypeChat, TypeMessage, TypeUser} from "./types.tsx";
import { Loader2, UploadCloud } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import FileUploadComponent from "./fileUpload.tsx";
import { type FileWithPath, useDropzone } from "react-dropzone";
import Message from "./message.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3000/chatApp';

type MessageAreaProps = {
    messages: TypeMessage[];
    chat: TypeChat;
    setMessages: React.Dispatch<React.SetStateAction<TypeMessage[]>>;
} & React.HTMLAttributes<HTMLDivElement>;

function MessageArea({ messages = [], setMessages, chat, ...props }: MessageAreaProps) {
    const { user, loading: userLoading } = useUser();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [downloadingFiles, setDownloadingFiles] = useState<Record<string, boolean>>({});
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
    const [droppedFile, setDroppedFile] = useState<FileWithPath | null>(null);

    const onDrop = useCallback((acceptedFiles: FileWithPath[] = []) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            setDroppedFile(acceptedFiles[0]);
            setIsFileUploadModalOpen(true);
        }
    }, []);

    const { getRootProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
    });

    const handleUploadSuccess = (file: TypeMessage) => {
        setMessages((prev) => [...prev, file]);
        setIsFileUploadModalOpen(false);
        setDroppedFile(null);
    };

    const chatId = chat._id;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    };

    const handleFileDownload = async (fileKey: string, filename: string) => {
        if (!fileKey) {
            toast.error("File information is missing");
            return;
        }

        setDownloadingFiles(prev => ({ ...prev, [fileKey]: true }));

        try {
            const response = await axios.post(
                `${apiBaseUrl}/chat/getDownloadUrl`,
                { fileKey },
                { withCredentials: true }
            );

            if (response.data.success && response.data.downloadUrl) {
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.setAttribute('download', filename || 'download');
                link.setAttribute('target', '_blank');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success("Download started");
            } else {
                toast.error("Failed to get download URL");
            }
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Error downloading file");
        } finally {
            setDownloadingFiles(prev => ({ ...prev, [fileKey]: false }));
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString();
        }
    };

    // Helper function to get sender ID
    const getSenderId = (sender: TypeUser | string): string => {
        return typeof sender === 'string' ? sender : sender._id;
    };

    if (userLoading || !user) {
        return (
            <div className="flex-grow flex items-center justify-center text-slate-500 bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div
            {...props}
            {...getRootProps()}
            className={`flex-grow p-3 sm:p-4 md:p-6 overflow-y-auto bg-slate-100 relative transition-all duration-200 ${isDragActive ? 'border-2 border-dashed border-indigo-500 bg-indigo-50' : ''}`}>

            {isDragActive && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="bg-white bg-opacity-80 p-6 rounded-full shadow-lg">
                        <UploadCloud size={64} className="text-indigo-600" />
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-y-1 sm:gap-y-2">
                {messages.map((message, index) => {
                    const currentSenderId = getSenderId(message.sender);
                    const isCurrentUserSender = currentSenderId === user._id;

                    const prevMessage = messages[index - 1];
                    const nextMessage = messages[index + 1];

                    const isFirstInGroup = !prevMessage || getSenderId(prevMessage.sender) !== currentSenderId;
                    const isLastInGroup = !nextMessage || getSenderId(nextMessage.sender) !== currentSenderId;

                    const showDate = !prevMessage || !message.createdAt || !prevMessage.createdAt || formatDate(prevMessage.createdAt) !== formatDate(message.createdAt);

                    return (
                        <Message
                            key={message._id}
                            message={message}
                            isCurrentUserSender={isCurrentUserSender}
                            isFirstInGroup={isFirstInGroup}
                            isLastInGroup={isLastInGroup}
                            showDate={showDate}
                            formatDate={formatDate}
                            formatTime={formatTime}
                            handleFileDownload={handleFileDownload}
                            downloadingFiles={downloadingFiles}
                        />
                    );
                })}
            </div>

            <div ref={messagesEndRef} />
            {isFileUploadModalOpen && (
                <div className="fixed inset-0 bg-white/10 backdrop-blur-lg backdrop-saturate-150 flex items-center justify-center z-50"
                     onClick={() => setIsFileUploadModalOpen(false)}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <FileUploadComponent
                            chatId={chatId}
                            onUploadSuccess={handleUploadSuccess}
                            onFileSelect={() => {}}
                            initialFile={droppedFile}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default MessageArea;
