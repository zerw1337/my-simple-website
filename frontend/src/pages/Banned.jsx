import React from "react";

function Banned() {
    return (
        <main>
            <div style={{
                maxWidth: "500px",
                margin: "6rem auto",
                textAlign: "center",
                padding: "2rem",
            }}>
                <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🔨</div>
                <h1 style={{ color: "#ff5555", fontSize: "2rem", marginBottom: "0.5rem", fontFamily: "'Poppins', sans-serif" }}>
                    Аккаунт заблокирован
                </h1>
                <p style={{ color: "#a0a0a0", lineHeight: 1.8, marginBottom: "2rem" }}>
                    Ваш аккаунт был заблокирован администратором. Доступ к сайту ограничен.
                </p>
                <div style={{
                    background: "#1f1f1f",
                    border: "1px solid #ff5555",
                    borderRadius: "10px",
                    padding: "1rem 1.5rem",
                    color: "#a0a0a0",
                    fontSize: "0.9rem",
                }}>
                    Если вы считаете что это ошибка — свяжитесь с администратором.
                </div>
            </div>
        </main>
    );
}

export default Banned;
