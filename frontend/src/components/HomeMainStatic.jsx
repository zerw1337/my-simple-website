import mainImg from "../assets/images/main-img.png";

function HomeMainStatic() {
    return (
        <div>
            <h1 style={{paddingTop: "3em"}}>
                Добро пожаловать!
            </h1>
            <img
                src={mainImg}
                alt="error404"
                style={{ width: "16em", height: "16em", display: "block", margin: "0 auto" }}
            />
            <p style={{paddingTop: "3em", textAlign: "justify"}}>
                Еще раз привет, рад тебя видеть! Меня зовут Глеб, живу в городе Санкт-Петербург, Россия.
                В данный момент заканчиваю институт, параллельно изучаю бекэнд разработку на языке Python, в будущем хочу стать бекэнд разработчиком.
                Этот сайт - мой тренировочный проект. В любом случае, буду здесь ингода писать о играх/фильмах/сериалах/музыке/прочем.
            </p>
        </div>
    )
}

export default HomeMainStatic;