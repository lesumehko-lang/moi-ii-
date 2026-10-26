
const chat = document.querySelector("#chat");
const input = document.querySelector("#input");
const send = document.querySelector("#send");
const clear = document.querySelector("#clear");
const quick = document.querySelector("#quick");
const welcome = document.querySelector("#welcome");

const SESSION_KEY = "moi-ii-session";
let sessionId = localStorage.getItem(SESSION_KEY);

if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, sessionId);
}

function addMessage(role, content) {
  const p = document.createElement("p");
  p.textContent = (role === "user" ? "Ты: " : "Мой ИИ: ") + content;
  chat.appendChild(p);
}


async function answer(text) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: text
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Ошибка нейросети");
  }

  return data.reply;
}


async function saveMessage(role, content) {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      role,
      content
    })
  });

  if (!response.ok) {
    throw new Error("Не удалось сохранить сообщение");
  }
}

async function loadMessages() {
  try {
    const response = await fetch(
      "/api/messages?session_id=" + encodeURIComponent(sessionId)
    );

    if (!response.ok) throw new Error("Не удалось загрузить сообщения");

    const data = await response.json();

    if (data.messages.length) {
      if (welcome) welcome.remove();
      if (quick) quick.remove();

      data.messages.forEach(message => {
        addMessage(message.role, message.content);
      });
    }
  } catch (error) {
    console.error(error);
  }
}

async function sendMessage(text) {
  const message = (text || input.value).trim();
  if (!message) return;

  if (welcome) welcome.remove();
  if (quick) quick.remove();

  addMessage("user", message);
  input.value = "";
  send.disabled = true;

  try {
    await saveMessage("user", message);

    const reply = answer(message);
    addMessage("assistant", reply);
    await saveMessage("assistant", reply);
  } catch (error) {
    console.error(error);
    addMessage("assistant", "Не получилось сохранить сообщение. Проверь подключение к базе данных.");
  } finally {
    send.disabled = false;
    chat.scrollTop = chat.scrollHeight;
  }
}

send.addEventListener("click", () => sendMessage(""));

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage("");
  }
});

clear.addEventListener("click", () => {
  chat.replaceChildren();
  input.value = "";
  const p = document.createElement("p");
  p.textContent = "Чат очищен. Старые сообщения пока остаются в базе.";
  chat.appendChild(p);
});

if (quick) {
  quick.querySelectorAll("[data-q]").forEach(button => {
    button.addEventListener("click", () => sendMessage(button.dataset.q));
  });
}

loadMessages();
