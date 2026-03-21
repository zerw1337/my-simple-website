import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css"

let toastVisible = false;

function showRateLimitToast() {
    if (toastVisible) return;
    toastVisible = true;

    // Overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 9998;
        display: flex; align-items: center; justify-content: center;
    `;

    // Modal
    const modal = document.createElement("div");
    modal.style.cssText = `
        background: #1f1f1f;
        border: 1px solid #ff5555;
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
        color: #ff7070;
        font-family: 'Poppins', sans-serif;
        font-size: 1.4rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    `;

    const subtitle = document.createElement("div");
    subtitle.textContent = "Страница обновится автоматически через";
    subtitle.style.cssText = `
        color: #aaa;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        margin-bottom: 1.25rem;
    `;

    const countdown = document.createElement("div");
    countdown.style.cssText = `
        color: #ff7070;
        font-family: 'Poppins', sans-serif;
        font-size: 3.5rem;
        font-weight: 800;
        line-height: 1;
        margin-bottom: 1.5rem;
    `;

    const bar = document.createElement("div");
    bar.style.cssText = `
        width: 100%;
        height: 4px;
        background: #333;
        border-radius: 2px;
        overflow: hidden;
    `;
    const barFill = document.createElement("div");
    barFill.style.cssText = `
        height: 100%;
        width: 100%;
        background: #ff5555;
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

const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const res = await originalFetch(...args);
    if (res.status === 429) {
        showRateLimitToast();
        return res.clone();
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