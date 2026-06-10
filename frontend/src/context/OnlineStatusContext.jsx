import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { API_URL } from "../api/const.js";
import { AuthContext } from "./AuthContext.jsx";

export const OnlineStatusContext = createContext({
    isOnline: () => false,
    getLastSeen: () => null,
    seedLastSeen: () => {},
});

function getWsStatusUrl() {
    const token = localStorage.getItem("access_token");
    const wsBase = API_URL.replace(/^http/, "ws");
    // Авторизованные — с токеном, гости — без (бэкенд примет и тех и других)
    return token
        ? `${wsBase}/status/ws/?token=${encodeURIComponent(token)}`
        : `${wsBase}/status/ws/`;
}

export function formatLastSeen(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date + (String(date).endsWith("Z") ? "" : "Z"));
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "только что";
    if (m < 60) return `${m} мин. назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч. назад`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days} д. назад`;
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function OnlineStatusProvider({ children }) {
    const { user } = useContext(AuthContext);
    const [onlineSet, setOnlineSet] = useState(() => new Set());
    const lastSeenMap = useRef(new Map());
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);

    const connect = useCallback(() => {
        if (wsRef.current &&
            (wsRef.current.readyState === WebSocket.OPEN ||
                wsRef.current.readyState === WebSocket.CONNECTING)) return;

        const ws = new WebSocket(getWsStatusUrl());
        wsRef.current = ws;

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                const uid = data.user_id;
                if (!uid) return;

                if (data.type === "connected") {
                    setOnlineSet(prev => { const s = new Set(prev); s.add(uid); return s; });
                    lastSeenMap.current.delete(uid);
                } else if (data.type === "disconnected") {
                    setOnlineSet(prev => { const s = new Set(prev); s.delete(uid); return s; });
                    lastSeenMap.current.set(uid, new Date());
                }
            } catch { /* ignore */ }
        };

        ws.onopen = () => {
            // Heartbeat: пингуем каждые 30 сек чтобы держать соединение живым в фоновых вкладках
            const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "ping" }));
                } else {
                    clearInterval(pingInterval);
                }
            }, 30_000);
            ws._pingInterval = pingInterval;
        };

        ws.onclose = () => {
            clearInterval(ws._pingInterval);
            wsRef.current = null;
            // Переподключаемся всегда (и авторизованные и гости)
            reconnectTimer.current = setTimeout(connect, 5000);
        };

        ws.onerror = () => ws.close();
    }, []);

    // Подключаемся сразу при монтировании — и для авторизованных и для гостей
    useEffect(() => {
        connect();
        return () => {
            clearTimeout(reconnectTimer.current);
            if (wsRef.current) {
                wsRef.current.onclose = null; // не реконнектиться при анмаунте
                wsRef.current.close();
            }
        };
    }, [connect]);

    // При смене auth-статуса — переконнектиться с новым (или без) токена
    useEffect(() => {
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }
        clearTimeout(reconnectTimer.current);

        if (!user) {
            // Гость: чистим стейт авторизованного юзера, но WS оставляем
            setOnlineSet(new Set());
            lastSeenMap.current.clear();
        }

        connect();
    }, [user, connect]);

    const seedLastSeen = useCallback((userId, lastSeenValue) => {
        if (!userId || !lastSeenValue) return;
        if (onlineSet.has(userId)) return;
        lastSeenMap.current.set(userId, lastSeenValue);
    }, [onlineSet]);

    const isOnline = useCallback((userId) => onlineSet.has(userId), [onlineSet]);
    const getLastSeen = useCallback((userId) => {
        const raw = lastSeenMap.current.get(userId);
        return raw ? formatLastSeen(raw) : null;
    }, []);

    return (
        <OnlineStatusContext.Provider value={{ isOnline, getLastSeen, seedLastSeen }}>
            {children}
        </OnlineStatusContext.Provider>
    );
}

export function useOnlineStatus() {
    return useContext(OnlineStatusContext);
}