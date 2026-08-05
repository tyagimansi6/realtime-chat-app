import React, { useState, useEffect } from 'react';
import { Loader2, File as FileIcon, Image as ImageIcon, FileText as PdfIcon } from 'lucide-react';
import type { TypeMessage } from './types';
import axios from "axios";
import toast from "react-hot-toast";

type MessageProps = {
    message: TypeMessage;
    isCurrentUserSender: boolean;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    showDate: boolean;
    formatDate: (dateString: string) => string;
    formatTime: (dateString: string) => string;
    handleFileDownload: (fileKey: string, filename: string) => void;
    downloadingFiles: Record<string, boolean>;
};

const Message: React.FC<MessageProps> = ({
                                             message,
                                             isCurrentUserSender,
                                             isFirstInGroup,
                                             isLastInGroup,
                                             showDate,
                                             formatDate,
                                             formatTime,
                                             handleFileDownload,
                                             downloadingFiles,
                                         }) => {
    const [attachmentUrl, setAttachmentUrl] = useState<string>('');
    const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);
    const [urlError, setUrlError] = useState<boolean>(false);

    const tailClass = isLastInGroup ? (isCurrentUserSender ? 'rounded-br-none' : 'rounded-bl-none') : '';
    const apiBaseUrl = import.meta.env.VITE_API_BASE;

    // Fixed getDownloadUrl function - now properly async
    const getDownloadUrl = async (fileKey: string): Promise<string> => {
        try {
            const response = await axios.post(
                `${apiBaseUrl}/chat/getDownloadUrl`,
                { fileKey },
                { withCredentials: true }
            );

            if (response.data.success) {
                return response.data.downloadUrl;
            } else {
                toast.error("Error getting File");
                throw new Error("Failed to get download URL");
            }
        } catch (error) {
            toast.error("Error getting file");
            throw error;
        }
    };

    // Load attachment URL when component mounts or fileKey changes
    useEffect(() => {
        if (message.hasAttachment && message.attachment?.fileKey) {
            setIsLoadingUrl(true);
            setUrlError(false);

            getDownloadUrl(message.attachment.fileKey)
                .then(url => {
                    setAttachmentUrl(url);
                    setIsLoadingUrl(false);
                })
                .catch(err => {
                    console.error('Failed to get attachment URL:', err);
                    setUrlError(true);
                    setIsLoadingUrl(false);
                });
        }
    }, [message.attachment?.fileKey]);

    const renderFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) {
            return <ImageIcon className="h-5 w-5" />;
        }
        if (fileType === 'application/pdf') {
            return <PdfIcon className="h-5 w-5" />;
        }
        return <FileIcon className="h-5 w-5" />;
    };

    const renderAttachment = () => {
        if (!message.hasAttachment || !message.attachment) return null;

        if (isLoadingUrl) {
            return (
                <div className="flex items-center justify-center p-4 mb-2">
                    <Loader2 className="animate-spin h-6 w-6" />
                    <span className="ml-2">Loading attachment...</span>
                </div>
            );
        }

        if (urlError || !attachmentUrl) {
            return (
                <div className="mb-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {renderFileIcon(message.attachment.fileType || '')}
                        <span className="font-medium text-red-500">Failed to load attachment</span>
                    </div>
                </div>
            );
        }

        // Render based on file type
        if (message.attachment.fileType?.startsWith('image/')) {
            return (
                <img
                    src={attachmentUrl}
                    alt={message.attachment.originalFilename || 'Image attachment'}
                    className="max-w-full h-auto rounded-lg mb-2"
                    onError={() => {
                        console.error('Image failed to load');
                        setUrlError(true);
                    }}
                />
            );
        }

        if (message.attachment.fileType === 'application/pdf') {
            return (
                <div className="mb-2">
                    <div className="flex items-center gap-2 mb-2">
                        {renderFileIcon(message.attachment.fileType)}
                        <span className="font-medium">
                            {message.attachment.originalFilename || message.attachment.name || 'PDF File'}
                        </span>
                    </div>
                    <embed
                        src={attachmentUrl}
                        type="application/pdf"
                        width="100%"
                        height="400px"
                        className="rounded-lg border"
                    />
                </div>
            );
        }

        // For other file types, show file info
        return (
            <div className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                    {renderFileIcon(message.attachment.fileType || '')}
                    <div>
                        <span className="font-medium">
                            {message.attachment.originalFilename || message.attachment.name || 'File'}
                        </span>
                        {message.attachment.fileType && (
                            <p className={`text-xs ${isCurrentUserSender ? 'text-blue-100' : 'text-slate-500'}`}>
                                {message.attachment.fileType}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <React.Fragment>
            {showDate && message.createdAt && (
                <div className="text-center text-xs text-slate-500 my-4">
                    {formatDate(message.createdAt)}
                </div>
            )}
            <div className={`flex flex-col ${isCurrentUserSender ? 'items-end' : 'items-start'}`}>
                {isFirstInGroup && !isCurrentUserSender && (
                    <div className="text-xs text-slate-500 ml-3 mb-1 font-medium">
                        {typeof message.sender === 'string' ? 'Unknown User' : message.sender?.username}
                    </div>
                )}

                <div className={`
                    rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 max-w-[85%] sm:max-w-lg md:max-w-2xl
                    ${tailClass}
                    ${isCurrentUserSender
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-slate-800 border border-slate-200'
                }
                    ${isFirstInGroup && isCurrentUserSender ? 'mt-2 sm:mt-3' : ''}
                `}>
                    {message.hasAttachment && message.attachment ? (
                        <div className="file-attachment">
                            {renderAttachment()}

                            <button
                                className={`inline-block px-3 py-1 rounded text-xs font-medium ${isCurrentUserSender
                                    ? 'bg-blue-400 text-white hover:bg-blue-300'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                                onClick={() => handleFileDownload(message.attachment.fileKey, message.attachment.originalFilename || message.attachment.name)}
                                disabled={downloadingFiles[message.attachment.fileKey]}
                            >
                                {downloadingFiles[message.attachment.fileKey] ? (
                                    <span className="flex items-center">
                                        <Loader2 size={12} className="animate-spin mr-1" />
                                        Downloading...
                                    </span>
                                ) : (
                                    'Download'
                                )}
                            </button>

                            {message.content && (
                                <p className="text-sm sm:text-base break-words whitespace-pre-wrap mt-2">
                                    {message.content}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm sm:text-base break-words whitespace-pre-wrap">
                            {message.content}
                        </p>
                    )}

                    {message.createdAt && (
                        <p className={`text-xs mt-1 text-right opacity-80 ${isCurrentUserSender ? 'text-blue-200' : 'text-slate-400'}`}>
                            {formatTime(message.createdAt)}
                        </p>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
};

export default Message;
