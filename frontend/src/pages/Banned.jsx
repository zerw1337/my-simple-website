import React from "react";

function Banned() {
    return (
        <main>
            <div style={{ maxWidth: "500px", margin: "6rem auto", textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🔨</div>
                <h1 style={{ color: "rgb(255,100,100)", fontSize: "2rem", marginBottom: "0.5rem", textShadow: "0 0 12px rgba(255,80,80,0.3)" }}>
                    Аккаунт заблокирован
                </h1>
                <p style={{ color: "rgb(100,130,160)", lineHeight: 1.8, marginBottom: "2rem" }}>
                    Ваш аккаунт был заблокирован администратором.
                </p>
                <div style={{
                    background: "#161b24",
                    border: "1px solid rgba(255,80,80,0.2)",
                    borderRadius: "12px",
                    padding: "1rem 1.5rem",
                    color: "rgb(100,130,160)",
                    fontSize: "0.9rem",
                }}>
                    Если вы считаете что это ошибка — свяжитесь с администратором.
                </div>
            </div>
        </main>
    );
}

export default Banned;