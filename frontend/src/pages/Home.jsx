import HomeStatic from "../components/HomeStatic.jsx"
import MainPostsList from "../api/MainPosts.jsx";

function Home() {
    return (
        <main>
            <HomeStatic />
            <div>
                <h1>Посты</h1>
                <hr/>
                <MainPostsList />
                <div className="under-five-posts">
                    <p>
                        Больше постов вы найдете <a href="/posts">здесь</a>
                    </p>
                </div>


            </div>
        </main>
    );
}

export default Home;