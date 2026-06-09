/**
 * Singleton кеш аватарок.
 * Гарантирует, что каждый userId загружается ровно один раз,
 * даже если несколько компонентов запросят одновременно.
 */

import { getAvatarUrl } from "./Posts.js";

// userId (number) → blob-URL (string) | null
const cache = new Map();

// userId → Promise<string|null>  (висит пока запрос в полёте)
const inFlight = new Map();

/**
 * Возвращает blob-URL аватарки из кеша или загружает один раз.
 * @param {number|string|null|undefined} userId
 * @returns {Promise<string|null>}
 */
export async function getCachedAvatarUrl(userId) {
    if (!userId) return null;
    const id = Number(userId);

    if (cache.has(id)) return cache.get(id);
    if (inFlight.has(id)) return inFlight.get(id);

    const promise = getAvatarUrl(id)
        .then(url => {
            cache.set(id, url);
            inFlight.delete(id);
            return url;
        })
        .catch(() => {
            cache.set(id, null);
            inFlight.delete(id);
            return null;
        });

    inFlight.set(id, promise);
    return promise;
}

/**
 * Синхронно возвращает URL если он уже в кеше, иначе undefined.
 * Используется как начальное значение useState — даёт мгновенный
 * результат без промис-тика, что устраняет моргание аватарок при ре-рендере.
 * @param {number|string|null|undefined} userId
 * @returns {string|null|undefined}  undefined = ещё не загружено
 */
export function peekAvatarUrl(userId) {
    if (!userId) return null;
    const id = Number(userId);
    return cache.has(id) ? cache.get(id) : undefined;
}

/**
 * Заранее загружает аватарки для списка userIds (fire-and-forget).
 * @param {Array<number|string|null|undefined>} userIds
 */
export function prefetchAvatars(userIds) {
    const unique = [...new Set(userIds.filter(Boolean).map(Number))];
    unique.forEach(id => getCachedAvatarUrl(id));
}

/**
 * Принудительно сбрасывает конкретную запись (например, после смены аватарки).
 * @param {number|string} userId
 */
export function invalidateAvatar(userId) {
    const id = Number(userId);
    const url = cache.get(id);
    if (url) URL.revokeObjectURL(url);
    cache.delete(id);
    inFlight.delete(id);
}