import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/Auth.js";
import { AuthContext } from "../context/AuthContext.jsx";
import "./styles/LoginForm.css";
import mainPostsList from "./MainPostsList.jsx";

function LoginForm() {
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!username || !password) {
            setError("Пожалуйста, заполните все поля");
            return;
        }

        try {
            const data = await login(username, password);
            loginUser({
                username,
                access_token: data.access_token,
                refresh_token: data.refresh_token,
            });
            navigate("/"); // переход на главную после логина
        } catch (err) {
            setError(err?.message || "Ошибка входа");
        }
    };

    return (
        <main>
        <div className="login-form-wrapper" style={{ marginTop: "9em", marginBottom: "10em" }}>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Вход</h2>

                {error && <div className="login-error">{error}</div>}

                <label htmlFor="username">Логин или email</label>
                <input
                    type="text"
                    id="username"
                    placeholder="Введите логин или email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <label htmlFor="password">Пароль</label>
                <input
                    type="password"
                    id="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">Войти</button>
            </form>
        </div>
        </main>
    );
}

export default LoginForm;