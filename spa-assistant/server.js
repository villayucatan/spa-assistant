const express = require("express");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create({
      thread_id: thread.id,
      role: "user",
      content: userMessage,
    });

    const run = await openai.beta.threads.runs.create({
      thread_id: thread.id,
      assistant_id: process.env.ASSISTANT_ID,
    });

    let status;
    do {
      const currentRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = currentRun.status;
      if (status !== "completed") await new Promise((r) => setTimeout(r, 1000));
    } while (status !== "completed");

    const messages = await openai.beta.threads.messages.list({ thread_id: thread.id });
    const reply = messages.data[0].content[0].text.value;

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Erreur lors de la requête." });
  }
});

app.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});