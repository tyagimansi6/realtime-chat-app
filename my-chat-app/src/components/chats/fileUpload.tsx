import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone, type FileWithPath } from 'react-dropzone';
import toast, { Toaster } from 'react-hot-toast';
import axios from "axios";
import type { Message } from './types.tsx';

const apiBaseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3000/chatApp';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface FileUploadComponentProps {
    chatId: string;
    onUploadSuccess: (file: Message) => void;
    onFileSelect?: (hasFile: boolean) => void;
    initialFile?: FileWithPath | null;
}

interface ApiErrorResponse {
    success?: boolean;
    message?: string;
    error?: string;
}

function uploadFileWithPostPolicy(
    uploadUrl: string,
    uploadFields: Record<string, string>,
    file: File,
    onProgress: (percent: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        Object.entries(uploadFields).forEach(([key, value]) => {
            formData.append(key, value);
        });
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentCompleted = Math.round((event.loaded * 100) / event.total);
                onProgress(percentCompleted);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
        xhr.addEventListener('abort', () => reject(new Error('Upload was aborted.')));
        xhr.send(formData);
    });
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({ chatId, onUploadSuccess, onFileSelect, initialFile = null }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
    const [message, setMessage] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
                return;
            }
            setSelectedFile(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
    });

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to upload.');
            return;
        }
        if (!chatId) {
            toast.error('Chat ID is missing. Cannot upload file.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const toastId = toast.loading('Starting upload...');

        try {
            const response = await axios.post<{
                uploadUrl: string;
                uploadFields: Record<string, string>;
                file: Message;
            }>(`${apiBaseUrl}/chat/getUploadUrl`, {
                filename: selectedFile.name,
                contentType: selectedFile.type,
                chatId: chatId,
                content: message,
            }, {
                withCredentials: true
            });

            const { uploadUrl, uploadFields, file } = response.data;

            if (!uploadUrl || !uploadFields) {
                toast.error('Upload information is missing from server.');
                return;
            }

            toast.loading('Uploading file...', { id: toastId });

            await uploadFileWithPostPolicy(uploadUrl, uploadFields, selectedFile, (percent) => {
                setUploadProgress(percent);
                toast.loading(`Uploading... ${percent}%`, { id: toastId });
            });

            toast.success('File uploaded successfully!', { id: toastId });
            onUploadSuccess(file);
            resetState();

        } catch (err) {
            console.error('Upload failed:', err);

            let errorMessage = 'Upload failed: Unknown error';

            if (axios.isAxiosError<ApiErrorResponse>(err)) {
                if (err.response) {
                    const status = err.response.status;
                    const serverMessage = err.response.data?.message || err.response.data?.error;

                    switch (status) {
                        case 400:
                            errorMessage = `Bad request: ${serverMessage || 'Invalid file or parameters'}`;
                            break;
                        case 401:
                            errorMessage = 'Unauthorized: Please log in again';
                            break;
                        case 403:
                            errorMessage = 'Forbidden: You don\'t have permission to upload files';
                            break;
                        case 413:
                            errorMessage = 'File too large: Please select a smaller file';
                            break;
                        case 429:
                            errorMessage = 'Too many requests: Please try again later';
                            break;
                        case 500:
                            errorMessage = 'Server error: Please try again later';
                            break;
                        default:
                            errorMessage = `Upload failed (${status}): ${serverMessage || 'Server error'}`;
                    }
                } else if (err.request) {
                    errorMessage = 'Network error: Please check your connection and try again';
                } else {
                    errorMessage = `Request error: ${err.message}`;
                }
            } else if (err instanceof Error) {
                errorMessage = `Upload error: ${err.message}`;
            }

            toast.error(errorMessage, { id: toastId, duration: 5000 });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const resetState = () => {
        setSelectedFile(null);
        setMessage('');
        setUploadProgress(0);
    };

    const removeFile = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        resetState();
    };

    useEffect(() => {
        if (onFileSelect) {
            onFileSelect(!!selectedFile);
        }
    }, [selectedFile, onFileSelect]);

    useEffect(() => {
        if (initialFile) {
            setSelectedFile(initialFile);
        }
    }, [initialFile]);

    return (
        <>
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                    },
                    error: {
                        duration: 5000,
                    },
                }}
            />

            <div className="w-full max-w-xl p-4 mx-auto space-y-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                {!selectedFile ? (
                    <div
                        {...getRootProps()}
                        className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <input {...getInputProps()} />
                        <p className="text-gray-600">Drag & drop a file here, or click to select</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-2xl">📄</span>
                                <div>
                                    <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
                                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={removeFile}
                                className="p-1 text-gray-500 rounded-full hover:bg-gray-200"
                                disabled={isUploading}
                                title="Remove file"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <input
                            type="text"
                            value={message}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                            placeholder="Add a message (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isUploading}
                        />
                    </div>
                )}

                {isUploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                )}

                {selectedFile && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="px-6 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isUploading ? `Uploading... ${uploadProgress}%` : 'Send File'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default FileUploadComponent;
