import HomeMainStatic from "../components/HomeMainStatic.jsx"
import MainPostsList from "../components/MainPostsList.jsx";

function Home() {
    return (
        <main
            style={{
                padding: "2rem 1rem",
                maxWidth: "1200px",
                margin: "0 auto",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}
        >
            <HomeMainStatic />

            <section style={{ marginTop: "4rem" }}>
                <h1 style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "rgb(180, 255, 255)",
                    marginBottom: "0.5rem",
                }}>
                    Последние посты
                </h1>

                <div style={{ width: "100%", overflow: "hidden", lineHeight: 0, margin: "2rem 0", marginTop: "0rem" }}>
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

                <MainPostsList />

                <div style={{
                    textAlign: "center",
                    marginTop: "2rem",
                    fontSize: "0.95rem",
                    color: "rgb(180, 220, 255)"
                }}>
                    <p>
                        Больше постов вы найдете <a href="/blog" style={{ color: "rgb(4,198,233)", textDecoration: "underline" }}>здесь</a>
                    </p>
                </div>
            </section>
        </main>
    );
}

export default Home;