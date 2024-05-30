require('dotenv').config();
const { OPEN_AI_KEY } = process.env;
const openai = require('../utils/openai');

exports.openaiStream = async (req, res) => {
    let { query, model, service } = req.body;
    if (!query) return res.status(400).json('bad command');
    if (!service) service = "You are a helpful assistant.";
    if (!model) model = "gpt-3.5-turbo";

    const messages = openai.initialMessagePair(query, service);
    openai.openAIGenericChatCompletionRestStream(OPEN_AI_KEY, model, messages, res);
}