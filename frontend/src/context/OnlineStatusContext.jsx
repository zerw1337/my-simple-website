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
    return `${wsBase}/status/ws/?token=${encodeURIComponent(token)}`;
}

function formatLastSeen(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date + (date.endsWith("Z") ? "" : "Z"));
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
    // Set of user IDs that are currently online
    const [onlineSet, setOnlineSet] = useState(() => new Set());
    // Map userId → Date (last seen)
    const lastSeenMap = useRef(new Map());
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);

    const connect = useCallback(() => {
        if (!localStorage.getItem("access_token")) return;
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
                    setOnlineSet(prev => {
                        const next = new Set(prev);
                        next.add(uid);
                        return next;
                    });
                    // clear last_seen for this user (they're online now)
                    lastSeenMap.current.delete(uid);
                } else if (data.type === "disconnected") {
                    setOnlineSet(prev => {
                        const next = new Set(prev);
                        next.delete(uid);
                        return next;
                    });
                    // record disconnect time as last seen
                    lastSeenMap.current.set(uid, new Date());
                }
            } catch { /* ignore parse errors */ }
        };

        ws.onclose = () => {
            wsRef.current = null;
            // Reconnect after 5s if user still logged in
            if (localStorage.getItem("access_token")) {
                reconnectTimer.current = setTimeout(connect, 5000);
            }
        };

        ws.onerror = () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        if (user) {
            connect();
        } else {
            // User logged out — close WS
            if (wsRef.current) {
                wsRef.current.onclose = null; // prevent reconnect loop
                wsRef.current.close();
                wsRef.current = null;
            }
            clearTimeout(reconnectTimer.current);
            setOnlineSet(new Set());
            lastSeenMap.current.clear();
        }
        return () => {
            clearTimeout(reconnectTimer.current);
        };
    }, [user, connect]);

    /** Seed last_seen from API data (call after fetching profile/chat/etc.) */
    const seedLastSeen = useCallback((userId, lastSeenValue) => {
        if (!userId || !lastSeenValue) return;
        // Don't overwrite if currently online
        if (onlineSet.has(userId)) return;
        lastSeenMap.current.set(userId, lastSeenValue);
    }, [onlineSet]);

    const isOnline = useCallback((userId) => {
        return onlineSet.has(userId);
    }, [onlineSet]);

    const getLastSeen = useCallback((userId) => {
        const raw = lastSeenMap.current.get(userId);
        if (!raw) return null;
        return formatLastSeen(raw);
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

export { formatLastSeen };
