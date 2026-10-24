
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", (req, res) => {
  const message = String(req.body.message || "").toLowerCase();
  let answer;

  if (message.includes("привет")) {
    answer = "Привет! 👋 Я Мой ИИ. Чем займёмся?";
  } else if (message.includes("как тебя зовут")) {
    answer = "Я Мой ИИ — твой помощник! 🤖";
  } else if (message.includes("видео") || message.includes("тикток")) {
    answer = "🎬 Идея для видео: начни с неожиданного вопроса и покажи смешной финал!";
  } else if (message.includes("факт")) {
    answer = "🧠 Интересный факт: у осьминога три сердца!";
  } else if (message.includes("игр")) {
    answer = "🎮 Идея игры: лабиринт, из которого нужно выбраться за 30 секунд.";
  } else if (message.includes("учёб") || message.includes("учеб")) {
    answer = "📚 Напиши школьное задание — попробуем разобраться!";
  } else {
    answer = "🤖 Я пока работаю без нейросети и умею отвечать на простые вопросы. Попробуй написать «привет», «идея для видео» или «интересный факт».";
  }

  res.json({ answer });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Мой ИИ запущен на порту ${PORT}`);
});
