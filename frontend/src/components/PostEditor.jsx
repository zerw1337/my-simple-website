import React, { useRef } from "react";

/**
 * Редактор поста с тулбаром форматирования.
 * Props:
 *   value       — строка контента
 *   onChange    — (newValue) => void
 *   images      — File[] загруженных картинок (для кнопок [img:N] в тулбаре)
 *   placeholder — строка
 *   rows        — число строк textarea (default 12)
 */
function PostEditor({ value, onChange, images = [], placeholder = "Содержимое поста...", rows = 12 }) {
    const ref = useRef(null);

    const wrap = (open, close) => {
        const el = ref.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = value.slice(start, end);
        const newText = value.slice(0, start) + open + selected + close + value.slice(end);
        onChange(newText);
        requestAnimationFrame(() => {
            el.focus();
            const s = start + open.length;
            const e2 = s + selected.length;
            el.setSelectionRange(s, e2);
        });
    };

    const wrapBlock = (tag) => {
        const el = ref.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = value.slice(start, end).trim();
        const prefix = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
        const inner = selected || "Текст здесь";
        const insertion = `${prefix}[${tag}]${inner}[/${tag}]\n`;
        const newText = value.slice(0, start) + insertion + value.slice(end);
        onChange(newText);
        requestAnimationFrame(() => {
            el.focus();
            const s = start + prefix.length + tag.length + 2;
            el.setSelectionRange(s, s + inner.length);
        });
    };

    const insert = (text) => {
        const el = ref.current;
        if (!el) return;
        const pos = el.selectionStart;
        const newText = value.slice(0, pos) + text + value.slice(pos);
        onChange(newText);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(pos + text.length, pos + text.length);
        });
    };

    const btnBase = {
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "3px 8px", borderRadius: "4px",
        border: "1px solid #3a3a3a", background: "#252525",
        color: "#aaa", cursor: "pointer", fontSize: "12px",
        fontFamily: "inherit", transition: "all 0.15s", lineHeight: 1,
        whiteSpace: "nowrap",
    };
    const hover = (e, on) => {
        e.currentTarget.style.borderColor = on ? "var(--logo-color)" : "#3a3a3a";
        e.currentTarget.style.color = on ? "var(--logo-color)" : "#aaa";
    };
    const sep = <div style={{ width: "1px", height: "18px", background: "#333", margin: "0 3px", flexShrink: 0 }} />;

    const Btn = ({ label, title, onClick, style = {} }) => (
        <button type="button" title={title} onClick={onClick}
                style={{ ...btnBase, ...style }}
                onMouseEnter={e => hover(e, true)}
                onMouseLeave={e => hover(e, false)}>
            {label}
        </button>
    );

    return (
        <div style={{ border: "1px solid #444", borderRadius: "8px", overflow: "hidden", background: "#1a1a1a", transition: "border-color 0.2s" }}
             onFocusCapture={e => e.currentTarget.style.borderColor = "var(--logo-color)"}
             onBlurCapture={e => e.currentTarget.style.borderColor = "#444"}>

            {/* ── Тулбар ── */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "3px", padding: "7px 10px", background: "#202020", borderBottom: "1px solid #2e2e2e" }}>

                <span style={{ fontSize: "10px", color: "#555", marginRight: "1px" }}>H</span>
                <Btn label="1" title="Заголовок H1" onClick={() => wrapBlock("h1")} style={{ fontWeight: 700 }} />
                <Btn label="2" title="Заголовок H2" onClick={() => wrapBlock("h2")} style={{ fontWeight: 700 }} />
                <Btn label="3" title="Заголовок H3" onClick={() => wrapBlock("h3")} style={{ fontWeight: 700 }} />

                {sep}

                <Btn label="B" title="Жирный" onClick={() => wrap("[b]", "[/b]")} style={{ fontWeight: 700 }} />
                <Btn label="I" title="Курсив" onClick={() => wrap("[i]", "[/i]")} style={{ fontStyle: "italic" }} />
                <Btn label="U" title="Подчёркивание" onClick={() => wrap("[u]", "[/u]")} style={{ textDecoration: "underline" }} />

                {sep}

                <Btn label="❝" title="Цитата" onClick={() => wrapBlock("quote")} />
                <Btn label="≡" title="Список" onClick={() => wrapBlock("list")} />

                {images.length > 0 && (
                    <>
                        {sep}
                        <span style={{ fontSize: "10px", color: "#555", marginRight: "1px" }}>📷</span>
                        {images.map((_, i) => (
                            <Btn key={i} label={String(i + 1)} title={`Вставить фото ${i + 1} в курсор`}
                                 onClick={() => insert(`[img:${i + 1}]`)} />
                        ))}
                    </>
                )}
            </div>

            {/* ── Textarea ── */}
            <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
                      placeholder={placeholder} spellCheck={false}
                      style={{
                          width: "100%", padding: "0.75rem 1rem",
                          background: "#1a1a1a", border: "none", outline: "none",
                          color: "var(--main-text-color)", fontSize: "0.9rem",
                          fontFamily: "'Poppins', sans-serif", lineHeight: 1.8,
                          resize: "vertical", boxSizing: "border-box",
                          minHeight: `${rows * 1.8 * 0.9 + 1}rem`,
                      }} />

            {/* ── Шпаргалка ── */}
            <div style={{ padding: "4px 10px", background: "#1c1c1c", borderTop: "1px solid #252525", fontSize: "10px", color: "#3a3a3a", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span>[b]жирный[/b]</span>
                <span>[i]курсив[/i]</span>
                <span>[u]подчёркнутый[/u]</span>
                <span>[h1]заголовок[/h1]</span>
                <span>[quote]цитата[/quote]</span>
                <span>[list]строка1↵строка2[/list]</span>
                <span>[img:1] — фото в тексте</span>
            </div>
        </div>
    );
}

export default PostEditor;