import React from "react";

function Post({ title, author, date, content }) {
    return (
        <article style={styles.post}>
            <h2 style={styles.title}>{title}</h2>
            <div style={styles.meta}>
                <span>Автор: {author}</span> | <span>{date}</span>
            </div>
            <p style={styles.content}>{content}</p>
        </article>
    );
}

const styles = {
    post: {
        backgroundColor: "#2a2a2a",
        color: "#ececec",
        padding: "1.5em",
        borderRadius: "8px",
        marginBottom: "1.5em",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
    },
    title: {
        fontSize: "1.8em",
        marginBottom: "0.5em",
        color: "#04c6e9"
    },
    meta: {
        fontSize: "0.9em",
        color: "#aaa",
        marginBottom: "1em"
    },
    content: {
        fontSize: "1em",
        lineHeight: "1.6"
    }
};

export default Post;