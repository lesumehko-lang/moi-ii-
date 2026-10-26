import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Не настроены переменные Supabase в Render");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Модель Gemini
const GEMINI_MODEL = "gemini-3.8-flash";

// Получение ответа нейросети
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 4000
    ) {
      return res.status(400).json({
        error: "Напиши сообщение длиной до 4000 символов"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Не настроен GEMINI_API_KEY в Render"
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;

    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: message.trim() }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 800,
              temperature: 0.7
            }
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        response.status,
        data.error?.message || "Неизвестная ошибка"
      );

      return res.status(502).json({
        error:
          response.status === 429
            ? "Gemini перегружена или достигнут лимит запросов. Попробуй позже."
            : `Ошибка Gemini (${response.status}). Проверь логи Render.`
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      console.error(
        "Gemini вернула пустой ответ:",
        JSON.stringify(data.promptFeedback || data.candidates?.[0]?.finishReason || {})
      );

      return res.status(502).json({
        error: "Нейросеть не вернула текст. Попробуй задать вопрос иначе."
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error("Ошибка Gemini:", error.message);

    return res.status(
      error.name === "AbortError" ? 504 : 500
    ).json({
      error:
        error.name === "AbortError"
          ? "Нейросеть отвечала слишком долго. Попробуй ещё раз."
          : "Не удалось связаться с нейросетью."
    });
  }
});

// Сохранение сообщений в Supabase
app.post("/api/messages", async (req, res) => {
  try {
    const { session_id, role, content } = req.body || {};

    if (
      typeof session_id !== "string" ||
      !session_id ||
      session_id.length > 100 ||
      !["user", "assistant"].includes(role) ||
      typeof content !== "string" ||
      !content.trim() ||
      content.length > 4000
    ) {
      return res.status(400).json({
        error: "Некорректное сообщение"
      });
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        session_id,
        role,
        content: content.trim()
      })
      .select("id, role, content, created_at")
      .single();

    if (error) {
      console.error("Ошибка сохранения сообщения:", error.message);

      return res.status(500).json({
        error: "Не удалось сохранить сообщение"
      });
    }

    return res.json({ message: data });
  } catch (error) {
    console.error("Ошибка сервера:", error.message);

    return res.status(500).json({
      error: "Внутренняя ошибка сервера"
    });
  }
});

// Загрузка истории сообщений
app.get("/api/messages", async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (
      typeof sessionId !== "string" ||
      !sessionId ||
      sessionId.length > 100
    ) {
      return res.status(400).json({
        error: "Некорректный идентификатор"
      });
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Ошибка загрузки сообщений:", error.message);

      return res.status(500).json({
        error: "Не удалось загрузить сообщения"
      });
    }

    return res.json({ messages: data });
  } catch (error) {
    console.error("Ошибка сервера:", error.message);

    return res.status(500).json({
      error: "Внутренняя ошибка сервера"
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Мой ИИ запущен на порту ${PORT}`);
});
