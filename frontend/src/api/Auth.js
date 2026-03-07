import { API_URL } from "./const.js";

// Логин через form-urlencoded
export async function login(username, password) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.detail || "Ошибка при логине");

    return data; // { access_token, refresh_token, token_type }
}

// Заголовки для защищённых запросов
export function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Логаут
export function logout() {
    localStorage.clear();
}