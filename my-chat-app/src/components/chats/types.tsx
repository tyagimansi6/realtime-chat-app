export interface TypeUser {
    isOnline: boolean;
    _id: string;
    username: string;
    email: string;
    active: boolean;
    socketId?: string;
}

export interface TypeFile {
    _id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    fileKey: string;
    originalFilename: string;
    fileType:string;
}

export interface TypeMessage {
    _id: string;
    sender: TypeUser | string;
    content: string;
    chat: TypeChat | string;
    media?: string[];
    hasAttachment: boolean;
    attachment: TypeFile;
    seenBy: (TypeUser | string)[];
    createdAt: string;
    updatedAt: string;
}

export interface TypeChat {
    _id: string;
    name: string;
    isGroupChat: boolean;
    latestMessage: TypeMessage;
    groupAdmin: TypeUser | string;
    participants: TypeUser[];
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

// Export with original names for backward compatibility
export type User = TypeUser;
export type File = TypeFile;
export type Message = TypeMessage;
export type Chat = TypeChat;
