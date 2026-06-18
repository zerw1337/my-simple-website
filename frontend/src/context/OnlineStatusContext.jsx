import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { WS_URL } from "../api/const.js";
import { AuthContext } from "./AuthContext.jsx";

export const OnlineStatusContext = createContext({
    isOnline: () => false,
    getLastSeen: () => null,
    seedLastSeen: () => {},
});

function getWsStatusUrl() {
    const token = localStorage.getItem("access_token");
    return token
        ? `${WS_URL}/status/ws/?token=${encodeURIComponent(token)}`
        : `${WS_URL}/status/ws/`;
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

                if (data.type === "online_users") {
                    setOnlineSet(new Set(data.users));
                    return;
                }

                const uid = data.user_id;
                if (!uid) return;

                if (data.type === "connected") {
                    setOnlineSet(prev => {
                        const s = new Set(prev);
                        s.add(uid);
                        return s;
                    });
                    lastSeenMap.current.delete(uid);

                } else if (data.type === "disconnected") {
                    setOnlineSet(prev => {
                        const s = new Set(prev);
                        s.delete(uid);
                        return s;
                    });
                    lastSeenMap.current.set(uid, new Date());
                }
            } catch {}
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

    // При смене auth-статуса — переконнектиться с новым (или без) токена
    useEffect(() => {
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }
        clearTimeout(reconnectTimer.current);

        if (!user) {
            setOnlineSet(new Set());
            lastSeenMap.current.clear();
        }

        connect();

        // Добавить cleanup — иначе WS остаётся при размонтировании
        return () => {
            clearTimeout(reconnectTimer.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
                wsRef.current = null;
            }
        };
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