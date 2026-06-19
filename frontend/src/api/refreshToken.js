import { API_URL } from "./const.js";

let isRefreshing = false;
let queue = [];

function processQueue(error, token = null) {
    queue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    queue = [];
}

// Декодирует payload JWT (без проверки подписи — она нам тут не нужна,
// просто хотим узнать exp на фронте) и возвращает unix-время истечения в мс.
function getTokenExpiryMs(token) {
    try {
        const payload = token.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );
        const { exp } = JSON.parse(json);
        return exp ? exp * 1000 : null;
    } catch {
        return null;
    }
}

// Общая логика обновления access_token. Если рефреш уже идёт — подписываемся
// в очередь и получаем тот же новый токен, не дублируя запрос к /auth/refresh/.
async function refreshAccessToken() {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            queue.push({ resolve, reject });
        });
    }

    isRefreshing = true;
    const refreshToken = localStorage.getItem("refresh_token");

    try {
        const res = await fetch(`${API_URL}/auth/refresh/`, {
            headers: { Authorization: `Bearer ${refreshToken}` },
        });

        if (!res.ok) throw new Error("Refresh failed");

        const data = await res.json();
        const newToken = data.access_token;
        localStorage.setItem("access_token", newToken);

        processQueue(null, newToken);
        return newToken;
    } catch (err) {
        processQueue(err);
        throw err;
    } finally {
        isRefreshing = false;
    }
}

export async function fetchWithAuth(url, options = {}) {
    const accessToken = localStorage.getItem("access_token");

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (response.status !== 401) return response;

    try {
        const newToken = await refreshAccessToken();
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
            },
        });
    } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
        throw err;
    }
}

// Используется перед открытием любого WebSocket (chats/notifications/status):
// в отличие от обычных запросов, у соединения нет встроенного повтора через
// fetchWithAuth, поэтому токен нужно проверить и при необходимости обновить
// ДО того, как мы попытаемся подключиться — иначе сокет просто не примет
// сервер и придётся ждать следующего реконнекта.
// Возвращает валидный access_token, либо null (нет сессии или рефреш не удался —
// в этом случае сокет должен будет подключаться как неавторизованный/гость).
export async function getValidAccessToken() {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    const expiresAt = getTokenExpiryMs(token);
    // Запас 10 секунд, чтобы не успеть протухнуть прямо во время handshake
    if (expiresAt && expiresAt - Date.now() > 10_000) {
        return token;
    }

    try {
        return await refreshAccessToken();
    } catch {
        return null;
    }
}