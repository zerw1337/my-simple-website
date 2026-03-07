import { API_URL } from "./const.js";
import { fetchWithAuth } from "./refreshToken.js";

export async function getLatestPosts() {
    const res = await fetch(`${API_URL}/posts/five_latest/`);
    return await res.json();
}

export async function getPostById(id) {
    const res = await fetch(`${API_URL}/posts/${id}`);
    if (!res.ok) throw new Error("Ошибка при запросе поста");
    return await res.json();
}

export async function getReactionsByPostId(postId) {
    const res = await fetch(`${API_URL}/reactions/${postId}/`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function getReactionTypes() {
    const res = await fetch(`${API_URL}/reactions/reaction_types/`);
    return await res.json();
}

export async function postReaction(postId, reaction) {
    const res = await fetchWithAuth(`${API_URL}/reactions/?post_id=${postId}&reaction=${reaction}`, {
        method: "POST",
    });
    return await res.json();
}
export async function getCommentsByPostId(postId) {
    const res = await fetch(`${API_URL}/comments/?post_id=${postId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function createComment(postId, content) {
    const res = await fetchWithAuth(`${API_URL}/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content }),
    });
    return await res.json();
}

export async function deleteComment(commentId) {
    const res = await fetchWithAuth(`${API_URL}/comments/${commentId}/?comment_id=${commentId}`, {
        method: "DELETE",
    });
    return await res.json();
}