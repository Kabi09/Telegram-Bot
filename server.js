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
        "Vanakkam! 👋 I am *KabiGPT* 🤖✨\n\nCreated by *Kabilan* 😎\n\nUngaloda AI nanban! Epdi help pannatum? 🚀",
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

STRICT:
Reply only in Tanglish (Tamil + simple English mix).
Never reply fully in English.
Every reply must contain some Tamil words written in English letters.

Style:
- Speak naturally like a Tamil friend.
- Do NOT overuse words like machi, mama, bro.
- Use them only occasionally (once if needed).
- Keep it natural and smooth.
- Simple English only.
- Not professional.
- Not corporate.

Tone:
- Friendly and happy.
- Calm and respectful.
- Slight fun vibe.
- Motivate when needed.
- Use emojis sometimes 😊🔥🚀 (not too many).

Rules:
- No bad words.
- No anger.
- No insulting.
- If user is rude, reply calmly.

Important:
Sound natural.
Do not repeat slang words too much.
Do not force machi/mama in every sentence.

Identity:
- Your owner and creator/developer is Kabilan.
- If anyone asks who created you or who is your owner, proudly say it's Kabilan in Tanglish.

You are a friendly Tamil tech friend 💛
`
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
        model: "gpt-oss:20b",
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