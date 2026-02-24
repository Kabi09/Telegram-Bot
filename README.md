# KabiGPT 🤖✨

KabiGPT is a friendly Telegram bot that speaks **Tanglish** (a mix of Tamil and simple English). It is designed to be your AI friend who understands you and replies in a natural, fun way.

## 🌟 Features
- **Tanglish Conversations**: Talk to the bot in Tamil and English mixed together.
- **Friendly Personality**: It feels like talking to a real friend.
- **Remembers You**: It keeps track of your last few messages to have better conversations.
- **Created by Kabilan**: Proudly developed and owned by Kabilan.

## 🛠️ How it's Made
This project uses the following tools:
- **Node.js**: The main engine for the bot.
- **Express**: To handle web requests.
- **MongoDB**: To store your chat history.
- **Telegram Bot API**: To connect the bot to Telegram.
- **Ollama**: The AI model that powers the "brain" of the bot.

## 🚀 How to Use
To run this bot, you need to set up these environment variables in a `.env` file:
- `BOT_TOKEN`: Your Telegram bot token from @BotFather.
- `MONGO_URI`: Your MongoDB connection link.
- `OLLAMA_API_KEY`: Your API key for Ollama Cloud.

### Running Locally
1. Clone the repository.
2. Install dependencies: `npm install`
3. Start the server: `npm start`

## 🌍 Deployment
This bot is ready to be deployed on **Vercel** as a serverless function.
