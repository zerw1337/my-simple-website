import HomeMainStatic from "../components/HomeMainStatic.jsx"
import MainPostsList from "../components/MainPostsList.jsx";

function Home() {
    return (
        <main>
            <HomeMainStatic />
            <div>
                <h1>Посты</h1>
                <hr/>
                <MainPostsList />
                <div className="under-five-posts">
                    <p>
                        Больше постов вы найдете <a href="/blog">здесь</a>
                    </p>
                </div>


            </div>
        </main>
    );
}

export default Home;