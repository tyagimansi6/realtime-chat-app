/**
 * Backend origin (no trailing slash, no /chatApp path).
 * Set VITE_API_URL in .env (local) or Vercel / .env.production (deployed).
 */
function resolveBackendUrl(): string {
    const fromUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (fromUrl?.trim()) {
        return fromUrl.trim().replace(/\/$/, '');
    }

    // Legacy support: VITE_API_BASE may include /chatApp
    const fromBase = import.meta.env.VITE_API_BASE as string | undefined;
    if (fromBase?.trim()) {
        return fromBase.trim().replace(/\/chatApp\/?$/, '').replace(/\/$/, '');
    }

    return 'http://localhost:3000';
}

/** Express origin used by Socket.IO (path /chatApp/socket.io is set separately). */
export const socketServerUrl = resolveBackendUrl();

/** REST API prefix for ChatApp routes (…/chatApp/auth/…, …/chatApp/chat/…). */
export const apiBaseUrl = `${socketServerUrl}/chatApp`;
