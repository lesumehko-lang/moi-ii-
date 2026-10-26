
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

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
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
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data.error?.message);
      return res.status(502).json({
        error: "Нейросеть не ответила. Проверь настройки Gemini API."
      });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return res.status(502).json({
        error: "Нейросеть вернула пустой ответ"
      });
    }

    res.json({ reply: answer });
  } catch (error) {
    console.error("Ошибка Gemini:", error.message);
    res.status(500).json({
      error: "Не удалось связаться с нейросетью"
    });
  }
});
