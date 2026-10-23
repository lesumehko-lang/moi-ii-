const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendButton = document.getElementById("send");
const statusText = document.getElementById("status");
let messages = [];
let busy = false;

function addMessage(text, role) {
  document.getElementById("welcome")?.remove();
  document.getElementById("quick")?.remove();
  const row = document.createElement("div");
  row.className = `msg ${role === "user" ? "user" : "bot"}`;
  if (role !== "user") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "✦";
    row.appendChild(avatar);
  }
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  row.appendChild(bubble);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
  return bubble;
}

function addTyping() {
  const bubble = addMessage("", "assistant");
  const dots = document.createElement("span");
  dots.className = "typing";
  for (let i = 0; i < 3; i++) dots.appendChild(document.createElement("i"));
  bubble.appendChild(dots);
  return bubble;
}

async function send(text = input.value) {
  const content = text.trim();
  if (!content || busy) return;
  busy = true;
  sendButton.disabled = true;
  input.disabled = true;
  addMessage(content, "user");
  messages.push({ role: "user", content });
  input.value = "";
  input.style.height = "auto";
  const waiting = addTyping();

  // Отправляем только последние 20 сообщений, чтобы ограничить размер запроса.
  const payload = messages.slice(-20);
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payload })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Ошибка сервера (${response.status})`);
    waiting.textContent = data.reply || "ИИ вернул пустой ответ.";
    messages.push({ role: "assistant", content: waiting.textContent });
    statusText.textContent = "Подключение к ИИ активно";
  } catch (error) {
    waiting.textContent = `Не удалось получить ответ: ${error.message}\n\nПроверь, что сервер запущен и в .env указан правильный API-ключ.`;
    // Не сохраняем неудачный ответ в историю, чтобы пользователь мог повторить вопрос.
    messages.pop();
    statusText.textContent = "Проверь подключение";
  } finally {
    busy = false;
    sendButton.disabled = false;
    input.disabled = false;
    input.focus();
    chat.scrollTop = chat.scrollHeight;
  }
}

sendButton.addEventListener("click", () => send());
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
});
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    send();
  }
});
document.querySelectorAll("[data-q]").forEach(button => {
  button.addEventListener("click", () => send(button.dataset.q));
});
document.getElementById("clear").addEventListener("click", () => {
  messages = [];
  chat.innerHTML = `
    <section class="welcome" id="welcome">
      <div class="big">🤖</div><h2>Привет! Я твой ИИ</h2>
      <p>Задавай вопросы, проси объяснить тему, придумать идею или помочь с кодом.</p>
    </section>
    <section class="quick" id="quick" aria-label="Быстрые вопросы">
      <button data-q="Придумай идею для видео в TikTok">🎬 Идея для видео</button>
      <button data-q="Объясни интересный научный факт простыми словами">💡 Интересный факт</button>
      <button data-q="Помоги сделать простую игру на HTML">🎮 Создать игру</button>
      <button data-q="Помоги разобраться с домашним заданием">📚 Помощь с учёбой</button>
    </section>`;
  document.querySelectorAll("[data-q]").forEach(button => button.addEventListener("click", () => send(button.dataset.q)));
});
fetch("/api/health").then(r => r.json()).then(data => {
  statusText.textContent = data.configured ? `ИИ готов · ${data.model}` : "Нужно настроить API-ключ";
}).catch(() => { statusText.textContent = "Сервер недоступен"; });