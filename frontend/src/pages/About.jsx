import React from "react";

const section = {
    background: "#1f1f1f",
    borderRadius: "12px",
    padding: "1.75rem 2rem",
    marginBottom: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
};

const tag = {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    border: "1px solid var(--logo-color)",
    color: "var(--logo-color)",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: "0.85rem",
    margin: "0.25rem",
};

const medal = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

function TopList({ items }) {
    return (
        <div>
            {items.map((item, i) => (
                <div key={i} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.6rem 0",
                    borderBottom: i === items.length - 1 ? "none" : "1px solid #2a2a2a",
                    fontSize: "0.9rem",
                    lineHeight: 1.4,
                }}>
                    <span style={{ fontSize: "1.1rem", minWidth: "2rem", textAlign: "center", paddingTop: "0.1rem" }}>{medal[i]}</span>
                    <div>
                        <div style={{ color: "var(--main-text-color)", fontWeight: 600 }}>{item.en}</div>
                        <div style={{ color: "#a0a0a0", fontSize: "0.82rem" }}>{item.ru}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function About() {
    const films = [
        { en: "A Clockwork Orange", ru: "Заводной апельсин" },
        { en: "Once Upon a Time in America", ru: "Однажды в Америке" },
        { en: "Seven Years in Tibet", ru: "Семь лет в Тибете" },
        { en: "The Reader", ru: "Чтец" },
        { en: "Full Metal Jacket", ru: "Цельнометаллическая оболочка" },
    ];

    const series = [
        { en: "Breaking Bad", ru: "Во все тяжкие" },
        { en: "The Sopranos", ru: "Клан Сопрано" },
        { en: "Better Call Saul", ru: "Лучше звоните Солу" },
        { en: "The Wire", ru: "Прослушка" },
        { en: "Dexter", ru: "Декстер" },
    ];

    const games = [
        { en: "Kingdom Come: Deliverance", ru: "Kingdom Come: Deliverance" },
        { en: "Cyberpunk 2077", ru: "Cyberpunk 2077" },
        { en: "The Last of Us", ru: "Одни из нас" },
        { en: "Red Dead Redemption 2", ru: "Red Dead Redemption 2" },
        { en: "God of War III", ru: "God of War III" },
    ];

    return (
        <main>
            <div style={{ maxWidth: "800px", margin: "2rem auto" }}>

                {/* Шапка */}
                <div style={{ ...section, borderLeft: "4px solid var(--logo-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                        <div>
                            <h1 style={{ margin: "0 0 0.25rem", fontSize: "2.2rem", color: "var(--logo-color)" }}>Глеб</h1>
                            <p style={{ margin: 0, color: "#a0a0a0", fontSize: "1rem" }}>
                                26 лет · Санкт-Петербург
                            </p>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", maxWidth: "350px" }}>
                            {["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "JavaScript", "C++", "PHP"].map(t => (
                                <span key={t} style={tag}>{t}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Обо мне */}
                <div style={section}>
                    <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem", color: "var(--logo-color)" }}>Обо мне</h2>
                    <p style={{ margin: "0 0 1rem", lineHeight: 1.8, color: "var(--main-text-color)" }}>
                        Учусь на 5 курсе по направлению «Инфокоммуникационные системы и технологии» в Санкт-Петербургском государственном лесотехническом университете. Изначально поступал в СПбГУ на информационную безопасность — после первого курса по личным причинам сменил университет и продолжил обучение в другой сфере IT.
                    </p>
                    <p style={{ margin: 0, lineHeight: 1.8, color: "var(--main-text-color)" }}>
                        Основной интерес — программирование. Больше всего нравится сам процесс разработки: когда из идеи постепенно появляется работающий продукт.
                    </p>
                </div>

                {/* О сайте */}
                <div style={section}>
                    <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem", color: "var(--logo-color)" }}>О сайте</h2>
                    <p style={{ margin: "0 0 1rem", lineHeight: 1.8, color: "var(--main-text-color)" }}>
                        Этот сайт — личный блог и одновременно один из моих пет-проектов. Здесь публикуются материалы на разные темы: программирование, разработка собственных проектов, технические заметки, а также записи, связанные с играми, фильмами, сериалами и другими вещами, которые мне интересны.
                    </p>
                    <p style={{ margin: 0, lineHeight: 1.8, color: "var(--main-text-color)" }}>
                        Проект также служит площадкой для экспериментов с технологиями. Это место, где я совмещаю практику программирования с публикацией собственных заметок и идей.
                    </p>
                </div>

                {/* Топы */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
                    <div style={section}>
                        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "var(--logo-color)" }}>🎬 Фильмы</h2>
                        <TopList items={films} />
                    </div>
                    <div style={section}>
                        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "var(--logo-color)" }}>📺 Сериалы</h2>
                        <TopList items={series} />
                    </div>
                    <div style={section}>
                        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "var(--logo-color)" }}>🎮 Игры</h2>
                        <TopList items={games} />
                    </div>
                </div>

            </div>
        </main>
    );
}

export default About;
