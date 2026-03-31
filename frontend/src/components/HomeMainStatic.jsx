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
                Привет! Меня зовут Глеб, я из Санкт-Петербурга, Россия. Сейчас завершаю обучение в институте и развиваюсь как junior backend-разработчик на Python. У меня уже есть практический опыт разработки, и я активно расширяю свои навыки в этой сфере. Этот сайт служит моим тренировочным проектом и площадкой для экспериментов. Время от времени здесь буду делиться впечатлениями о играх, фильмах, сериалах и музыке.
            </p>
        </div>
    )
}

export default HomeMainStatic;