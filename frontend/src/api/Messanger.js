import { API_URL, WS_URL } from "./const.js";
import { fetchWithAuth } from "./refreshToken.js";

export async function createChat(userId) {
    const res = await fetchWithAuth(`${API_URL}/chats/${userId}`, { method: "POST" });
    if (!res.ok) throw new Error((await res.json()).detail || "Не удалось создать чат");
    return await res.json();
}

export async function getMyChats() {
    const res = await fetchWithAuth(`${API_URL}/chats/my/`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function getChatMessages(chatUuid) {
    const res = await fetchWithAuth(`${API_URL}/chats/${chatUuid}`);
    if (!res.ok) throw new Error((await res.json()).detail || "Не удалось загрузить чат");
    return await res.json();
}

export function getWsUrl(chatUuid) {
    const token = localStorage.getItem("access_token");
    return `${WS_URL}/chats/${chatUuid}/ws/?token=${encodeURIComponent(token)}`;
}