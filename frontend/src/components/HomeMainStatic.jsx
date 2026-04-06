import mainImg from "../assets/images/main-img.gif";

function HomeMainStatic() {
    return (
        <div style={{ padding: "0 1rem" }}>

            <div style={{ paddingTop: "3rem", textAlign: "center" }}>
                <p
                    style={{
                        color: "rgb(180, 255, 255)",
                        fontSize: "5rem",
                        fontWeight: "bold",
                        marginBottom: "0.2em",
                    }}
                >
                    Иванов Глеб
                </p>
                <p
                    style={{
                        color: "rgb(200, 240, 255)",
                        fontSize: "1.5rem",
                        marginTop: "0",
                        marginBottom: "0.5em",
                        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    }}
                >
                    26 лет • Backend разработчик • Санкт-Петербург
                </p>
                <p
                    style={{
                        color: "rgb(180, 220, 255)",
                        fontSize: "1.5rem",
                        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        marginTop: "0",
                        letterSpacing: "0.05em",
                    }}
                >
                    Python • FastAPI • PostgreSQL • SQLAlchemy • Redis • Docker
                </p>
            </div>


            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4rem 2rem",
                    gap: "3rem",
                    backgroundColor: "rgba(0,0,0,0.08)",
                    borderRadius: "1.2rem",
                    marginTop: "2rem",
                }}
            >

                <div style={{ flex: "1 1 350px", maxWidth: "550px" }}>
                    <p
                        style={{
                            color: "rgb(180, 220, 255)",
                            fontSize: "1.25rem",
                            lineHeight: "2",
                            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                            textAlign: "left",
                        }}
                    >
                        Добро пожаловать на мой сайт. Я развиваюсь как backend-разработчик и создаю надёжные и эффективные решения с использованием современных технологий.
                        Здесь я периодически публикую посты о своих экспериментах и проектах.
                        Все мои контакты вы найдёте в разделе «Контакты», и буду рад обсудить сотрудничество или ответить на ваши вопросы.
                    </p>
                </div>


                <div style={{ position: "relative", flex: "1 1 350px", textAlign: "center" }}>

                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "radial-gradient(circle, rgba(180,220,255,0.4) 0%, rgba(0,0,0,0) 70%)",
                            filter: "blur(50px)",
                            zIndex: 0,
                        }}
                    />

                    <img
                        src={mainImg}
                        alt="Main visual"
                        style={{
                            maxWidth: "100%",
                            borderRadius: "1rem",
                            boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
                            filter: "brightness(70%)",
                            position: "relative",
                            zIndex: 1,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default HomeMainStatic;