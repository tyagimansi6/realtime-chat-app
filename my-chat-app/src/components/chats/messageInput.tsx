import React, {useState, useRef, useEffect, useLayoutEffect, type Dispatch, type SetStateAction} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Send, Loader2, Paperclip } from 'lucide-react';
import type {Message, TypeChat} from "./types.tsx";
import FileUploadComponent from "./fileUpload";
import { apiBaseUrl } from "../../config/api";

type MessageInputProps = {
    chat: TypeChat | null;
    setMessages: (updateFn: (prev: Message[]) => Message[]) => void;
    disabled: boolean;
    setChats : Dispatch<SetStateAction<TypeChat[]>>
};

function MessageInput({ chat, setMessages, disabled , setChats }: MessageInputProps) {
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const minHeightCalculated = useRef(false);
    const shouldMaintainFocus = useRef(false);

    const chatId=chat?._id;

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Calculate and set the CSS min-height property only once.
            if (!minHeightCalculated.current) {
                const computedStyle = window.getComputedStyle(textarea);
                const paddingTop = parseFloat(computedStyle.paddingTop);
                const paddingBottom = parseFloat(computedStyle.paddingBottom);
                let lineHeight = parseFloat(computedStyle.lineHeight);

                // If lineHeight is 'normal' (which evaluates to NaN), calculate it based on font-size.
                if (isNaN(lineHeight)) {
                    const fontSize = parseFloat(computedStyle.fontSize);
                    lineHeight = fontSize * 1.2; // A common browser ratio for 'normal' line-height.
                }

                const oneLineHeight = (lineHeight) + paddingTop + paddingBottom;
                textarea.style.minHeight = `${oneLineHeight}px`;
                minHeightCalculated.current = true;
            }

            // The auto-sizing logic now respects the CSS min-height.
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [content]);

    useEffect(() => {
        if (!disabled && textareaRef.current) {
            textareaRef.current.focus();
        } else if (disabled) {
            // Reset content when disabled (e.g., when a chat is left)
            setContent("");
            setShowFileUpload(false);
        }
    }, [disabled]);

    // Effect to maintain focus after sending
    useEffect(() => {
        if (shouldMaintainFocus.current && !isSending && textareaRef.current && !disabled) {
            textareaRef.current.focus();
            shouldMaintainFocus.current = false;
        }
    }, [isSending, disabled]);

    const sendMessage = () => {
        if (disabled || !chatId || !content.trim() || isSending) return;

        shouldMaintainFocus.current = true;
        setIsSending(true);

        axios
            .post(`${apiBaseUrl}/chat/sendMessage`, { content: content.trim(), chatId }, { withCredentials: true })
            .then((response) => {
                setContent("");
                setMessages((prev) => [...prev, response.data]);
                setChats(prevChats=>prevChats.map((ch)=>
                    ch._id===chatId ?{ ...ch, latestMessage: response.data } : ch ))
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message || "Failed to send message");
                shouldMaintainFocus.current = false;
            })
            .finally(() => {

                setIsSending(false);
            });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleFileUploadSuccess = (file: Message) => {
        setMessages((prev) => [...prev, file]);
        setShowFileUpload(false);
        // Focus back to textarea after file upload
        setTimeout(() => {
            if (textareaRef.current && !disabled) {
                textareaRef.current.focus();
            }
        }, 100);
    };

    const handleCancelUpload = () => {
        setShowFileUpload(false);
        // Focus back to textarea after canceling upload
        setTimeout(() => {
            if (textareaRef.current && !disabled) {
                textareaRef.current.focus();
            }
        }, 100);
    };

    const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : '';

    return (
        <div className={`p-4 transition-opacity ${disabledClass}`}>
            {showFileUpload && !disabled ? (
                <div className="mb-4">
                    <FileUploadComponent
                        chatId={chatId!}
                        onUploadSuccess={handleFileUploadSuccess}
                    />
                    <div className="flex justify-center mt-2">
                        <button
                            onClick={handleCancelUpload}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-end gap-3">
                    <button
                        onClick={() => setShowFileUpload(true)}
                        disabled={disabled}
                        className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-slate-200 text-slate-600 rounded-full transition-all duration-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        aria-label="Attach File"
                    >
                        <Paperclip size={22} />
                    </button>
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={disabled ? "Select a chat to start messaging" : "Type a message..."}
                        className="flex-grow p-3 text-base bg-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all max-h-40 overflow-y-auto disabled:cursor-not-allowed"
                        disabled={disabled || isSending}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={disabled || !content.trim() || isSending}
                        className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full transition-all duration-200 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-indigo-300"
                        aria-label="Send Message"
                    >
                        {isSending ? (
                            <Loader2 size={22} className="animate-spin" />
                        ) : (
                            <Send size={22} className="transform -rotate-12" />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

export default MessageInput;
