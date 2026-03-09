import { useState, useEffect } from "react";
import { getLatestPosts } from "../api/Posts.js";
import "./styles/PostIconMain_styles.css";
import moment from "moment";
import {Link} from "react-router-dom";

function PostIconMain({ id, title, category, author, date, content }) {
    return (
        <Link to={`/posts/${id}`} className="post-link">
            <article className="post">
                <h2 className="post-title">{title}</h2>
                <span className="post-category">{category}</span>
                <div className="post-meta">
                    <span className="post-author">{author}</span>
                    <span className="post-date">{date}</span>
                </div>

                <p className="post-content">
                    {content}
                </p>
            </article>
        </Link>
    );
}

function MainPostsList() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLatestPosts()
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
                    category={post.category.name}
                    author={post.user.username}
                    date={moment(post.created_at).format("YYYY-MM-DD")}
                    content={post.content}
                />
            ))}
        </div>
    );
}

export default MainPostsList;