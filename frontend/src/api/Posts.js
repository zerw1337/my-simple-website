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
export async function getNextPost(currentPostId) {
    const res = await fetch(`${API_URL}/posts/next_post/?current_post_id=${currentPostId}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function getPreviousPost(currentPostId) {
    const res = await fetch(`${API_URL}/posts/previous_post/?current_post_id=${currentPostId}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function getProfile(userId) {
    const res = await fetch(`${API_URL}/profile/${userId}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function getCommentsByUserId(userId) {
    const res = await fetch(`${API_URL}/comments/${userId}/`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function getPostsByUserId(userId) {
    const res = await fetch(`${API_URL}/posts/by_user/${userId}`);
    if (!res.ok) return [];
    return await res.json();
}
export async function getCategories() {
    const res = await fetch(`${API_URL}/categories/`);
    if (!res.ok) return [];
    return await res.json();
}

export async function getAllPosts() {
    const res = await fetch(`${API_URL}/posts/`);
    if (!res.ok) return [];
    return await res.json();
}
export async function createPost(title, content, category_id) {
    const token = localStorage.getItem("access_token");
    const res = await fetchWithAuth(`${API_URL}/posts/create/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, category_id }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}

export async function createCategory(name, emoji, description) {
    const token = localStorage.getItem("access_token");
    const res = await fetchWithAuth(`${API_URL}/categories/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name, emoji, description }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}

export async function deleteCategory(id) {
    const token = localStorage.getItem("access_token");
    const res = await fetchWithAuth(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}

export async function deletePost(id) {
    const token = localStorage.getItem("access_token");
    const res = await fetchWithAuth(`${API_URL}/posts/delete/?post_id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}
export async function updatePost(id, title, content, category_id) {
    const token = localStorage.getItem("access_token");
    const res = await fetchWithAuth(`${API_URL}/posts/update/?post_id=${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, category_id }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}
export async function getTopViewedPosts() {
    const res = await fetch(`${API_URL}/posts/top_viewed/`);
    if (!res.ok) return [];
    return await res.json();
}

export async function getTopRatedPosts() {
    const res = await fetch(`${API_URL}/posts/top_rated/`);
    if (!res.ok) return [];
    return await res.json();
}
export async function getAllUsers() {
    const res = await fetchWithAuth(`${API_URL}/user/get_all_users/`);
    if (!res.ok) return [];
    return await res.json();
}

export async function banUser(userId) {
    const res = await fetchWithAuth(`${API_URL}/user/ban/?user_id=${userId}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}
export async function unbanUser(userId) {
    const res = await fetchWithAuth(`${API_URL}/user/unban/?user_id=${userId}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error((await res.json()).detail || "Ошибка");
    return await res.json();
}