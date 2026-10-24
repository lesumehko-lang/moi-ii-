
const chat = document.querySelector("#chat");
const input = document.querySelector("#input");
const send = document.querySelector("#send");
const clear = document.querySelector("#clear");
const quick = document.querySelector("#quick");
const welcome = document.querySelector("#welcome");

function answer(text) {
  const q = text.toLowerCase();

  if (q.includes("привет")) {
    return "Привет! Я Мой ИИ! 🤖";
  }

  if (q.includes("видео") || q.includes("тикток")) {
    return "🎬 Идея: сними смешной эксперимент с неожиданной концовкой!";
  }

  if (q.includes("факт") || q.includes("науч")) {
    return "🧠 У осьминога три сердца!";
  }

  if (q.includes("игр") || q.includes("html")) {
    return "🎮 Можно создать игру, где нужно ловить падающие звёзды!";
  }

  if (q.includes("учёб") || q.includes("учеб") || q.includes("задан")) {
    return "📚 Напиши задание, и я помогу тебе разобраться.";
  }

  if (q.includes("как тебя зовут")) {
    return "Меня зовут Мой ИИ! 🤖";
  }

  return "Пока я умею отвечать на простые вопросы без API. Попробуй спросить про видео, факты или игры!";
}

function sendMessage(text) {
  const message = (text || input.value).trim();

  if (!message) return;

  if (welcome) welcome.remove();
  if (quick) quick.remove();

  const userMessage = document.createElement("p");
  userMessage.textContent = "Ты: " + message;
  chat.appendChild(userMessage);

  const botMessage = document.createElement("p");
  botMessage.textContent = "Мой ИИ: " + answer(message);
  chat.appendChild(botMessage);

  input.value = "";
  chat.scrollTop = chat.scrollHeight;
}

send.addEventListener("click", function () {
  sendMessage("");
});

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage("");
  }
});

clear.addEventListener("click", function () {
  chat.replaceChildren();
  input.value = "";
});

if (quick) {
  quick.querySelectorAll("[data-q]").forEach(function (button) {
    button.addEventListener("click", function () {
      sendMessage(button.dataset.q);
    });
  });
}
