import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPasswordViaUrl } from "../api/Auth";

function ResetPassword() {
    const { url } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (password.length < 6) { setError("Минимум 6 символов"); return; }
        if (password !== confirm) { setError("Пароли не совпадают"); return; }
        setLoading(true);
        try {
            await resetPasswordViaUrl(url, password);
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err?.message || "Ссылка недействительна или устарела");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            <div style={{
                maxWidth: "400px",
                margin: "9rem auto 10rem",
                padding: "2rem",
                background: "var(--bg-main)",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                fontFamily: "'Poppins', sans-serif",
            }}>
                <h2 style={{ marginBottom: "1.5rem", textAlign: "center" }}>Новый пароль</h2>

                {success ? (
                    <div style={{
                        background: "rgba(4,198,233,0.1)",
                        border: "1px solid rgba(4,198,233,0.4)",
                        borderRadius: "8px",
                        padding: "0.75rem 1rem",
                        color: "var(--logo-color)",
                        fontSize: "0.9rem",
                        textAlign: "center",
                        lineHeight: 1.6,
                    }}>
                        ✅ Пароль успешно изменён.<br />
                        Перенаправляем на страницу входа...
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {error && (
                            <div style={{
                                display: "flex", alignItems: "flex-start", gap: "0.5rem",
                                background: "rgba(255,85,85,0.1)",
                                border: "1px solid rgba(255,85,85,0.4)",
                                borderRadius: "8px",
                                padding: "0.65rem 0.9rem",
                                color: "#ff7070",
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Новый пароль</label>
                        <input
                            type="password"
                            placeholder="Минимум 6 символов"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{
                                padding: "0.5rem 0.75rem",
                                background: "#2a2a2a",
                                border: "1px solid #444",
                                borderRadius: "6px",
                                color: "var(--main-text-color)",
                                fontSize: "1rem",
                                outline: "none",
                                boxSizing: "border-box",
                                width: "100%",
                            }}
                        />

                        <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Повторите пароль</label>
                        <input
                            type="password"
                            placeholder="Повторите пароль"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            style={{
                                padding: "0.5rem 0.75rem",
                                background: "#2a2a2a",
                                border: "1px solid #444",
                                borderRadius: "6px",
                                color: "var(--main-text-color)",
                                fontSize: "1rem",
                                outline: "none",
                                boxSizing: "border-box",
                                width: "100%",
                            }}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: "0.5rem",
                                padding: "0.5rem 1rem",
                                background: "var(--logo-color)",
                                color: "var(--bg-main)",
                                fontWeight: 600,
                                border: "none",
                                borderRadius: "6px",
                                cursor: loading ? "default" : "pointer",
                                opacity: loading ? 0.7 : 1,
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: "1rem",
                                transition: "background 0.2s",
                            }}
                        >
                            {loading ? "Сохранение..." : "Сохранить пароль"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}

export default ResetPassword;