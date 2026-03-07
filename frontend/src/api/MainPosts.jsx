import { useState, useEffect } from "react";
import PostIconMain from "../components/PostIconMain.jsx";
import moment from 'moment';

function MainPostsList() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://127.0.0.1:8000/posts/first_five/")
            .then(res => res.json())
            .then(data => {
                setPosts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Ошибка при получении постов:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Загрузка постов...</p>;

    return (
        <div className="posts-grid">
            {posts.map(post => (
                <PostIconMain
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    author={post.user.username}
                    date={moment(post.created_at).format("YYYY-MM-DD")}
                    content={post.content}
                />
            ))}
        </div>
    );
}

export default MainPostsList;