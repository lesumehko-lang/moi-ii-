
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Не настроены переменные Supabase в Render");
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/messages", async (req, res) => {
  const { session_id, role, content } = req.body || {};

  if (
    typeof session_id !== "string" ||
    session_id.length > 100 ||
    !["user", "assistant"].includes(role) ||
    typeof content !== "string" ||
    !content.trim() ||
    content.length > 4000
  ) {
    return res.status(400).json({ error: "Некорректное сообщение" });
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
    return res.status(500).json({ error: "Не удалось сохранить сообщение" });
  }

  res.json({ message: data });
});

app.get("/api/messages", async (req, res) => {
  const sessionId = req.query.session_id;

  if (
    typeof sessionId !== "string" ||
    !sessionId ||
    sessionId.length > 100
  ) {
    return res.status(400).json({ error: "Некорректный идентификатор" });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Ошибка загрузки сообщений:", error.message);
    return res.status(500).json({ error: "Не удалось загрузить сообщения" });
  }

  res.json({ messages: data });
});

app.listen(PORT, () => {
  console.log(`Мой ИИ запущен на порту ${PORT}`);
});
