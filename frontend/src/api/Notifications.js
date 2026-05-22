import { API_URL } from "./const.js";
import { fetchWithAuth } from "./refreshToken.js";

export async function getMyNotifications() {
    const res = await fetchWithAuth(`${API_URL}/notifications/`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function readNotification(notificationId) {
    const res = await fetchWithAuth(`${API_URL}/notifications/read/${notificationId}/`, {
        method: "PATCH",
    });
    return res.ok;
}

export async function readAllNotifications() {
    const res = await fetchWithAuth(`${API_URL}/notifications/read/all/`, {
        method: "PATCH",
    });
    return res.ok;
}

export async function deleteNotification(notificationId) {
    const res = await fetchWithAuth(`${API_URL}/notifications/delete/${notificationId}/`, {
        method: "DELETE",
    });
    return res.ok;
}

export async function deleteAllNotifications() {
    const res = await fetchWithAuth(`${API_URL}/notifications/delete/all/`, {
        method: "DELETE",
    });
    return res.ok;
}

export async function createCustomNotification(title, body) {
    const res = await fetchWithAuth(`${API_URL}/notifications/custom/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}