import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { register, verifyCode, resendCode, createProfile, refreshTokens } from "../api/Auth";
import { AuthContext } from "../context/AuthContext";
import { API_URL } from "../api/const";


function Register() {
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(location.state?.step || 1);

    // если уже верифицирован — на главную
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                if (payload.is_verified) navigate("/");
            } catch {}
        }
    }, []);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [code, setCode] = useState("");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthday, setBirthday] = useState("");
    const [bio, setBio] = useState("");


    const handleRegister = async () => {
        setError("");
        if (!username || !email || !password) { setError("Заполните все поля"); return; }
        setLoading(true);
        try {
            const data = await register(username, email, password);
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            localStorage.setItem("username", data.user);
            loginUser({ username: data.user, access_token: data.access_token, refresh_token: data.refresh_token });
            setStep(2);
            setResendTimer(60);
            const interval = setInterval(() => {
                setResendTimer(prev => {
                    if (prev <= 1) { clearInterval(interval); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setError("");
        if (!code) { setError("Введите код"); return; }
        setLoading(true);
        try {
            await verifyCode(code);
            await refreshTokens(); // токен теперь с is_verified: true
            setStep(3);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        try {
            await resendCode();
            setResendTimer(60);
            const interval = setInterval(() => {
                setResendTimer(prev => {
                    if (prev <= 1) { clearInterval(interval); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } catch (e) {
            setError(e.message);
        }
    };

    const handleCreateProfile = async () => {
        setError("");
        if (!firstName || !lastName || !birthday) { setError("Заполните обязательные поля"); return; }
        setLoading(true);
        try {
            await createProfile(firstName, lastName, birthday, bio);
            await refreshTokens();
            const username = localStorage.getItem("username");
            const accessToken = localStorage.getItem("access_token");
            const refreshToken = localStorage.getItem("refresh_token");
            loginUser({ username, access_token: accessToken, refresh_token: refreshToken });
            navigate("/");
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

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
        width: "100%",
        padding: "0.5rem",
        marginTop: "1rem",
        background: "var(--logo-color)",
        color: "var(--bg-main)",
        border: "none",
        borderRadius: "6px",
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 600,
        fontSize: "1rem",
        cursor: "pointer",
        transition: "background 0.2s",
    };

    const labelStyle = {
        fontWeight: 600,
        marginTop: "0.75rem",
        marginBottom: "0.25rem",
        display: "block",
        fontFamily: "'Poppins', sans-serif",
    };

    return (
        <main style={{paddingTop: "3em"}}>
            <div style={{ maxWidth: "400px", margin: "3rem auto", padding: "2rem", background: "var(--bg-main)", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>

                <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{
                            width: "32px", height: "32px", borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "0.9rem",
                            background: step >= s ? "var(--logo-color)" : "#2a2a2a",
                            color: step >= s ? "var(--bg-main)" : "#666",
                            border: `2px solid ${step >= s ? "var(--logo-color)" : "#444"}`,
                            transition: "all 0.3s",
                        }}>{s}</div>
                    ))}
                </div>

                {error && <div style={{ color: "#ff5555", fontWeight: 600, marginBottom: "1rem", textAlign: "center", fontFamily: "'Poppins', sans-serif" }}>{error}</div>}

                {step === 1 && (
                    <>
                        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Регистрация</h2>
                        <label style={labelStyle}>Логин</label>
                        <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)}
                               placeholder="от 3 до 16 символов"
                               onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                               onBlur={e => e.target.style.borderColor = "#444"} />
                        <label style={labelStyle}>Email</label>
                        <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)}
                               placeholder="example@mail.com"
                               onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                               onBlur={e => e.target.style.borderColor = "#444"} />
                        <label style={labelStyle}>Пароль</label>
                        <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)}
                               placeholder="от 6 до 32 символов"
                               onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                               onBlur={e => e.target.style.borderColor = "#444"} />
                        <button style={btnStyle} disabled={loading} onClick={handleRegister}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#03b0d0"; }}
                                onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}>
                            {loading ? "..." : "Зарегистрироваться"}
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Подтверждение</h2>
                        <p style={{ textAlign: "center", color: "#a0a0a0", fontSize: "0.9rem", marginBottom: "1rem" }}>
                            Введите код, отправленный на {email}
                        </p>
                        <label style={labelStyle}>Код подтверждения</label>
                        <input style={inputStyle} value={code} onChange={e => setCode(e.target.value)}
                               placeholder="Введите код"
                               onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                               onBlur={e => e.target.style.borderColor = "#444"} />
                        <button style={btnStyle} disabled={loading} onClick={handleVerify}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#03b0d0"; }}
                                onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}>
                            {loading ? "..." : "Подтвердить"}
                        </button>
                        <button
                            onClick={handleResend}
                            disabled={resendTimer > 0}
                            style={{
                                ...btnStyle,
                                background: "transparent",
                                color: resendTimer > 0 ? "#666" : "var(--logo-color)",
                                border: `1px solid ${resendTimer > 0 ? "#444" : "var(--logo-color)"}`,
                                marginTop: "0.5rem",
                                cursor: resendTimer > 0 ? "default" : "pointer",
                            }}
                            onMouseEnter={e => { if (!resendTimer) { e.currentTarget.style.background = "var(--logo-color)"; e.currentTarget.style.color = "var(--bg-main)"; }}}
                            onMouseLeave={e => { if (!resendTimer) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--logo-color)"; }}}
                        >
                            {resendTimer > 0 ? `Повторно через ${resendTimer}с` : "Отправить повторно"}
                        </button>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Профиль</h2>
                        <p style={{ textAlign: "center", color: "#a0a0a0", fontSize: "0.9rem", marginBottom: "1rem" }}>
                            Аккаунт подтверждён! Заполните профиль.
                        </p>
                        <label style={labelStyle}>Имя *</label>
                        <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)}
                               onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                               onBlur={e => e.target.style.borderColor = "#444"} />
                        <label style={labelStyle}>Фамилия *</label>
                        <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)}
                               onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                               onBlur={e => e.target.style.borderColor = "#444"} />
                        <label style={labelStyle}>Дата рождения *</label>
                        <input style={inputStyle} type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
                               onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                               onBlur={e => e.target.style.borderColor = "#444"} />
                        <label style={labelStyle}>О себе</label>
                        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={bio} onChange={e => setBio(e.target.value)}
                                  placeholder="Пару слов о себе..."
                                  onFocus={e => e.target.style.borderColor = "var(--logo-color)"}
                                  onBlur={e => e.target.style.borderColor = "#444"} />
                        <button style={btnStyle} disabled={loading} onClick={handleCreateProfile}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#03b0d0"; }}
                                onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}>
                            {loading ? "..." : "Сохранить и войти"}
                        </button>
                        <button onClick={() => {
                            const username = localStorage.getItem("username");
                            const accessToken = localStorage.getItem("access_token");
                            const refreshToken = localStorage.getItem("refresh_token");
                            loginUser({ username, access_token: accessToken, refresh_token: refreshToken });
                            navigate("/");
                        }} style={{ ...btnStyle, background: "transparent", color: "#666", border: "1px solid #444", marginTop: "0.5rem" }}>
                            Пропустить
                        </button>
                    </>
                )}
            </div>
        </main>
    );
}

export default Register;