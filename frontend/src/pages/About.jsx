import React from "react";

const skills = [
    "Иванов Глеб", "26 лет", "Backend", "Python",
    "FastAPI", "PostgreSQL", "SQLAlchemy",
    "Redis", "Docker", "php", "JS", "React", "Nginx", "Linux", "Pytest"
];

function About() {
    return (
        <main
            style={{
                paddingTop: "3rem",
                textAlign: "center",
                overflow: "hidden",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}
        >
            {/* Основной заголовок */}
            <p
                style={{
                    fontSize: "4.5rem",
                    fontWeight: "900",
                    marginBottom: "1rem",
                    color: "rgb(180, 255, 255)",
                    letterSpacing: "-0.02em",
                    textTransform: "uppercase",
                    textShadow: "2px 2px 10px rgba(0, 200, 255, 0.3)"
                }}
            >
                Обо мне
            </p>

            {/* Бегущая лента скиллов */}
            <div
                style={{
                    display: "flex",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    fontSize: "1.5rem",
                    color: "rgb(180, 220, 255)",
                    letterSpacing: "0.1em",
                    marginBottom: "3rem"
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        animation: "scrollSkills 15s linear infinite"
                    }}
                >
                    {[...skills, ...skills].map((skill, index) => (
                        <span key={index} style={{ margin: "0 2rem" }}>
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Анимация ленты */}
            <style>
                {`
                    @keyframes scrollSkills {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                `}
            </style>

            <div style={{ width: "100%", overflow: "hidden", lineHeight: 0, margin: "2rem 0" }}>
                <svg
                    viewBox="0 0 1200 60"
                    preserveAspectRatio="none"
                    style={{ width: "100%", height: "40px", display: "block" }}
                >
                    <path
                        d="M0,30
               C150,20 300,40 450,30
               C600,20 750,40 900,30
               C1050,20 1200,30 1200,30"
                        style={{
                            fill: "none",
                            stroke: "rgb(180, 255, 255)",
                            strokeWidth: 2,
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            opacity: 0.7
                        }}
                    />
                </svg>
            </div>




            <div
                style={{
                    width: "100%",
                    padding: "0 2rem",
                    marginTop: "3rem",
                    marginBottom: "6rem",
                    textAlign: "center",
                    boxSizing: "border-box",
                    position: "relative",
                    overflow: "hidden",

                }}
            >
                {/* Абстрактный фон с лёгкими линиями */}
                <svg
                    viewBox="0 0 1200 400"
                    preserveAspectRatio="none"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 0,
                    }}
                >
                    {/* Неровные линии как в тетради */}
                    <path
                        d="M0 50 C150 70 300 30 450 60 C600 80 750 40 900 70 C1050 50 1200 60"
                        stroke="rgba(180,255,255,0.06)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M0 120 C200 140 400 100 600 130 C800 150 1000 110 1200 140"
                        stroke="rgba(180,255,255,0.05)"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M0 190 C150 180 350 200 500 190 C650 180 850 200 1200 185"
                        stroke="rgba(180,255,255,0.04)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Зачёркивания / перекрестные линии */}
                    <path
                        d="M50 60 L150 20 M200 90 L280 50 M400 130 L480 90 M600 100 L680 140 M900 150 L980 110"
                        stroke="rgba(180,255,255,0.03)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <path
                        d="M100 20 L140 60 M220 50 L260 90 M420 90 L460 130 M620 140 L660 100 M920 110 L960 150"
                        stroke="rgba(180,255,255,0.03)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Основной текст поверх */}
                <p
                    style={{
                        fontSize: "2.5rem",
                        fontWeight: "700",
                        marginBottom: "2rem",
                        color: "rgb(160, 230, 255)",
                        letterSpacing: "-0.01em",
                        textTransform: "uppercase",
                        textShadow: "1px 1px 5px rgba(0, 200, 255, 0.2)",
                        position: "relative",
                        zIndex: 1
                    }}
                >
                    Образование
                </p>

                <div
                    style={{
                        fontSize: "1.65rem",
                        color: "rgb(180, 220, 255)",
                        lineHeight: "1.8",
                        maxWidth: "1200px",
                        margin: "0 auto",
                        textAlign: "left",
                        padding: "1.5rem 2rem",
                        position: "relative",
                        zIndex: 1,
                        background: "rgba(0,0,0,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                    }}
                >
                    <div style={{ marginBottom: "1.5rem" }}>
                        <span style={{ color: "rgb(120, 200, 255)", marginRight: "0.8rem" }}>•</span>
                        <strong>Общее среднее образование:</strong> Академическая гимназия №56 (2007–2018)
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <span style={{ color: "rgb(120, 200, 255)", marginRight: "0.8rem" }}>•</span>
                        <strong>Высшее образование:</strong> СПбПУ (2018–2019) — Информационная безопасность
                    </div>

                    <div>
                        <span style={{ color: "rgb(120, 200, 255)", marginRight: "0.8rem" }}></span>
                        СПбГЛТУ (2022–текущее время, 5 курс) — Инфокоммуникационные системы и технологии
                    </div>
                </div>
            </div>


            <div style={{ width: "100%", overflow: "hidden", lineHeight: 0, margin: "2rem 0" }}>
                <svg
                    viewBox="0 0 1200 60"
                    preserveAspectRatio="none"
                    style={{ width: "100%", height: "40px", display: "block" }}
                >
                    <path
                        d="M0,30
               C150,20 300,40 450,30
               C600,20 750,40 900,30
               C1050,20 1200,30 1200,30"
                        style={{
                            fill: "none",
                            stroke: "rgb(180, 255, 255)",
                            strokeWidth: 2,
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            opacity: 0.7
                        }}
                    />
                </svg>
            </div>



            <div
                style={{
                    width: "100%",
                    padding: "3rem 2rem",
                    marginBottom: "6rem",
                    position: "relative",
                    overflow: "hidden",
                    textAlign: "center",
                }}
            >
                {/* Фон с кодовыми линиями */}
                <svg
                    viewBox="0 0 1200 400"
                    preserveAspectRatio="none"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                >
                    {/* Плавающие блоки */}
                    {[...Array(50)].map((_, i) => {
                        const x = Math.random() * 1200;
                        const y = Math.random() * 400;
                        const size = 10 + Math.random() * 30;
                        const opacity = 0.02 + Math.random() * 0.05;
                        return (
                            <rect
                                key={i}
                                x={x}
                                y={y}
                                width={size}
                                height={size / 2}
                                fill="rgb(180,255,255)"
                                opacity={opacity}
                                rx="2"
                                ry="2"
                            />
                        );
                    })}

                    {/* Плавающие символы */}
                    {["{","}","<>",";","()"].map((sym, i) => {
                        const x = 50 + i * 220;
                        const y = 30 + i * 50;
                        const size = 12 + Math.random() * 8;
                        return (
                            <text
                                key={i}
                                x={x}
                                y={y}
                                fontSize={size}
                                fill="rgba(180,255,255,0.06)"
                                fontFamily="monospace"
                            >
                                {sym}
                            </text>
                        );
                    })}
                </svg>

                {/* Заголовок Skills поверх фона */}
                <p
                    style={{
                        fontSize: "2.5rem",
                        fontWeight: "700",
                        marginBottom: "2rem",
                        color: "rgb(160, 230, 255)",
                        letterSpacing: "-0.01em",
                        textTransform: "uppercase",
                        textShadow: "1px 1px 5px rgba(0, 200, 255, 0.2)",
                        position: "relative",
                        zIndex: 1
                    }}
                >
                    Skills
                </p>
                <div
                    style={{
                        fontSize: "1.6rem",
                        color: "rgb(180, 220, 255)",
                        lineHeight: "1.8",
                        maxWidth: "1200px",
                        margin: "0 auto 3rem",
                        textAlign: "left",
                        padding: "1rem 2rem",
                        background: "rgba(0, 0, 0, 0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                    }}
                >
                    <div style={{ marginBottom: "1rem" }}>
                        <span style={{ color: "rgb(120, 200, 255)", marginRight: "0.5rem" }}>•</span>
                        Свободное владение <strong>Python</strong> и <strong>FastAPI</strong> для создания быстрых и надёжных API
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <span style={{ color: "rgb(120, 200, 255)", marginRight: "0.5rem" }}>•</span>
                        Опыт работы с <strong>PostgreSQL</strong> и <strong>SQLAlchemy</strong> для структурированного хранения и управления данными
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <span style={{ color: "rgb(120, 200, 255)", marginRight: "0.5rem" }}>•</span>
                        Использование <strong>Redis</strong> и <strong>Docker</strong> для оптимизации приложений и контейнеризации сервисов
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <span style={{ color: "rgb(120, 200, 255)", marginRight: "0.5rem" }}>•</span>
                        Настройка <strong>nginx</strong> и уверенная работа в среде <strong>Linux</strong> для стабильности серверной инфраструктуры
                    </div>
                    <div>
                        <span style={{ color: "rgb(120, 200, 255)", marginRight: "0.5rem" }}>•</span>
                        Базовые знания <strong>React</strong> и <strong>PHP</strong> для создания интегрированных решений
                    </div>
                    <div>
                        <span style={{ color: "rgb(120, 200, 255)", marginRight: "0.5rem" }}>•</span>
                        Опыт написания <strong>тестов</strong> с помощью <strong>Pytest</strong> для проверки надежности, написанного кода
                    </div>
                </div>



            </div>

        </main>
    );
}

export default About;