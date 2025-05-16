// // deepseek-api.js
// require('dotenv').config();
// const axios = require('axios');

// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

// async function getAIResponse(prompt) {
//     try {
//         const response = await axios.post(
//             DEEPSEEK_API_URL,
//             {
//                 model: 'deepseek-chat',
//                 messages: [{ role: 'user', content: prompt }],
//                 temperature: 0.7
//             },
//             {
//                 headers: {
//                     'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );
        
//         return response.data.choices[0].message.content;
//     } catch (error) {
//         console.error('DeepSeek API Error:', error.response?.data || error.message);
//         throw new Error('Failed to get AI response');
//     }
// }

// module.exports = { getAIResponse };











const axios = require('axios');
require('dotenv').config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

const conversationHistory = new Map(); // Store history per chat

async function getAIResponse(input, chatId) {
    try {
        // Retrieve or initialize conversation history
        if (!conversationHistory.has(chatId)) {
            conversationHistory.set(chatId, []);
        }
        const history = conversationHistory.get(chatId);

        // Format input as a prompt
        let prompt;
        if (input.type === 'text') {
            prompt = input.content;
        } else if (input.type === 'image') {
            prompt = `Analyze this image: ${input.content} Provide a brief analysis or description.`;
        } else if (input.type === 'text_file') {
            prompt = `Analyze this text file content (file: ${input.fileName}):\n${input.content}`;
        } else {
            prompt = `Analyze this file: ${input.content} Provide a brief analysis based on the file type.`;
        }

        // Add user input to history
        history.push({ role: 'user', content: prompt });

        // Generate a unique cache key for this chat
        const cacheKey = `chat_${chatId}`;

        // Prepare request payload
        const payload = {
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: 'You are a helpful assistant capable of analyzing text and file contents. Provide simple and concise responses.' },
                ...history // Include conversation history
            ]
        };

        // Make API request with caching
        const response = await axios.post(API_URL, payload, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Cache-Key': cacheKey // Enable context caching
            }
        });

        // Extract AI response
        const aiResponse = response.data.choices[0].message.content;

        // Add AI response to history
        history.push({ role: 'assistant', content: aiResponse });

        // Limit history to avoid excessive token usage
        if (history.length > 5) {
            history.splice(0, history.length - 5); // Keep last 10 messages
        }

        return aiResponse;
    } catch (error) {
        console.error('DeepSeek API Error:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { getAIResponse };


























// //generate by grok old
// const axios = require('axios');
// require('dotenv').config();

// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// const conversationHistory = new Map(); // Store history per chat

// async function getAIResponse(input, chatId) {
//     try {
//         // Retrieve or initialize conversation history
//         if (!conversationHistory.has(chatId)) {
//             conversationHistory.set(chatId, []);
//         }
//         const history = conversationHistory.get(chatId);

//         // Format input as a prompt
//         let prompt;
//         if (input.type === 'text') {
//             prompt = input.content;
//         } else if (input.type === 'image') {
//             prompt = `Analyze this image: ${input.content} Provide a detailed analysis or description based on the provided information.`;
//         } else if (input.type === 'text_file') {
//             prompt = `Analyze this text file content (file: ${input.fileName}):\n${input.content}`;
//         } else {
//             prompt = `Analyze this file: ${input.content} Provide a general analysis based on the file type and available information.`;
//         }

//         // Add user input to history
//         history.push({ role: 'user', content: prompt });

//         // Generate a unique cache key for this chat
//         const cacheKey = `chat_${chatId}`;

//         // Prepare request payload
//         const payload = {
//             model: 'deepseek-chat',
//             messages: [
//                 { role: 'system', content: 'You are a helpful assistant capable of analyzing text, file contents, and describing files.' },
//                 ...history // Include conversation history
//             ]
//         };

//         // Make API request with caching
//         const response = await axios.post(API_URL, payload, {
//             headers: {
//                 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//                 'Content-Type': 'application/json',
//                 'X-Cache-Key': cacheKey // Enable context caching
//             }
//         });

//         // Extract AI response
//         const aiResponse = response.data.choices[0].message.content;

//         // Add AI response to history
//         history.push({ role: 'assistant', content: aiResponse });

//         // Limit history to avoid excessive token usage
//         if (history.length > 5) {
//             history.splice(0, history.length - 5); // Keep last 10 messages
//         }

//         return aiResponse;
//     } catch (error) {
//         console.error('DeepSeek API Error:', error.response ? error.response.data : error.message);
//         throw error;
//     }
// }

// module.exports = { getAIResponse };




























// //Grok generate for OPEN_AI
// const { OpenAI } = require('openai');
// require('dotenv').config();

// const client = new OpenAI({
//     apiKey: process.env.DEEPSEEK_API_KEY,
//     baseUrl: 'https://api.deepseek.com'
// });

// const conversationHistory = new Map(); // Store history per chat

// async function getAIResponse(message, chatId) {
//     try {
//         // Retrieve or initialize conversation history
//         if (!conversationHistory.has(chatId)) {
//             conversationHistory.set(chatId, []);
//         }
//         const history = conversationHistory.get(chatId);

//         // Add user message to history
//         history.push({ role: 'user', content: message });

//         // Generate a unique cache key for this chat
//         const cacheKey = `chat_${chatId}`;

//         // Call DeepSeek API with caching
//         const response = await client.chat.completions.create({
//             model: 'deepseek-chat',
//             messages: [
//                 { role: 'system', content: 'You are a helpful assistant.' },
//                 ...history // Include conversation history
//             ],
//             extra_headers: {
//                 'X-Cache-Key': cacheKey // Enable caching
//             }
//         });

//         // Add AI response to history
//         const aiResponse = response.choices[0].message.content;
//         history.push({ role: 'assistant', content: aiResponse });

//         // Limit history to avoid excessive token usage
//         if (history.length > 10) {
//             history.splice(0, history.length - 10); // Keep last 10 messages
//         }

//         return aiResponse;
//     } catch (error) {
//         console.error('DeepSeek API Error:', error);
//         throw error;
//     }
// }

// module.exports = { getAIResponse };