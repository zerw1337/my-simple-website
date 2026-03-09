import React, {useState, useContext, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, changeEmail, confirmEmailChange, resendEmailChangeCode } from "../api/Auth";
import { AuthContext } from "../context/AuthContext";
import {getMe} from "../api/Auth";

function Settings() {
    const navigate = useNavigate();
    const { logoutUser } = useContext(AuthContext);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [currentEmail, setCurrentEmail] = useState("");
    useEffect(() => {
        getMe().then(data => {
            if (data) setCurrentEmail(data.email);
        });
    }, []);

    const [newEmail, setNewEmail] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [emailSuccess, setEmailSuccess] = useState("");
    const [emailStep, setEmailStep] = useState(1);
    const [code, setCode] = useState("");
    const [resendTimer, setResendTimer] = useState(0);

    const inputStyle = {
        width: "100%",
        padding: "0.5rem 0.75rem",
        background: "#2a2a2a",
        border: "1px solid #444",
        borderRadius: "6px",
        color: "var(--main-text-color)",
        fontSize: "1rem",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "'Poppins', sans-serif",
        transition: "border-color 0.2s",
    };

    const btnStyle = {
        padding: "0.5rem 1.5rem",
        background: "var(--logo-color)",
        color: "var(--bg-main)",
        border: "none",
        borderRadius: "6px",
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 600,
        fontSize: "1rem",
        cursor: "pointer",
        transition: "background 0.2s",
        marginTop: "0.75rem",
    };

    const labelStyle = {
        fontWeight: 600,
        marginTop: "0.75rem",
        marginBottom: "0.25rem",
        display: "block",
        fontFamily: "'Poppins', sans-serif",
        fontSize: "0.9rem",
        color: "#a0a0a0",
    };

    const sectionStyle = {
        background: "#1f1f1f",
        borderRadius: "12px",
        padding: "1.75rem 2rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        marginBottom: "1.5rem",
    };

    const startResendTimer = () => {
        setResendTimer(60);
        const interval = setInterval(() => {
            setResendTimer(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handlePasswordChange = async () => {
        setPasswordError("");
        setPasswordSuccess("");
        if (!newPassword) { setPasswordError("Введите новый пароль"); return; }
        if (newPassword.length < 6) { setPasswordError("Минимум 6 символов"); return; }
        if (newPassword !== confirmPassword) { setPasswordError("Пароли не совпадают"); return; }
        setPasswordLoading(true);
        try {
            await changePassword(newPassword);
            setPasswordSuccess("Пароль изменён. Войдите заново.");
            setTimeout(() => {
                logoutUser();
                navigate("/login");
            }, 2000);
        } catch (e) {
            setPasswordError(e.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleEmailChange = async () => {
        setEmailError("");
        setEmailSuccess("");
        if (!newEmail) { setEmailError("Введите новый email"); return; }
        setEmailLoading(true);
        try {
            await changeEmail(newEmail);
            setEmailStep(2);
            startResendTimer();
        } catch (e) {
            setEmailError(e.message);
        } finally {
            setEmailLoading(false);
        }
    };

    const handleEmailConfirm = async () => {
        setEmailError("");
        if (!code) { setEmailError("Введите код"); return; }
        setEmailLoading(true);
        try {
            await confirmEmailChange(code);
            setEmailSuccess("Email успешно изменён!");
            setEmailStep(1);
            setNewEmail("");
            setCode("");
        } catch (e) {
            setEmailError(e.message);
        } finally {
            setEmailLoading(false);
        }
    };

    const handleResend = async () => {
        setEmailError("");
        try {
            await resendEmailChangeCode();
            startResendTimer();
        } catch (e) {
            setEmailError(e.message);
        }
    };

    const myId = (() => {
        const token = localStorage.getItem("access_token");
        if (!token) return null;
        try { return JSON.parse(atob(token.split(".")[1])).sub; } catch { return null; }
    })();

    return (
        <main>
            <div style={{ maxWidth: "600px", margin: "2rem auto" }}>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                    {myId && (
                        <a
                            href={"/profile/" + myId}
                            style={{ color: "#a0a0a0", textDecoration: "none", fontSize: "0.9rem" }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--logo-color)"}
                            onMouseLeave={e => e.currentTarget.style.color = "#a0a0a0"}
                        >
                            ← Профиль
                        </a>
                    )}
                    <h2 style={{ margin: 0 }}>Настройки</h2>
                </div>

                {/* Смена пароля */}
                <div style={sectionStyle}>
                    <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem" }}>Смена пароля</h3>

                    {passwordError && (
                        <div style={{ color: "#ff5555", fontSize: "0.9rem", marginBottom: "0.75rem", fontFamily: "'Poppins', sans-serif" }}>
                            {passwordError}
                        </div>
                    )}
                    {passwordSuccess && (
                        <div style={{ color: "#55cc55", fontSize: "0.9rem", marginBottom: "0.75rem", fontFamily: "'Poppins', sans-serif" }}>
                            {passwordSuccess}
                        </div>
                    )}

                    <label style={labelStyle}>Новый пароль</label>
                    <input
                        type="password"
                        style={inputStyle}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="от 6 до 32 символов"
                        onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                        onBlur={e => e.target.style.borderColor = "#444"}
                    />

                    <label style={labelStyle}>Повторите пароль</label>
                    <input
                        type="password"
                        style={inputStyle}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="повторите пароль"
                        onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                        onBlur={e => e.target.style.borderColor = "#444"}
                    />

                    <button
                        style={btnStyle}
                        disabled={passwordLoading}
                        onClick={handlePasswordChange}
                        onMouseEnter={e => { if (!passwordLoading) e.currentTarget.style.background = "#03b0d0"; }}
                        onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}
                    >
                        {passwordLoading ? "..." : "Изменить пароль"}
                    </button>
                </div>

                {/* Смена email */}
                <div style={sectionStyle}>
                    <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem" }}>Смена email</h3>

                    {emailError && (
                        <div style={{ color: "#ff5555", fontSize: "0.9rem", marginBottom: "0.75rem", fontFamily: "'Poppins', sans-serif" }}>
                            {emailError}
                        </div>
                    )}
                    {emailSuccess && (
                        <div style={{ color: "#55cc55", fontSize: "0.9rem", marginBottom: "0.75rem", fontFamily: "'Poppins', sans-serif" }}>
                            {emailSuccess}
                        </div>
                    )}

                    {emailStep === 1 ? (
                        <>
                            {currentEmail && (
                                <p style={{ color: "#a0a0a0", fontSize: "0.9rem", margin: "0 0 0.75rem" }}>
                                    Текущий email: <b style={{ color: "var(--main-text-color)" }}>{currentEmail}</b>
                                </p>
                            )}
                            <label style={labelStyle}>Новый email</label>
                            <input
                                type="email"
                                style={inputStyle}
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                placeholder="example@mail.com"
                                onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                                onBlur={e => e.target.style.borderColor = "#444"}
                            />
                            <button
                                style={btnStyle}
                                disabled={emailLoading}
                                onClick={handleEmailChange}
                                onMouseEnter={e => { if (!emailLoading) e.currentTarget.style.background = "#03b0d0"; }}
                                onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}
                            >
                                {emailLoading ? "..." : "Изменить email"}
                            </button>
                        </>
                    ) : (
                        <>
                            <p style={{ color: "#a0a0a0", fontSize: "0.9rem", margin: "0 0 1rem" }}>
                                Код подтверждения отправлен на текущий email.
                            </p>

                            <label style={labelStyle}>Код подтверждения</label>
                            <input
                                style={inputStyle}
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="Введите код"
                                onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                                onBlur={e => e.target.style.borderColor = "#444"}
                            />

                            <button
                                style={btnStyle}
                                disabled={emailLoading}
                                onClick={handleEmailConfirm}
                                onMouseEnter={e => { if (!emailLoading) e.currentTarget.style.background = "#03b0d0"; }}
                                onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}
                            >
                                {emailLoading ? "..." : "Подтвердить"}
                            </button>

                            <button
                                onClick={handleResend}
                                disabled={resendTimer > 0}
                                style={{
                                    ...btnStyle,
                                    background: "transparent",
                                    color: resendTimer > 0 ? "#666" : "var(--logo-color)",
                                    border: `1px solid ${resendTimer > 0 ? "#444" : "var(--logo-color)"}`,
                                    marginLeft: "0.75rem",
                                    cursor: resendTimer > 0 ? "default" : "pointer",
                                }}
                                onMouseEnter={e => { if (!resendTimer) { e.currentTarget.style.background = "var(--logo-color)"; e.currentTarget.style.color = "var(--bg-main)"; }}}
                                onMouseLeave={e => { if (!resendTimer) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--logo-color)"; }}}
                            >
                                {resendTimer > 0 ? `Повторно через ${resendTimer}с` : "Отправить повторно"}
                            </button>

                            <button
                                onClick={() => { setEmailStep(1); setCode(""); setEmailError(""); }}
                                style={{
                                    ...btnStyle,
                                    background: "transparent",
                                    color: "#666",
                                    border: "1px solid #444",
                                    marginLeft: "0.75rem",
                                }}
                            >
                                Отмена
                            </button>
                        </>
                    )}
                </div>

            </div>
        </main>
    );
}

export default Settings;
