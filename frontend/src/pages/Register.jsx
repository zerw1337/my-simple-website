import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { register, verifyCode, resendCode, createProfile, refreshTokens } from "../api/Auth";
import { AuthContext } from "../context/AuthContext";

const inp = {
    width: "100%", padding: "0.65rem 0.9rem",
    background: "rgba(10,20,35,0.6)", border: "1px solid rgba(100,160,220,0.2)",
    borderRadius: "8px", color: "rgb(200,220,240)", fontSize: "0.95rem",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
};
const lbl = { fontWeight: 600, marginTop: "0.9rem", marginBottom: "0.3rem", display: "block", color: "rgb(140,175,210)", fontSize: "0.82rem", letterSpacing: "0.04em" };
const btn = (disabled) => ({
    width: "100%", padding: "0.65rem 1rem", marginTop: "1.25rem",
    background: disabled ? "rgba(4,198,233,0.4)" : "var(--logo-color)",
    color: "#0a0f18", border: "none", borderRadius: "8px",
    fontFamily: "inherit", fontWeight: 700, fontSize: "0.95rem",
    cursor: disabled ? "default" : "pointer", transition: "background 0.2s, transform 0.15s",
    letterSpacing: "0.02em",
});

function Register() {
    const { loginUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(location.state?.step || 1);
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

    useEffect(() => {
        if (location.state?.step) return;
        const token = localStorage.getItem("access_token");
        if (token) {
            try { if (JSON.parse(atob(token.split(".")[1])).is_verified) navigate("/"); } catch {}
        }
    }, []);

    const startTimer = () => {
        setResendTimer(60);
        const interval = setInterval(() => {
            setResendTimer(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
        }, 1000);
    };

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
            setStep(2); startTimer();
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleVerify = async () => {
        setError("");
        if (!code) { setError("Введите код"); return; }
        setLoading(true);
        try { await verifyCode(code); await refreshTokens(); setStep(3); }
        catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handleResend = async () => {
        setError("");
        try { await resendCode(); startTimer(); }
        catch (e) { setError(e.message); }
    };

    const handleCreateProfile = async () => {
        setError("");
        if (!firstName || !lastName || !birthday) { setError("Заполните обязательные поля"); return; }
        setLoading(true);
        try {
            await createProfile(firstName, lastName, birthday, bio);
            await refreshTokens();
            loginUser({ username: localStorage.getItem("username"), access_token: localStorage.getItem("access_token"), refresh_token: localStorage.getItem("refresh_token") });
            navigate("/");
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    const focusStyle = e => { e.target.style.borderColor = "rgba(4,198,233,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(4,198,233,0.1)"; };
    const blurStyle = e => { e.target.style.borderColor = "rgba(100,160,220,0.2)"; e.target.style.boxShadow = "none"; };

    const stepLabels = ["Аккаунт", "Подтверждение", "Профиль"];

    return (
        <main style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
            <div style={{
                maxWidth: "420px", margin: "0 auto",
                background: "#161b24", border: "1px solid rgba(100,160,220,0.12)",
                borderRadius: "16px", padding: "2.5rem",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}>
                {/* Шаги */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
                    {[1, 2, 3].map((s, i) => (
                        <React.Fragment key={s}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                                <div style={{
                                    width: "32px", height: "32px", borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 700, fontSize: "0.85rem", fontFamily: "inherit",
                                    background: step > s ? "rgba(4,198,233,0.15)" : step === s ? "var(--logo-color)" : "rgba(100,160,220,0.06)",
                                    color: step > s ? "var(--logo-color)" : step === s ? "#0a0f18" : "rgb(60,90,120)",
                                    border: step >= s ? "1px solid rgba(4,198,233,0.4)" : "1px solid rgba(100,160,220,0.12)",
                                    transition: "all 0.3s",
                                }}>
                                    {step > s ? "✓" : s}
                                </div>
                                <span style={{ fontSize: "0.65rem", color: step >= s ? "rgb(100,140,180)" : "rgb(50,70,100)", letterSpacing: "0.04em" }}>
                                    {stepLabels[i]}
                                </span>
                            </div>
                            {i < 2 && <div style={{ flex: 1, height: "1px", background: step > s ? "rgba(4,198,233,0.3)" : "rgba(100,160,220,0.1)", margin: "0 0.5rem 1.2rem" }} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Ошибка */}
                {error && (
                    <div style={{
                        display: "flex", alignItems: "flex-start", gap: "0.5rem",
                        background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)",
                        borderRadius: "8px", padding: "0.65rem 0.9rem", marginBottom: "1rem",
                        color: "#ff7070", fontSize: "0.85rem", lineHeight: 1.5,
                    }}>
                        <span style={{ flexShrink: 0 }}>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Шаг 1 */}
                {step === 1 && (
                    <>
                        <h2 style={{ margin: "0 0 0.25rem", textAlign: "center", color: "rgb(180,255,255)", fontSize: "1.6rem", textShadow: "0 0 10px rgba(180,255,255,0.2)" }}>
                            Регистрация
                        </h2>
                        <p style={{ margin: "0 0 1.5rem", textAlign: "center", color: "rgb(80,110,140)", fontSize: "0.875rem" }}>
                            Создайте аккаунт
                        </p>
                        <label style={lbl}>Логин</label>
                        <input style={inp} value={username} onChange={e => setUsername(e.target.value)} placeholder="от 3 до 16 символов" onFocus={focusStyle} onBlur={blurStyle} />
                        <label style={lbl}>Email</label>
                        <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" onFocus={focusStyle} onBlur={blurStyle} />
                        <label style={lbl}>Пароль</label>
                        <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="от 6 до 32 символов" onFocus={focusStyle} onBlur={blurStyle} />
                        <button style={btn(loading)} disabled={loading} onClick={handleRegister}
                                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgb(3,220,255)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                                onMouseLeave={e => { e.currentTarget.style.background = "var(--logo-color)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                            {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
                        </button>
                        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.82rem", color: "rgb(60,90,120)" }}>
                            Уже есть аккаунт?{" "}
                            <a href="/login" style={{ color: "var(--logo-color)", textDecoration: "none", fontWeight: 600 }}
                               onMouseEnter={e => e.currentTarget.style.color = "rgb(180,255,255)"}
                               onMouseLeave={e => e.currentTarget.style.color = "var(--logo-color)"}>
                                Войти
                            </a>
                        </p>
                    </>
                )}

                {/* Шаг 2 */}
                {step === 2 && (
                    <>
                        <h2 style={{ margin: "0 0 0.25rem", textAlign: "center", color: "rgb(180,255,255)", fontSize: "1.6rem" }}>
                            Подтверждение
                        </h2>
                        <p style={{ margin: "0 0 1.5rem", textAlign: "center", color: "rgb(80,110,140)", fontSize: "0.875rem" }}>
                            Код отправлен на <span style={{ color: "rgb(140,175,210)", fontWeight: 600 }}>{email}</span>
                        </p>
                        <label style={lbl}>Код подтверждения</label>
                        <input style={{ ...inp, textAlign: "center", fontSize: "1.4rem", letterSpacing: "0.3em" }}
                               value={code} onChange={e => setCode(e.target.value)} placeholder="• • • • • •" onFocus={focusStyle} onBlur={blurStyle} />
                        <button style={btn(loading)} disabled={loading} onClick={handleVerify}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgb(3,220,255)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "var(--logo-color)"; }}>
                            {loading ? "Проверка..." : "Подтвердить"}
                        </button>
                        <button onClick={handleResend} disabled={resendTimer > 0} style={{
                            width: "100%", marginTop: "0.75rem", padding: "0.55rem",
                            background: "transparent", border: "1px solid rgba(100,160,220,0.15)",
                            borderRadius: "8px", fontFamily: "inherit", fontWeight: 600, fontSize: "0.85rem",
                            color: resendTimer > 0 ? "rgb(60,90,120)" : "var(--logo-color)",
                            cursor: resendTimer > 0 ? "default" : "pointer", transition: "all 0.2s",
                        }}
                                onMouseEnter={e => { if (!resendTimer) e.currentTarget.style.borderColor = "rgba(4,198,233,0.3)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,160,220,0.15)"; }}>
                            {resendTimer > 0 ? `Повторно через ${resendTimer}с` : "Отправить повторно"}
                        </button>
                    </>
                )}

                {/* Шаг 3 */}
                {step === 3 && (
                    <>
                        <h2 style={{ margin: "0 0 0.25rem", textAlign: "center", color: "rgb(180,255,255)", fontSize: "1.6rem" }}>
                            Профиль
                        </h2>
                        <p style={{ margin: "0 0 1.5rem", textAlign: "center", color: "rgb(80,110,140)", fontSize: "0.875rem" }}>
                            Аккаунт подтверждён ✓ Заполните профиль
                        </p>
                        <label style={lbl}>Имя *</label>
                        <input style={inp} value={firstName} onChange={e => setFirstName(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                        <label style={lbl}>Фамилия *</label>
                        <input style={inp} value={lastName} onChange={e => setLastName(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                        <label style={lbl}>Дата рождения *</label>
                        <input style={{ ...inp, colorScheme: "dark" }} type="date" value={birthday} onChange={e => setBirthday(e.target.value)} onFocus={focusStyle} onBlur={blurStyle} />
                        <label style={lbl}>О себе</label>
                        <textarea style={{ ...inp, resize: "vertical" }} rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Пару слов о себе..." onFocus={focusStyle} onBlur={blurStyle} />
                        <button style={btn(loading)} disabled={loading} onClick={handleCreateProfile}
                                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgb(3,220,255)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "var(--logo-color)"; }}>
                            {loading ? "Сохранение..." : "Сохранить и войти"}
                        </button>
                        <button onClick={() => {
                            loginUser({ username: localStorage.getItem("username"), access_token: localStorage.getItem("access_token"), refresh_token: localStorage.getItem("refresh_token") });
                            navigate("/");
                        }} style={{ width: "100%", marginTop: "0.6rem", padding: "0.55rem", background: "transparent", border: "1px solid rgba(100,160,220,0.12)", borderRadius: "8px", fontFamily: "inherit", fontWeight: 500, fontSize: "0.85rem", color: "rgb(60,90,120)", cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.color = "rgb(100,130,160)"; e.currentTarget.style.borderColor = "rgba(100,160,220,0.25)"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = "rgb(60,90,120)"; e.currentTarget.style.borderColor = "rgba(100,160,220,0.12)"; }}>
                            Пропустить
                        </button>
                    </>
                )}
            </div>
        </main>
    );
}

export default Register;