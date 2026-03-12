import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

function getBannedFromToken() {
    const token = localStorage.getItem("access_token");
    if (!token) return false;
    try { return JSON.parse(atob(token.split(".")[1])).is_banned === true; } catch { return false; }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isBanned, setIsBanned] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("access_token");
        if (token && username) {
            setUser({ username });
            setIsBanned(getBannedFromToken());
        }
        setLoading(false);
    }, []);

    const loginUser = (data) => {
        localStorage.setItem("username", data.username);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("token_type", "Bearer");
        setUser({ username: data.username });
        const banned = getBannedFromToken();
        setIsBanned(banned);
        return banned;
    };

    const logoutUser = () => {
        localStorage.clear();
        setUser(null);
        setIsBanned(false);
    };

    return (
        <AuthContext.Provider value={{ user, isBanned, loginUser, logoutUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
