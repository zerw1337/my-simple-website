import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("access_token");
        if (token && username) {
            setUser({ username });
        }
        setLoading(false);
    }, []);

    const loginUser = (data) => {
        localStorage.setItem("username", data.username);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("token_type", "Bearer");
        setUser({ username: data.username });
    };

    const logoutUser = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}