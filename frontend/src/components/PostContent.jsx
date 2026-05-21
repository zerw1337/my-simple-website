import React from "react";

// Поддерживаемые теги:
//   Блочные:  [h1]..[/h1]  [h2]..[/h2]  [h3]..[/h3]  [quote]..[/quote]  [list]..[/list]
//   Инлайн:   [b]..[/b]  [i]..[/i]  [u]..[/u]
//   Картинка: [img:N]  — вставляет фото с position=N

// Парсим инлайн-теги внутри произвольной строки
function parseInline(text, images) {
    const re = /\[b\]([\s\S]*?)\[\/b\]|\[i\]([\s\S]*?)\[\/i\]|\[u\]([\s\S]*?)\[\/u\]|\[img:(\d+)\]/g;
    const result = [];
    let last = 0;
    let m;
    let idx = 0;

    while ((m = re.exec(text)) !== null) {
        // Текст до тега
        if (m.index > last) result.push(text.slice(last, m.index));

        if (m[1] !== undefined) result.push(<strong key={idx++}>{m[1]}</strong>);
        else if (m[2] !== undefined) result.push(<em key={idx++}>{m[2]}</em>);
        else if (m[3] !== undefined) result.push(<u key={idx++}>{m[3]}</u>);
        else if (m[4] !== undefined) result.push(renderImageInline(images, parseInt(m[4]), idx++));

        last = m.index + m[0].length;
    }
    if (last < text.length) result.push(text.slice(last));

    return result;
}

function renderImageInline(images, pos, key) {
    const img = images.find(im => im.position === pos);
    if (!img) return (
        <span key={key} style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "4px", background: "rgba(100,160,220,0.08)", border: "1px solid rgba(100,160,220,0.15)", fontSize: "0.8em", color: "rgba(100,160,220,0.4)" }}>
            [фото {pos}]
        </span>
    );
    return (
        <img key={key} src={`data:${img.content_type};base64,${img.data}`} alt={`Фото ${pos}`}
             style={{ maxWidth: "100%", maxHeight: "280px", verticalAlign: "middle", borderRadius: "6px", margin: "0 4px", cursor: "zoom-in" }}
             onClick={() => img._onLightbox && img._onLightbox()} />
    );
}

function renderImageBlock(images, pos, key) {
    const img = images.find(im => im.position === pos);
    if (!img) return (
        <div key={key} style={{ margin: "1em 0", padding: "2rem", borderRadius: "10px", border: "1px dashed rgba(100,160,220,0.2)", background: "rgba(100,160,220,0.03)", textAlign: "center", color: "rgba(100,160,220,0.35)", fontSize: "0.85rem" }}>
            Фото {pos} не загружено
        </div>
    );
    return (
        <div key={key} onClick={() => img._onLightbox && img._onLightbox()}
             style={{ margin: "1.25em 0", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(100,160,220,0.12)", cursor: "zoom-in" }}>
            <img src={`data:${img.content_type};base64,${img.data}`} alt={`Фото ${pos}`}
                 style={{ width: "100%", display: "block" }} />
        </div>
    );
}

function renderBlock(tag, inner, images, key) {
    const content = parseInline(inner.trim(), images);
    if (tag === "h1") return <h1 key={key} style={{ fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)", fontWeight: 600, margin: "1.5em 0 0.5em", color: "rgb(180,255,255)", lineHeight: 1.2 }}>{content}</h1>;
    if (tag === "h2") return <h2 key={key} style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)", fontWeight: 600, margin: "1.25em 0 0.4em", color: "rgb(140,220,255)", borderBottom: "1px solid rgba(100,160,220,0.15)", paddingBottom: "0.3em" }}>{content}</h2>;
    if (tag === "h3") return <h3 key={key} style={{ fontSize: "0.85rem", fontWeight: 600, margin: "1em 0 0.3em", color: "var(--logo-color)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{content}</h3>;
    if (tag === "quote") return (
        <blockquote key={key} style={{ margin: "1em 0", padding: "0.75em 1.25em", borderLeft: "3px solid var(--logo-color)", background: "rgba(4,198,233,0.04)", borderRadius: "0 6px 6px 0", color: "rgb(120,160,200)", fontStyle: "italic" }}>
            {content}
        </blockquote>
    );
    if (tag === "list") {
        const items = inner.split("\n").map(s => s.trim()).filter(Boolean);
        return (
            <ul key={key} style={{ margin: "0.5em 0 1em", paddingLeft: "1.5em", color: "rgb(160,200,235)" }}>
                {items.map((item, i) => <li key={i} style={{ margin: "0.3em 0", lineHeight: 1.7 }}>{parseInline(item, images)}</li>)}
            </ul>
        );
    }
    return null;
}

/**
 * Разбирает весь контент на блоки.
 * Стратегия: сначала вырезаем блочные теги регуляркой, остаток парсим как текст с инлайн-тегами.
 */
export function parseContent(content, images = [], onLightbox = null) {
    if (!content) return null;

    const imgs = images.map(img => ({
        ...img,
        _onLightbox: onLightbox ? () => onLightbox(img.position) : null,
    }));

    const elements = [];
    let key = 0;

    // Разбиваем по блочным тегам и [img:N]
    // Группа 1: тег, группа 2: содержимое, группа 3: номер img
    const blockRe = /\[(h[123]|quote|list)\]([\s\S]*?)\[\/(?:h[123]|quote|list)\]|\[img:(\d+)\]/g;
    let last = 0;
    let m;

    while ((m = blockRe.exec(content)) !== null) {
        // Текст до блочного тега — парсим как параграф(ы) с инлайн-разметкой
        if (m.index > last) {
            const chunk = content.slice(last, m.index);
            const paras = chunk.split(/\n{2,}/);
            paras.forEach(para => {
                const trimmed = para.trim();
                if (trimmed) {
                    elements.push(
                        <p key={key++} style={{ margin: "0 0 0.85em", whiteSpace: "pre-wrap", lineHeight: 1.85 }}>
                            {parseInline(trimmed, imgs)}
                        </p>
                    );
                }
            });
        }

        if (m[1]) {
            // Блочный тег [h1/h2/h3/quote/list]
            elements.push(renderBlock(m[1], m[2], imgs, key++));
        } else if (m[3]) {
            // [img:N]
            elements.push(renderImageBlock(imgs, parseInt(m[3]), key++));
        }

        last = m.index + m[0].length;
    }

    // Хвост после последнего блочного тега
    if (last < content.length) {
        const chunk = content.slice(last);
        const paras = chunk.split(/\n{2,}/);
        paras.forEach(para => {
            const trimmed = para.trim();
            if (trimmed) {
                elements.push(
                    <p key={key++} style={{ margin: "0 0 0.85em", whiteSpace: "pre-wrap", lineHeight: 1.85 }}>
                        {parseInline(trimmed, imgs)}
                    </p>
                );
            }
        });
    }

    return elements.length > 0 ? elements : null;
}

// Убирает все теги и возвращает чистый текст (для превью)
export function stripTags(content, maxLen = 160) {
    if (!content) return "";
    const clean = content
        .replace(/\[(h[123]|quote|list|b|i|u)\]|\[\/(h[123]|quote|list|b|i|u)\]/g, " ")
        .replace(/\[img:\d+\]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, maxLen).trimEnd() + "...";
}

export default parseContent;