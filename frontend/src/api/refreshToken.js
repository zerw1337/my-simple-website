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


    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            queue.push({ resolve, reject });
        }).then((newToken) => {
            return fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${newToken}`,
                },
            });
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

        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
            },
        });
    } catch (err) {
        processQueue(err);
        localStorage.clear();
        window.location.href = "/login";
        throw err;
    } finally {
        isRefreshing = false;
    }
}