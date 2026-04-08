import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css"

// --- Глобальный 429 (блокирующий) ---
let toastVisible = false;

function showRateLimitToast() {
    if (toastVisible) return;
    toastVisible = true;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 9998;
        display: flex; align-items: center; justify-content: center;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
        background: #161b24;
        border: 1px solid rgba(255,80,80,0.35);
        border-radius: 16px;
        padding: 2.5rem 3rem;
        text-align: center;
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.8);
        max-width: 420px;
        width: 90%;
    `;

    const icon = document.createElement("div");
    icon.textContent = "⚠️";
    icon.style.cssText = `font-size: 3rem; margin-bottom: 1rem;`;

    const title = document.createElement("div");
    title.textContent = "Слишком много запросов";
    title.style.cssText = `
        color: rgb(255,110,110);
        font-family: 'Segoe UI', Tahoma, sans-serif;
        font-size: 1.4rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    `;

    const subtitle = document.createElement("div");
    subtitle.textContent = "Страница обновится автоматически через";
    subtitle.style.cssText = `
        color: rgb(100,130,160);
        font-family: 'Segoe UI', Tahoma, sans-serif;
        font-size: 0.95rem;
        margin-bottom: 1.25rem;
    `;

    const countdown = document.createElement("div");
    countdown.style.cssText = `
        color: rgb(255,110,110);
        font-family: 'Segoe UI', Tahoma, sans-serif;
        font-size: 3.5rem;
        font-weight: 800;
        line-height: 1;
        margin-bottom: 1.5rem;
    `;

    const bar = document.createElement("div");
    bar.style.cssText = `
        width: 100%;
        height: 4px;
        background: rgba(100,160,220,0.1);
        border-radius: 2px;
        overflow: hidden;
    `;
    const barFill = document.createElement("div");
    barFill.style.cssText = `
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, rgb(4,198,233), rgb(180,255,255));
        border-radius: 2px;
        transition: width 1s linear;
    `;
    bar.appendChild(barFill);

    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(subtitle);
    modal.appendChild(countdown);
    modal.appendChild(bar);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const SECONDS = 10;
    let remaining = SECONDS;

    const tick = () => {
        countdown.textContent = remaining;
        barFill.style.width = `${(remaining / SECONDS) * 100}%`;
    };
    tick();

    const interval = setInterval(() => {
        remaining -= 1;
        tick();
        if (remaining <= 0) {
            clearInterval(interval);
            overlay.remove();
            toastVisible = false;
            window.location.reload();
        }
    }, 1000);
}

function showSoftToast(message) {
    if (document.getElementById("soft-rate-toast")) return;

    const toast = document.createElement("div");
    toast.id = "soft-rate-toast";
    toast.textContent = "⏱ " + message;
    toast.style.cssText = `
        position: fixed;
        top: 1.25rem;
        right: 1.25rem;
        background: #161b24;
        border: 1px solid rgba(180,200,255,0.2);
        border-radius: 10px;
        padding: 0.65rem 1.1rem;
        color: rgb(140,175,210);
        font-family: 'Segoe UI', Tahoma, sans-serif;
        font-size: 0.85rem;
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        max-width: 280px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

const SOFT_LIMIT_DETAILS = [
    "Your comment limit per day has been reached",
    "Your reaction limit per day has been reached",
    "Your limit for sending emails per day has been reached",
    "Password changing limit per day has been reached",
    "Too Many Requests",
];

const SOFT_LIMIT_MESSAGES = {
    "Your comment limit per day has been reached": "Достигнут дневной лимит комментариев",
    "Your reaction limit per day has been reached": "Достигнут дневной лимит реакций",
    "Your limit for sending emails per day has been reached": "Достигнут дневной лимит отправки писем",
    "Password changing limit per day has been reached": "Достигнут дневной лимит смены пароля",
    "Too Many Requests": "Слишком много запросов. Подождите немного.",
};

const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const res = await originalFetch(...args);
    if (res.status === 429) {
        const clone = res.clone();
        try {
            const data = await clone.json();
            const detail = data?.detail || data?.message;
            if (detail && SOFT_LIMIT_DETAILS.includes(detail)) {
                showSoftToast(SOFT_LIMIT_MESSAGES[detail]);
            } else {
                showRateLimitToast();
            }
        } catch {
            showRateLimitToast();
        }
    }
    return res;
};

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);