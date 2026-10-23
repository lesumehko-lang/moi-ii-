import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || "gpt-6-astra";

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],
  maxAge: "1h"
}));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Слишком много сообщений. Подожди минуту и попробуй снова." }
});

const systemInstructions = `
Ты — дружелюбный русскоязычный ИИ-помощник в мобильном чате «Мой ИИ».
Отвечай понятно, полезно и безопасно. По возможности отвечай на языке пользователя.
Для школьных заданий объясняй шаги, а не только результат. Не выдумывай факты.
Если не уверен, честно скажи об этом.`;

let openai;
function getClient() {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("вставь_свой")) {
    throw new Error("На сервере не настроен OPENAI_API_KEY. Создай файл .env по инструкции.");
  }
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.OPENAI_API_KEY), model: MODEL });
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return res.status(400).json({ error: "Отправь от 1 до 20 сообщений." });
    }

    const cleanMessages = [];
    for (const item of messages) {
      if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") {
        return res.status(400).json({ error: "Неверный формат сообщения." });
      }
      const content = item.content.trim();
      if (!content || content.length > 4000) {
        return res.status(400).json({ error: "Сообщение должно содержать до 4000 символов." });
      }
      cleanMessages.push({ role: item.role, content });
    }
    if (cleanMessages.at(-1)?.role !== "user") {
      return res.status(400).json({ error: "Последнее сообщение должно быть от пользователя." });
    }

    const client = getClient();
    const response = await client.responses.create({
      model: MODEL,
      instructions: systemInstructions,
      input: cleanMessages,
      max_output_tokens: 900,
      store: false
    });

    res.json({ reply: response.output_text || "Не получилось сформировать ответ. Попробуй ещё раз." });
  } catch (error) {
    console.error("Chat API error:", error?.status || error?.name || "unknown");
    if (error?.status === 401) {
      return res.status(502).json({ error: "API-ключ не принят. Проверь настройки на сервере." });
    }
    if (error?.status === 429) {
      return res.status(429).json({ error: "У API достигнут лимит или закончился доступный баланс. Проверь настройки API-аккаунта." });
    }
    if (error?.message?.includes("OPENAI_API_KEY")) {
      return res.status(503).json({ error: error.message });
    }
    res.status(502).json({ error: "Не удалось получить ответ от ИИ. Проверь интернет, доступность модели и настройки API." });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Мой ИИ запущен: http://localhost:${PORT}`);
  console.log(`Модель: ${MODEL}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn("ВНИМАНИЕ: OPENAI_API_KEY не настроен. Сначала создай .env.");
  }
});