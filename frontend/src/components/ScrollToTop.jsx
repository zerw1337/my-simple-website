import React, { useState, useEffect } from "react";

function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 300);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (!visible) return null;

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
                position: "fixed",
                bottom: "2rem",
                right: "2rem",
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--logo-color), #03b0d0)",
                color: "var(--bg-main)",
                border: "none",
                cursor: "pointer",
                fontSize: "1.5rem",
                fontWeight: 700,
                boxShadow: "0 4px 20px rgba(4, 198, 233, 0.4)",
                transition: "all 0.3s ease",
                zIndex: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(4, 198, 233, 0.6)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(4, 198, 233, 0.4)";
            }}
        >
            ↑
        </button>
    );
}

export default ScrollToTop;