import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { register, verifyCode, resendCode, createProfile, refreshTokens } from "../api/Auth";
import { uploadAvatar } from "../api/Posts";
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

const AGREEMENT_TEXT = `Пользовательское соглашение

Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между Администрацией сайта и Пользователем.

1. Общие положения

1.1. Регистрируясь на сайте, Пользователь подтверждает, что ознакомился с настоящим Соглашением и принимает его условия в полном объеме.

1.2. Администрация предоставляет Пользователю доступ к функционалу сайта, включая создание учетной записи, обмен сообщениями и иные возможности, доступные на сайте.

1.3. Администрация вправе изменять настоящее Соглашение без предварительного уведомления Пользователя. Новая редакция вступает в силу с момента ее публикации на сайте.

2. Регистрация и учетная запись

2.1. Для использования отдельных функций сайта Пользователь может создать учетную запись.

2.2. Пользователь самостоятельно обеспечивает сохранность данных для входа в учетную запись и несет ответственность за действия, совершенные с использованием своей учетной записи.

2.3. Администрация вправе ограничить или прекратить доступ Пользователя к сайту в случае нарушения настоящего Соглашения.

3. Использование сервиса

3.1. Пользователь обязуется использовать сайт исключительно законным способом.

3.2. Пользователю запрещается:
• публиковать или распространять информацию, нарушающую законодательство Российской Федерации;
• использовать сервис для рассылки спама;
• выдавать себя за другое лицо;
• распространять вредоносное программное обеспечение;
• предпринимать попытки нарушения работы сайта;
• использовать сервис для мошеннической деятельности.

3.3. Администрация вправе ограничить доступ Пользователя к сайту при нарушении настоящего Соглашения.

4. Личные сообщения

4.1. Пользователь может обмениваться сообщениями с другими пользователями посредством встроенного функционала сайта.

4.2. Пользователь самостоятельно несет ответственность за содержание отправляемых сообщений.

4.3. Запрещается использовать систему сообщений для распространения спама, мошеннических предложений, вредоносных ссылок и иной незаконной информации.

5. Персональные данные

5.1. Регистрируясь на сайте, Пользователь выражает согласие на обработку предоставленных персональных данных в целях функционирования сервиса.

5.2. Обработка персональных данных осуществляется в соответствии с Политикой конфиденциальности сайта.

5.3. Администрация вправе хранить информацию о действиях Пользователя на сайте, включая дату регистрации, авторизации, отправки сообщений и иные технические данные, необходимые для обеспечения работы сервиса и безопасности пользователей.

6. Ограничение ответственности

6.1. Сайт предоставляется по принципу «как есть».

6.2. Администрация не гарантирует бесперебойную работу сервиса и не несет ответственности за временные сбои, потерю данных вследствие технических неисправностей, действий третьих лиц или обстоятельств непреодолимой силы.

6.3. Администрация не несет ответственности за содержание материалов и сообщений, размещаемых Пользователями.

7. Заключительные положения

7.1. К отношениям сторон применяется законодательство Российской Федерации.

7.2. Все споры подлежат разрешению путем переговоров, а при невозможности достижения соглашения — в порядке, установленном законодательством Российской Федерации.

7.3. Продолжение использования сайта после регистрации означает полное принятие условий настоящего Соглашения.`;

function TermsModal({ onClose }) {
    const overlayRef = useRef(null);
    useEffect(() => {
        const onKey = e => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [onClose]);

    return (
        <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}
             style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: "#161b24", border: "1px solid rgba(4,198,233,0.2)", borderRadius: "16px", width: "min(560px, 100%)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
                {/* Заголовок */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(100,160,220,0.1)", flexShrink: 0 }}>
                    <h3 style={{ margin: 0, color: "rgb(180,255,255)", fontSize: "1.05rem", fontWeight: 700 }}>Пользовательское соглашение</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "rgb(80,110,140)", fontSize: "1.2rem", cursor: "pointer", padding: "0.2rem 0.4rem", borderRadius: "6px", lineHeight: 1, transition: "color 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "rgb(200,220,240)"}
                            onMouseLeave={e => e.currentTarget.style.color = "rgb(80,110,140)"}>✕</button>
                </div>
                {/* Текст */}
                <div style={{ overflowY: "auto", padding: "1.25rem 1.5rem", flex: 1 }}>
                    {AGREEMENT_TEXT.split("\n\n").map((block, i) => {
                        const isHeader = /^\d+\./.test(block) || block === "Пользовательское соглашение";
                        const isList = block.includes("\n•");
                        if (isList) {
                            const [intro, ...items] = block.split("\n•");
                            return (
                                <div key={i} style={{ marginBottom: "1rem" }}>
                                    <p style={{ margin: "0 0 0.4rem", color: "rgb(160,195,230)", fontSize: "0.875rem", lineHeight: 1.7 }}>{intro}</p>
                                    <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                                        {items.map((item, j) => (
                                            <li key={j} style={{ color: "rgb(140,175,210)", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: "0.15rem" }}>{item.trim()}</li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        }
                        return (
                            <p key={i} style={{ margin: "0 0 0.85rem", color: isHeader ? "rgb(200,230,255)" : "rgb(140,175,210)", fontSize: isHeader ? "0.925rem" : "0.875rem", fontWeight: isHeader ? 700 : 400, lineHeight: 1.7 }}>
                                {block}
                            </p>
                        );
                    })}
                </div>
                {/* Кнопка закрыть */}
                <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(100,160,220,0.1)", flexShrink: 0 }}>
                    <button onClick={onClose} style={{ width: "100%", padding: "0.6rem", background: "var(--logo-color)", color: "#0a0f18", border: "none", borderRadius: "8px", fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgb(3,220,255)"}
                            onMouseLeave={e => e.currentTarget.style.background = "var(--logo-color)"}>
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
}

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
    const [agreed, setAgreed] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    // Аватар
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);

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

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        const url = URL.createObjectURL(file);
        setAvatarPreview(url);
    };

    const handleRegister = async () => {
        setError("");
        if (!agreed) { setError("Необходимо принять пользовательское соглашение"); return; }
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
            if (avatarFile) {
                try { await uploadAvatar(avatarFile); } catch {}
            }
            loginUser({ username: localStorage.getItem("username"), access_token: localStorage.getItem("access_token"), refresh_token: localStorage.getItem("refresh_token") });
            navigate("/");
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    const focusStyle = e => { e.target.style.borderColor = "rgba(4,198,233,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(4,198,233,0.1)"; };
    const blurStyle  = e => { e.target.style.borderColor = "rgba(100,160,220,0.2)"; e.target.style.boxShadow = "none"; };

    const stepLabels = ["Аккаунт", "Подтверждение", "Профиль"];

    return (
        <main style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
            {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

            <div style={{ maxWidth: "420px", margin: "0 auto", background: "#161b24", border: "1px solid rgba(100,160,220,0.12)", borderRadius: "16px", padding: "2.5rem", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
                {/* Шаги */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
                    {[1, 2, 3].map((s, i) => (
                        <React.Fragment key={s}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", fontFamily: "inherit", background: step > s ? "rgba(4,198,233,0.15)" : step === s ? "var(--logo-color)" : "rgba(100,160,220,0.06)", color: step > s ? "var(--logo-color)" : step === s ? "#0a0f18" : "rgb(60,90,120)", border: step >= s ? "1px solid rgba(4,198,233,0.4)" : "1px solid rgba(100,160,220,0.12)", transition: "all 0.3s" }}>
                                    {step > s ? "✓" : s}
                                </div>
                                <span style={{ fontSize: "0.65rem", color: step >= s ? "rgb(100,140,180)" : "rgb(50,70,100)", letterSpacing: "0.04em" }}>{stepLabels[i]}</span>
                            </div>
                            {i < 2 && <div style={{ flex: 1, height: "1px", background: step > s ? "rgba(4,198,233,0.3)" : "rgba(100,160,220,0.1)", margin: "0 0.5rem 1.2rem" }} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Ошибка */}
                {error && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: "8px", padding: "0.65rem 0.9rem", marginBottom: "1rem", color: "#ff7070", fontSize: "0.85rem", lineHeight: 1.5 }}>
                        <span style={{ flexShrink: 0 }}>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Шаг 1 */}
                {step === 1 && (
                    <>
                        <h2 style={{ margin: "0 0 0.25rem", textAlign: "center", color: "rgb(180,255,255)", fontSize: "1.6rem", textShadow: "0 0 10px rgba(180,255,255,0.2)" }}>Регистрация</h2>
                        <p style={{ margin: "0 0 1.5rem", textAlign: "center", color: "rgb(80,110,140)", fontSize: "0.875rem" }}>Создайте аккаунт</p>
                        <label style={lbl}>Логин</label>
                        <input style={inp} value={username} onChange={e => setUsername(e.target.value)} placeholder="от 3 до 16 символов" onFocus={focusStyle} onBlur={blurStyle} />
                        <label style={lbl}>Email</label>
                        <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" onFocus={focusStyle} onBlur={blurStyle} />
                        <label style={lbl}>Пароль</label>
                        <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="от 6 до 32 символов" onFocus={focusStyle} onBlur={blurStyle} />

                        {/* Пользовательское соглашение */}
                        <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "flex-start", gap: "0.65rem", cursor: "pointer" }} onClick={() => setAgreed(v => !v)}>
                            <div style={{ width: 18, height: 18, borderRadius: "5px", flexShrink: 0, marginTop: "1px", border: agreed ? "2px solid var(--logo-color)" : "2px solid rgba(100,160,220,0.3)", background: agreed ? "rgba(4,198,233,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", boxShadow: agreed ? "0 0 8px rgba(4,198,233,0.25)" : "none" }}>
                                {agreed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3L9 1" stroke="var(--logo-color)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <span style={{ fontSize: "0.82rem", color: "rgb(100,130,165)", lineHeight: 1.5, userSelect: "none" }}>
                                Я принимаю условия{" "}
                                <span onClick={e => { e.stopPropagation(); setShowTerms(true); }}
                                      style={{ color: "var(--logo-color)", textDecoration: "underline", cursor: "pointer", fontWeight: 600, transition: "color 0.15s" }}
                                      onMouseEnter={e => e.currentTarget.style.color = "rgb(180,255,255)"}
                                      onMouseLeave={e => e.currentTarget.style.color = "var(--logo-color)"}>
                                    Пользовательского соглашения
                                </span>
                            </span>
                        </div>

                        <button style={btn(loading || !agreed)} disabled={loading || !agreed} onClick={handleRegister}
                                onMouseEnter={e => { if (!loading && agreed) { e.currentTarget.style.background = "rgb(3,220,255)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                                onMouseLeave={e => { e.currentTarget.style.background = agreed ? "var(--logo-color)" : "rgba(4,198,233,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                            {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
                        </button>
                        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.82rem", color: "rgb(60,90,120)" }}>
                            Уже есть аккаунт?{" "}
                            <a href="/login" style={{ color: "var(--logo-color)", textDecoration: "none", fontWeight: 600 }}
                               onMouseEnter={e => e.currentTarget.style.color = "rgb(180,255,255)"}
                               onMouseLeave={e => e.currentTarget.style.color = "var(--logo-color)"}>Войти</a>
                        </p>
                    </>
                )}

                {/* Шаг 2 */}
                {step === 2 && (
                    <>
                        <h2 style={{ margin: "0 0 0.25rem", textAlign: "center", color: "rgb(180,255,255)", fontSize: "1.6rem" }}>Подтверждение</h2>
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
                        <button onClick={handleResend} disabled={resendTimer > 0} style={{ width: "100%", marginTop: "0.75rem", padding: "0.55rem", background: "transparent", border: "1px solid rgba(100,160,220,0.15)", borderRadius: "8px", fontFamily: "inherit", fontWeight: 600, fontSize: "0.85rem", color: resendTimer > 0 ? "rgb(60,90,120)" : "var(--logo-color)", cursor: resendTimer > 0 ? "default" : "pointer", transition: "all 0.2s" }}
                                onMouseEnter={e => { if (!resendTimer) e.currentTarget.style.borderColor = "rgba(4,198,233,0.3)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,160,220,0.15)"; }}>
                            {resendTimer > 0 ? `Повторно через ${resendTimer}с` : "Отправить повторно"}
                        </button>
                    </>
                )}

                {/* Шаг 3 */}
                {step === 3 && (
                    <>
                        <h2 style={{ margin: "0 0 0.25rem", textAlign: "center", color: "rgb(180,255,255)", fontSize: "1.6rem" }}>Профиль</h2>
                        <p style={{ margin: "0 0 1.5rem", textAlign: "center", color: "rgb(80,110,140)", fontSize: "0.875rem" }}>Аккаунт подтверждён ✓ Заполните профиль</p>

                        {/* Аватар */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.25rem" }}>
                            <div onClick={() => fileInputRef.current?.click()} style={{ width: "88px", height: "88px", borderRadius: "50%", background: avatarPreview ? "transparent" : "rgba(4,198,233,0.07)", border: "2px dashed rgba(4,198,233,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", transition: "border-color 0.2s", marginBottom: "0.5rem" }}
                                 onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(4,198,233,0.7)"}
                                 onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(4,198,233,0.3)"}>
                                {avatarPreview ? <img src={avatarPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.75rem" }}>📷</span>}
                            </div>
                            <span style={{ fontSize: "0.78rem", color: "rgb(80,110,140)" }}>{avatarFile ? avatarFile.name : "Нажмите чтобы добавить фото (необязательно)"}</span>
                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                        </div>

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
                        <button onClick={() => { loginUser({ username: localStorage.getItem("username"), access_token: localStorage.getItem("access_token"), refresh_token: localStorage.getItem("refresh_token") }); navigate("/"); }}
                                style={{ width: "100%", marginTop: "0.6rem", padding: "0.55rem", background: "transparent", border: "1px solid rgba(100,160,220,0.12)", borderRadius: "8px", fontFamily: "inherit", fontWeight: 500, fontSize: "0.85rem", color: "rgb(60,90,120)", cursor: "pointer", transition: "all 0.2s" }}
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