import { API_URL } from "./const.js";


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


export function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}


export function logout() {
    localStorage.clear();
}

export async function register(username, email, password) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);

    const res = await fetch(`${API_URL}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Ошибка регистрации");
    return data;
}

export async function verifyCode(code) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/register/verify/?code=${code}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Неверный код");
    return data;
}

export async function resendCode() {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/register/verify/resend_code/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Ошибка");
    return data;
}

export async function createProfile(firstName, lastName, birthday, bio) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/register/create_profile/`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            birthday,
            bio,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Ошибка создания профиля");
    return data;
}