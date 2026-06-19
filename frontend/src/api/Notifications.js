import { API_URL, WS_URL } from "./const.js";
import { fetchWithAuth, getValidAccessToken } from "./refreshToken.js";

// Личные уведомления пользователя теперь приходят через WebSocket
// (см. context/NotificationsContext.jsx), а не через polling REST-запросы.
// Эта функция собирает URL для подключения. Токен сначала проверяется и,
// если он истёк или скоро истечёт, обновляется через refresh — иначе сокет
// просто не подключится с протухшим токеном и придётся ждать реконнекта.
export async function getNotificationsWsUrl() {
    const token = await getValidAccessToken();
    if (!token) return null;
    return `${WS_URL}/notifications/ws/?token=${encodeURIComponent(token)}`;
}

// Фикс: передаём refer_to явно (null если не указан)
export async function createCustomNotification(title, body, refer_to = null) {
    const res = await fetchWithAuth(`${API_URL}/notifications/custom/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, refer_to }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}

// Welcome-уведомления (публичные, для незарегистрированных)
export async function getWelcomeNotifications() {
    const res = await fetch(`${API_URL}/notifications/welcome/`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function createWelcomeNotification(title, content, refer_to = null, pinned = true) {
    const res = await fetchWithAuth(`${API_URL}/notifications/custom/welcome/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, refer_to, pinned }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}

export async function deleteWelcomeNotification(notificationId) {
    const res = await fetchWithAuth(`${API_URL}/notifications/delete/welcome/${notificationId}/`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return res.ok;
}