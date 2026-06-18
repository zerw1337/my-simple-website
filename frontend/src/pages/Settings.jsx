import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { changePassword, changeEmail, confirmEmailChange, resendEmailChangeCode, getMe } from "../api/Auth";
import { uploadAvatar, getAvatarUrl } from "../api/Posts";
import { AuthContext } from "../context/AuthContext";

function Settings() {
    const navigate = useNavigate();
    const { logoutUser } = useContext(AuthContext);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    const [currentEmail, setCurrentEmail] = useState("");

    // Аватар
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarError, setAvatarError] = useState("");
    const [avatarSuccess, setAvatarSuccess] = useState("");
    const fileInputRef = useRef(null);

    const myId = (() => {
        const token = localStorage.getItem("access_token");
        if (!token) return null;
        try { return parseInt(JSON.parse(atob(token.split(".")[1])).sub); } catch { return null; }
    })();

    const myUsername = (() => {
        const token = localStorage.getItem("access_token");
        if (!token) return null;
        try { return JSON.parse(atob(token.split(".")[1])).username || localStorage.getItem("username"); } catch { return null; }
    })();

    useEffect(() => {
        getMe().then(data => data && setCurrentEmail(data.email));
        if (myId) {
            getAvatarUrl(myId).then(url => {
                if (url) setAvatarUrl(url);
            });
        }
    }, []);

    const handleAvatarFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarError("");
        setAvatarSuccess("");
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setAvatarLoading(true);
        setAvatarError("");
        setAvatarSuccess("");
        try {
            await uploadAvatar(avatarFile);
            setAvatarSuccess("Аватар обновлён!");
            // Обновляем превью из источника
            if (avatarUrl) URL.revokeObjectURL(avatarUrl);
            const newUrl = await getAvatarUrl(myId);
            setAvatarUrl(newUrl);
            setAvatarPreview(null);
            setAvatarFile(null);
        } catch (e) {
            setAvatarError(e.message);
        } finally {
            setAvatarLoading(false);
        }
    };

    const [newEmail, setNewEmail] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [emailSuccess, setEmailSuccess] = useState("");
    const [emailStep, setEmailStep] = useState(1);
    const [code, setCode] = useState("");
    const [resendTimer, setResendTimer] = useState(0);

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
        setPasswordError(""); setPasswordSuccess("");
        if (!newPassword) return setPasswordError("Введите новый пароль");
        if (newPassword.length < 6) return setPasswordError("Минимум 6 символов");
        if (newPassword !== confirmPassword) return setPasswordError("Пароли не совпадают");
        setPasswordLoading(true);
        try {
            await changePassword(newPassword);
            setPasswordSuccess("Пароль изменён. Войдите заново.");
            setTimeout(() => { logoutUser(); navigate("/login"); }, 2000);
        } catch (e) { setPasswordError(e.message); }
        finally { setPasswordLoading(false); }
    };

    const handleEmailChange = async () => {
        setEmailError(""); setEmailSuccess("");
        if (!newEmail) return setEmailError("Введите новый email");
        setEmailLoading(true);
        try { await changeEmail(newEmail); setEmailStep(2); startResendTimer(); }
        catch (e) { setEmailError(e.message); }
        finally { setEmailLoading(false); }
    };

    const handleEmailConfirm = async () => {
        setEmailError("");
        if (!code) return setEmailError("Введите код");
        setEmailLoading(true);
        try {
            await confirmEmailChange(code);
            setEmailSuccess("Email успешно изменён!");
            setEmailStep(1); setNewEmail(""); setCode("");
        } catch (e) { setEmailError(e.message); }
        finally { setEmailLoading(false); }
    };

    const handleResend = async () => {
        try { await resendEmailChangeCode(); startResendTimer(); }
        catch (e) { setEmailError(e.message); }
    };

    const currentAvatar = avatarPreview || avatarUrl;
    const letter = myUsername ? myUsername[0].toUpperCase() : "?";

    return (
        <main>
            <div className="settings-container">

                <div className="settings-header">
                    {myId && (
                        <Link to={"/profile/" + myId} className="back-link">
                            ← Профиль
                        </Link>
                    )}
                    <h2>Настройки</h2>
                </div>

                {/* Аватар */}
                <div className="settings-section">
                    <h3>Фото профиля</h3>

                    {avatarError && <div className="error">{avatarError}</div>}
                    {avatarSuccess && <div className="success">{avatarSuccess}</div>}

                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1rem" }}>
                        {/* Текущий аватар */}
                        <div style={{
                            width: "80px", height: "80px", borderRadius: "50%",
                            overflow: "hidden", flexShrink: 0,
                            background: "rgba(4,198,233,0.1)",
                            border: "2px solid rgba(4,198,233,0.25)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--logo-color)", fontSize: "2rem", fontWeight: 700,
                        }}>
                            {currentAvatar
                                ? <img src={currentAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : letter
                            }
                        </div>
                        <div style={{ flex: 1 }}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    padding: "0.45rem 1rem", background: "transparent",
                                    border: "1px solid rgba(4,198,233,0.35)", borderRadius: "7px",
                                    color: "var(--logo-color)", fontFamily: "inherit",
                                    fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                                    transition: "all 0.2s", display: "block", marginBottom: "0.4rem",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(4,198,233,0.08)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                            >
                                📷 Выбрать фото
                            </button>
                            {avatarFile && (
                                <span style={{ fontSize: "0.78rem", color: "#888" }}>{avatarFile.name}</span>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFileChange} />
                        </div>
                    </div>

                    {avatarFile && (
                        <button onClick={handleAvatarUpload} disabled={avatarLoading}>
                            {avatarLoading ? "Загрузка..." : "Сохранить аватар"}
                        </button>
                    )}
                </div>

                <div className="settings-section">
                    <h3>Смена пароля</h3>

                    {passwordError && <div className="error">{passwordError}</div>}
                    {passwordSuccess && <div className="success">{passwordSuccess}</div>}

                    <label>Новый пароль</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="от 6 до 32 символов" />

                    <label>Повторите пароль</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="повторите пароль" />

                    <button onClick={handlePasswordChange} disabled={passwordLoading}>
                        {passwordLoading ? "..." : "Изменить пароль"}
                    </button>
                </div>

                <div className="settings-section">
                    <h3>Смена email</h3>

                    {emailError && <div className="error">{emailError}</div>}
                    {emailSuccess && <div className="success">{emailSuccess}</div>}

                    {emailStep === 1 ? (
                        <>
                            {currentEmail && <p className="hint">Текущий email: <b>{currentEmail}</b></p>}
                            <label>Новый email</label>
                            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="example@mail.com" />
                            <button onClick={handleEmailChange} disabled={emailLoading}>
                                {emailLoading ? "..." : "Изменить email"}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="hint">Код отправлен на email</p>
                            <label>Код</label>
                            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Введите код" />
                            <button onClick={handleEmailConfirm} disabled={emailLoading}>
                                {emailLoading ? "..." : "Подтвердить"}
                            </button>
                            <div className="row">
                                <button onClick={handleResend} disabled={resendTimer > 0} className="outline">
                                    {resendTimer > 0 ? `Через ${resendTimer}с` : "Отправить ещё"}
                                </button>
                                <button onClick={() => { setEmailStep(1); setCode(""); setEmailError(""); }} className="outline grey">
                                    Отмена
                                </button>
                            </div>
                        </>
                    )}
                </div>

            </div>

            <style>{`
                .settings-container { max-width: 600px; margin: 2rem auto; }
                .settings-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
                .back-link { color: #888; text-decoration: none; transition: 0.2s; }
                .back-link:hover { color: var(--logo-color); }
                .settings-section { background: #1f1f1f; border-radius: 12px; padding: 1.75rem 2rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                input { width: 100%; padding: 0.6rem; margin-top: 0.3rem; margin-bottom: 0.8rem; background: #2a2a2a; border: 1px solid #444; border-radius: 6px; color: white; transition: 0.2s; box-sizing: border-box; }
                input:focus { border-color: var(--logo-color); outline: none; }
                button { padding: 0.5rem 1.5rem; background: var(--logo-color); color: black; border: none; border-radius: 6px; cursor: pointer; transition: 0.2s; margin-top: 0.5rem; font-family: inherit; font-weight: 600; }
                button:hover { transform: translateY(-1px); box-shadow: 0 0 10px rgba(0,200,255,0.4); }
                button:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: none; }
                .outline { background: transparent; border: 1px solid var(--logo-color); color: var(--logo-color); }
                .outline:hover { background: var(--logo-color); color: black; }
                .outline.grey { border-color: #444; color: #777; }
                .outline.grey:hover { background: #444; color: white; }
                .row { display: flex; gap: 0.75rem; margin-top: 0.75rem; }
                .error { color: #ff5555; margin-bottom: 0.5rem; }
                .success { color: #55cc55; margin-bottom: 0.5rem; }
                .hint { color: #aaa; font-size: 0.9rem; }
            `}</style>
        </main>
    );
}

export default Settings;