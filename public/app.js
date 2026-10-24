
const chat = document.querySelector("#chat");
const input = document.querySelector("#message");
const send = document.querySelector("#send");

function answer(text) {
  const q = text.toLowerCase();

  if (q.includes("привет")) {
    return "Привет! 👋 Я Мой ИИ. Чем займёмся?";
  }
  if (q.includes("как тебя зовут")) {
    return "Я Мой ИИ — твой помощник! 🤖";
  }
  if (q.includes("видео") || q.includes("тикток")) {
    return "🎬 Идея: начни видео со слов «Вы не поверите, что случилось!» и покажи неожиданный финал.";
  }
  if (q.includes("факт")) {
    return "🧠 Интересный факт: у осьминога три сердца!";
  }
  if (q.includes("игр")) {
    return "🎮 Идея игры: создай лабиринт, где нужно найти выход за 30 секунд.";
  }
  if (q.includes("учёб") || q.includes("учеб")) {
    return "📚 Напиши задание, и я помогу разобраться!";
  }
  if (q.includes("пока")) {
    return "Пока! 👋 Возвращайся, когда понадоблюсь.";
  }

  return "🤖 Я пока умею отвечать на простые вопросы. Попробуй написать «привет», «идея для видео» или «интересный факт».";
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  chat.innerHTML += `<p><b>Ты:</b> ${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
  chat.innerHTML += `<p><b>Мой ИИ:</b> ${answer(text)}</p>`;
  input.value = "";
  chat.scrollTop = chat.scrollHeight;
}

send.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});
