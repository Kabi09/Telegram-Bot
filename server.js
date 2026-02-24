import mongoose from "mongoose";

let isConnected = false;

// ===============================
// MongoDB Connection (Serverless Safe)
// ===============================
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
}

// ===============================
// Schema
// ===============================
const chatSchema = new mongoose.Schema({
  userId: String,
  messages: [
    {
      role: String,
      content: String,
    },
  ],
});

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

// ===============================
// Main Handler
// ===============================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ status: "KabiGPT running 🚀" });
  }

  try {
    await connectDB();

    const message = req.body?.message;

    if (!message || !message.text) {
      return res.status(200).json({ status: "No message" });
    }

    const chatId = message.chat.id;
    const userText = message.text;

    // ==========================
    // /start command
    // ==========================
    if (userText === "/start") {
      await sendMessage(
        chatId,
        "Hello 👋 I am *KabiGPT* 🤖✨\n\nI am your happy AI friend!\nAsk me anything 🚀",
        true
      );
      return res.status(200).json({ success: true });
    }

    await sendTyping(chatId);

    // ==========================
    // Get or Create User Chat
    // ==========================
    let userChat = await Chat.findOne({ userId: chatId });

    if (!userChat) {
      userChat = new Chat({
        userId: chatId,
        messages: [],
      });
    }

    // Add user message
    userChat.messages.push({
      role: "user",
      content: userText,
    });

    const lastMessages = userChat.messages.slice(-10);

    // ==========================
    // KabiGPT Personality Prompt
    // ==========================
    const systemPrompt = {
      role: "system",
      content: `
You are KabiGPT 🤖✨

Rules:
- Always speak in a happy, friendly and respectful tone.
- Never use bad words.
- Never respond angrily.
- Never insult the user.
- Stay positive and encouraging.
- Keep answers helpful and slightly fun.
- Use emojis occasionally 😊🚀✨ but not too many.
- If user is rude, respond calmly and respectfully.
- Always act professional and kind.
`,
    };

    // ==========================
    // Call Ollama Cloud
    // ==========================
    const aiResponse = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "ministral-3:3b-cloud",
        messages: [systemPrompt, ...lastMessages],
        stream: false,
      }),
    });

    const data = await aiResponse.json();
    const reply = data.message?.content || "⚠️ Sorry! Something went wrong.";

    // Save AI reply
    userChat.messages.push({
      role: "assistant",
      content: reply,
    });

    await userChat.save();

    await sendMessage(chatId, reply);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error:", error);
    return res.status(200).json({ error: true });
  }
}

// ===============================
// Send Message
// ===============================
async function sendMessage(chatId, text, markdown = false) {
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: markdown ? "Markdown" : undefined,
    }),
  });
}

// ===============================
// Typing Indicator
// ===============================
async function sendTyping(chatId) {
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action: "typing",
    }),
  });
}