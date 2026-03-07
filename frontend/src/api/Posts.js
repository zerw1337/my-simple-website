import { API_URL } from "./const.js";

export async function getLatestPosts() {
    const res = await fetch(`${API_URL}/posts/five_latest/`);
    return await res.json();
}

export async function getPostById(id) {
    const res = await fetch(`${API_URL}/posts/${id}`);
    if (!res.ok) throw new Error("Ошибка при запросе поста");
    const data = await res.json();
    return data;
}

