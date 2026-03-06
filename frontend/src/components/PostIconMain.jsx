import "./PostIconMain_styles.css";

import { Link } from "react-router-dom";

function PostIconMain({ id, title, author, date, content }) {
    return (
        <Link to={`/post/${id}`} className="post-link">
            <article className="post">
                <h2 className="post-title">{title}</h2>

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

export default PostIconMain;
