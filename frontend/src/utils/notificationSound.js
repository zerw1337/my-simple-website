// Звук нового уведомления — короткий двухтональный "дзынь", сгенерированный
// через Web Audio API. Аудиофайл-ассет не нужен: звук маленький, грузится
// мгновенно и не зависит от сети.

let audioCtx = null;
let unlocked = false;

function getAudioCtx() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
}

// Большинство браузеров блокируют звук, пока пользователь хоть раз не
// провзаимодействовал со страницей (клик, тап, нажатие клавиши). Поэтому
// при первом таком взаимодействии создаём/возобновляем AudioContext заранее —
// иначе самое первое уведомление может прийти молча.
function unlockOnFirstInteraction() {
    if (unlocked) return;
    const ctx = getAudioCtx();
    if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }
    unlocked = true;
}

if (typeof window !== "undefined") {
    const events = ["pointerdown", "keydown", "touchstart"];
    const handler = () => {
        unlockOnFirstInteraction();
        events.forEach((e) => window.removeEventListener(e, handler));
    };
    events.forEach((e) => window.addEventListener(e, handler, { once: false, passive: true }));
}

// Один короткий тон с плавным затуханием — мягкий "дзынь", а не резкий писк.
function playTone(ctx, freq, startTime, duration, peakGain) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
}

export function playNotificationSound() {
    try {
        const ctx = getAudioCtx();
        if (!ctx) return;

        if (ctx.state === "suspended") {
            // Если контекст ещё не разблокирован (например пуш пришёл до
            // первого клика пользователя) — пробуем восстановить молча,
            // без выброса ошибки наружу.
            ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        // Два коротких тона восходящим интервалом — звучит как лёгкий "дзынь-динь"
        playTone(ctx, 880, now, 0.18, 0.18);
        playTone(ctx, 1318.5, now + 0.09, 0.22, 0.16);
    } catch {
        // Звук — это приятное дополнение, а не критичная функциональность;
        // любая ошибка здесь не должна ломать получение самого уведомления.
    }
}