import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { AuthContext } from "./AuthContext.jsx";
import { getNotificationsWsUrl } from "../api/Notifications.js";

const RECONNECT_DELAY = 5000;
const PING_INTERVAL = 30000;

const NotificationsContext = createContext({
    notifications: [],
    wsStatus: "idle",
    markRead: () => {},
    markAllRead: () => {},
    deleteOne: () => {},
    deleteAll: () => {},
});

// Уведомления пользователя приходят через персистентный WebSocket вместо
// GET-поллинга каждые 30 секунд. При подключении сервер сразу присылает
// {type: "connected", notifications: [...]} — это и есть начальная загрузка.
// Дальше новые уведомления (new_post / new_comment / new_message /
// create_custom_notification) приходят живьём, как только сервер их создаёт.
// Welcome-уведомления (WelcomeBanner) этот контекст не затрагивает — они
// остаются на REST, как и были.
export function NotificationsProvider({ children }) {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [wsStatus, setWsStatus] = useState("idle");

    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const pingIntervalRef = useRef(null);
    const tempIdRef = useRef(0);

    const cleanupSocket = useCallback(() => {
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.onopen = null;
            wsRef.current.onmessage = null;
            wsRef.current.onclose = null;
            wsRef.current.onerror = null;
            try { wsRef.current.close(); } catch { /* noop */ }
            wsRef.current = null;
        }
    }, []);

    const connect = useCallback(() => {
        const url = getNotificationsWsUrl();
        if (!url) return; // не авторизован — нет токена, подключаться нет смысла

        setWsStatus("connecting");
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setWsStatus("open");
            pingIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "ping" }));
                }
            }, PING_INTERVAL);
        };

        ws.onmessage = (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch {
                return;
            }

            switch (data.type) {
                case "connected": {
                    setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
                    break;
                }

                // Живые пуши о новых уведомлениях
                case "new_post":
                case "new_comment":
                case "new_message":
                case "create_custom_notification": {
                    const payload = data.notification || {};
                    tempIdRef.current -= 1;
                    const tempEntry = {
                        id: tempIdRef.current, // отрицательный id-заглушка, реальный id придёт после переподключения
                        user_id: user?.id ?? null,
                        status: "unread",
                        notification: {
                            title: payload.title ?? "",
                            body: payload.body ?? "",
                            refer_to: payload.refer_to ?? null,
                            created_at: payload.created_at ?? new Date().toISOString(),
                        },
                    };
                    setNotifications((prev) => [tempEntry, ...prev]);
                    break;
                }

                case "read_current_notification": {
                    if (data.status === "Success" && data.notification_id != null) {
                        setNotifications((prev) =>
                            prev.map((n) => (n.id === data.notification_id ? { ...n, status: "read" } : n))
                        );
                    }
                    break;
                }

                case "read_all_notifications": {
                    if (data.status === "Success") {
                        setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
                    }
                    break;
                }

                case "delete_current_notification": {
                    if (data.status === "Success" && data.notification_id != null) {
                        setNotifications((prev) => prev.filter((n) => n.id !== data.notification_id));
                    }
                    break;
                }

                case "delete_all_notifications": {
                    if (data.status === "Success") {
                        setNotifications([]);
                    }
                    break;
                }

                default:
                    break;
            }
        };

        ws.onclose = () => {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }
            if (wsRef.current === ws) {
                wsRef.current = null;
            }
            setWsStatus("disconnected");
            reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
        };

        ws.onerror = () => {
            try { ws.close(); } catch { /* noop */ }
        };
    }, [user]);

    useEffect(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        cleanupSocket();

        if (!user) {
            setNotifications([]);
            setWsStatus("idle");
            return;
        }

        connect();

        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            cleanupSocket();
        };
    }, [user, connect, cleanupSocket]);

    const sendWs = useCallback((payload) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
            return true;
        }
        return false;
    }, []);

    // id > 0 — настоящая запись из базы, можно сообщить серверу.
    // id < 0 — локальная заглушка для только что пришедшего пуша, у неё ещё
    // нет реального id в базе, поэтому действие применяем только локально.
    const isRealId = (id) => typeof id === "number" && id > 0;

    const markRead = useCallback((id) => {
        setNotifications((prev) => {
            const target = prev.find((n) => n.id === id);
            if (target && target.status !== "read" && isRealId(id)) {
                sendWs({ type: "read_current_notification", notification_id: id });
            }
            return prev.map((n) => (n.id === id ? { ...n, status: "read" } : n));
        });
    }, [sendWs]);

    const markAllRead = useCallback(() => {
        sendWs({ type: "read_all_notifications" });
        setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
    }, [sendWs]);

    const deleteOne = useCallback((id) => {
        setNotifications((prev) => {
            const exists = prev.some((n) => n.id === id);
            if (exists && isRealId(id)) {
                sendWs({ type: "delete_current_notification", notification_id: id });
            }
            return prev.filter((n) => n.id !== id);
        });
    }, [sendWs]);

    const deleteAll = useCallback(() => {
        sendWs({ type: "delete_all_notifications" });
        setNotifications([]);
    }, [sendWs]);

    return (
        <NotificationsContext.Provider
            value={{ notifications, wsStatus, markRead, markAllRead, deleteOne, deleteAll }}
        >
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationsContext);
}