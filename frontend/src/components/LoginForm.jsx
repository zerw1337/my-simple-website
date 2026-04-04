import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login, requestPasswordReset } from "../api/Auth.js";
import { AuthContext } from "../context/AuthContext.jsx";
import "./styles/LoginForm.css";

function LoginForm() {
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const [forgotMode, setForgotMode] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotStatus, setForgotStatus] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!username || !password) {
            setError("Пожалуйста, заполните все поля");
            return;
        }

        try {
            const data = await login(username, password);
            const banned = loginUser({
                username,
                access_token: data.access_token,
                refresh_token: data.refresh_token,
            });
            navigate(banned ? "/banned" : "/");
        } catch (err) {
            setError(err?.message || "Ошибка входа");
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        if (!forgotEmail) return;
        setForgotLoading(true);
        setForgotStatus("");
        try {
            await requestPasswordReset(forgotEmail);
            setForgotStatus("Если аккаунт с таким email существует — письмо отправлено.");
        } catch {
            setForgotStatus("Если аккаунт с таким email существует — письмо отправлено.");
        } finally {
            setForgotLoading(false);
        }
    };

    if (forgotMode) {
        return (
            <main>
                <div className="login-form-wrapper" style={{ marginTop: "9em", marginBottom: "10em" }}>
                    <form className="login-form" onSubmit={handleForgot}>
                        <h2>Сброс пароля</h2>

                        {forgotStatus ? (
                            <div style={{
                                background: "rgba(4,198,233,0.1)",
                                border: "1px solid rgba(4,198,233,0.4)",
                                borderRadius: "8px",
                                padding: "0.65rem 0.9rem",
                                color: "var(--logo-color)",
                                fontSize: "0.875rem",
                                fontFamily: "'Poppins', sans-serif",
                                marginBottom: "1rem",
                                lineHeight: 1.5,
                            }}>
                                ✉️ {forgotStatus}
                            </div>
                        ) : (
                            <>
                                <label htmlFor="forgot-email">Email от аккаунта</label>
                                <input
                                    type="email"
                                    id="forgot-email"
                                    placeholder="Введите email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                />
                                <button type="submit" disabled={forgotLoading}>
                                    {forgotLoading ? "Отправка..." : "Отправить ссылку"}
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            className="login-back-link"
                            onClick={() => { setForgotMode(false); setForgotStatus(""); setForgotEmail(""); }}
                        >
                            ← Вернуться ко входу
                        </button>
                    </form>
                </div>
            </main>
        );
    }

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

                    <button
                        type="button"
                        className="login-forgot-link"
                        onClick={() => setForgotMode(true)}
                    >
                        Забыли пароль?
                    </button>
                </form>
            </div>
        </main>
    );
}

export default LoginForm;