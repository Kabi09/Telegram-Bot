import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ===============================
// ✅ Telegram Bot (Polling Mode)
// ===============================
const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

console.log("🤖 Bot running locally with polling...");

// ===============================
// ✅ MongoDB
// ===============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

const chatSchema = new mongoose.Schema({
  userId: String,
  messages: [
    {
      role: String,
      content: String,
    },
  ],
});

const Chat = mongoose.model("Chat", chatSchema);

// ===============================
// ✅ Handle Messages
// ===============================
bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    if (text === "/start") {
      return bot.sendMessage(
        chatId,
        "Hello 👋 I am KabiGPT AI.\nAsk me anything!"
      );
    }

    // Typing animation
    await bot.sendChatAction(chatId, "typing");

    // Get or create chat history
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
      content: text,
    });

    const lastMessages = userChat.messages.slice(-10);

    // 🔥 Call Ollama Cloud
    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "ministral-3:3b-cloud",
        messages: lastMessages,
        stream: false,
      }),
    });

    const data = await response.json();
    const reply = data.message?.content || "AI Error";

    // Save AI reply
    userChat.messages.push({
      role: "assistant",
      content: reply,
    });

    await userChat.save();

    // Send reply
    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error("Error:", error);
  }
});