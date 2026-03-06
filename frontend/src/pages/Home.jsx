import HomeStatic from "../components/HomeStatic.jsx"
import Posts from "../components/PostIconMain.jsx"

function Home() {
    return (
        <main>
            <HomeStatic />
            <div>
                <h1>Посты</h1>
                <hr/>
                <Posts
                    title="Мой первый пост"
                    author="Глеб Иванов"
                    date="6 марта 2026"
                    content="Это пример содержимого поста. Тут можно писать текст, вставлять ссылки и форматирование."
                />
            </div>
        </main>
    );
}

export default Home;