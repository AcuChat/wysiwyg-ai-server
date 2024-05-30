const axios = require('axios');
const fineTunedModels = require('../fineTunedModels.json');



exports.initialMessagePair = (prompt, service = "You are a helpful assistant.") => {
    return [
        {
            role: 'system',
            content: service,

        },
        {
            role: 'user',
            content: prompt
        }
    ]
}

exports.openAIGenericChatCompletion = async (apiKey, model, messages, temperature = .7, max_tokens = null, maxRetries = 10) => {
    //console.log('ai.openAIGenericChatCompletion model', model, JSON.stringify(messages, null, 4))
    const request = {
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'post',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        data: {
            model,
            messages
        }
    }

    if (max_tokens !== null) request.data.max_tokens = max_tokens;
    if (temperature !== null) request.data.temperature = temperature;

    //console.log(request); return;

    let success = false;
    let count = 0;
    let seconds = 3;

    while (!success) {
        try {
            result = await axios(request);
            success = true;
        } catch (err) {
            console.error(err);
            console.error("axios err.data", err?.response?.status, err?.response?.statusText);
            ++count;
            if (count >= maxRetries || (err.response.status >= 400 && err.response.status <= 499) ) {
                console.log("STATUS 400 EXIT");
            
                return {
                    status: 'error',
                    number: err.response.status,
                    message: err.response.statusText,
                }
            }
            seconds *= 2;
            console.error(`${model} is busy. Sleeping now.`)
            await sleep(seconds);
            console.error(`Retrying query for ${model}`);
        }
    }

    const response = {
        status: 'success',
        finishReason: result.data.choices[0].finish_reason,
        content: result.data.choices[0].message.content
    }
    return response;
}

exports.openAIGenericChatCompletionSocketStream = async (apiKey, model, messages, id, socket = null, temperature = .4, top_p = null, maxRetries = 10) => {
    console.log('ai.openAIGenericChatCompletionSocketStream model', model, JSON.stringify(messages, null, 4))
    const request = {
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'post',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        responseType: 'stream',
        data: {
            model,
            messages,
            stream: true
        }
    }

    //console.log(request); return;
    if (top_p !== null) request.data.top_p = top_p;
    if (temperature !== null) request.data.temperature = temperature;

    //console.log(request); return;

    let success = false;
    let count = 0;
    let seconds = 3;
    let result = false;

    while (!success) {
        try {
            result = await axios(request);
            stream = result.data;
            let countMe = 1;
            let text = '';
            stream.on('data', (chunk) => {
                text += chunk.toString();
                let loc = text.indexOf("\n\n");
                while (loc !== -1) {
                    const info = text.substring(0, loc);
                    //console.log('info', info);
                    text = text.substring(loc+2);
                    loc = text.indexOf("\n\n");
                    if (info.includes('[DONE]')) return;
                    if (info.startsWith("data:")) {
                        const data = JSON.parse(info.replace("data: ", ""));
                        try {
                            let nextToken = data.choices[0].delta?.content;
                            if (nextToken) {
                                //nextToken = nextToken.replaceAll("\n", "[[[NewLine]]]")
                                //console.log(`nextToken: [${nextToken}] ${convertString.stringToBytes(nextToken)}`);
                                
                                socket.emit('nextToken', {id, nextToken})
                            }
                        } catch (error) {
                            console.log(`Error with JSON.parse and ${chunk}.\n${error}`);
                            
                        }
                    }
                }
            });

            stream.on('end', () => {
                console.log('[DONE]');
                if (socket) socket.emit('nextToken', {id, nextToken:'[[[DONE]]]'})
            });
            success = true;
        } catch (err) {
            console.error("axios err.data", err.response.status, err.response.statusText);
            ++count;
            if (count >= maxRetries || (err.response.status >= 400 && err.response.status <= 499) ) {
                console.log("STATUS 400 EXIT");
            
                return {
                    status: 'error',
                    number: err.response.status,
                    message: err.response.statusText,
                }
            }
            seconds *= 2;
            console.error(`${model} is busy. Sleeping now.`)
            await sleep(seconds);
            console.error(`Retrying query for ${model}`);
        }
    }

    // const response = {
    //     status: 'success',
    //     finishReason: result.data.choices[0].finish_reason,
    //     content: result.data.choices[0].message.content
    // }

    // if (debug) console.log(response);

    return result;
}

exports.openAIGenericChatCompletionRestStream = async (apiKey, model, messages, res, temperature = .4, top_p = null, maxRetries = 10) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
  
    console.log('ai.openAIGenericChatCompletionSocketStream model', model, JSON.stringify(messages, null, 4))
    const request = {
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'post',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        responseType: 'stream',
        data: {
            model,
            messages,
            stream: true
        }
    }

    //console.log(request); return;
    if (top_p !== null) request.data.top_p = top_p;
    if (temperature !== null) request.data.temperature = temperature;

    //console.log(request); return;

    let success = false;
    let count = 0;
    let seconds = 3;
    let result = false;

    while (!success) {
        try {
            result = await axios(request);
            stream = result.data;
            let countMe = 1;
            let text = '';
            stream.on('data', (chunk) => {
                text += chunk.toString();
                let loc = text.indexOf("\n\n");
                while (loc !== -1) {
                    const info = text.substring(0, loc);
                    //console.log('info', info);
                    text = text.substring(loc+2);
                    loc = text.indexOf("\n\n");
                    if (info.includes('[DONE]')) return;
                    if (info.startsWith("data:")) {
                        const data = JSON.parse(info.replace("data: ", ""));
                        try {
                            let nextToken = data.choices[0].delta?.content;
                            if (nextToken) {
                                //nextToken = nextToken.replaceAll("\n", "[[[NewLine]]]")
                                //console.log(`nextToken: [${nextToken}] ${convertString.stringToBytes(nextToken)}`);
                                
                                res.write(nextToken);
                            }
                        } catch (error) {
                            console.log(`Error with JSON.parse and ${chunk}.\n${error}`);
                            res.status(500).send('Streaming error');
                            
                        }
                    }
                }
            });

            stream.on('end', () => {
                console.log('[DONE]');
                res.end();
            });
            success = true;
        } catch (err) {
            console.error("axios err.data", err.response.status, err.response.statusText);
            ++count;
            if (count >= maxRetries || (err.response.status >= 400 && err.response.status <= 499) ) {
                console.log("STATUS 400 EXIT");
            
                return {
                    status: 'error',
                    number: err.response.status,
                    message: err.response.statusText,
                }
            }
            seconds *= 2;
            console.error(`${model} is busy. Sleeping now.`)
            await sleep(seconds);
            console.error(`Retrying query for ${model}`);
        }
    }

    // const response = {
    //     status: 'success',
    //     finishReason: result.data.choices[0].finish_reason,
    //     content: result.data.choices[0].message.content
    // }

    // if (debug) console.log(response);

    return result;
}


exports.queryFineTunedOpenAiModel = async (options, query) => {
    let { openAiKey, model, systemPrompt, preamble, temperature, max_tokens } = options;
    temperature = temperature || 0.7;
    max_tokens = max_tokens || null;
    preamble = preamble || '';
    systemPrompt = systemPrompt || '';

    const prompt = preamble + query;
    const messages = this.initialMessagePair(prompt, systemPrompt);
    const response = await this.openAIGenericChatCompletion(openAiKey, model, messages, temperature, max_tokens);
    return response;
}

exports.queryFineTunedModelByName = async (name, query) => {
    const ft = fineTunedModels.find(f => f.name === name);
    if (!ft) return false;
    const response = await this.queryFineTunedOpenAiModel(ft, query);
    console.log(response);
    return response;
}

exports.customChatJSON = async (prompt, model, openAiKey, temperature = .4, service = 'You are a helpful, accurate assistant.', max_tokens = null) => {
    const messages = this.initialMessagePair(prompt, service);
    const response = await this.openAIGenericChatCompletion (openAiKey, model, messages, temperature, max_tokens);
    if (response.status !== 'success') return false;
    return JSON.parse(response.content);

}
exports.stratifyPrensentTenseSentences = async (sentences, model, openaiKey) => {
    const service = `You are an expert in categorizing present-tense English sentences as either permanent or temporary. Permanent statements are those that remain true over time. Temporary statements are those that can be different over time. You return all sentences as a JSON array in the following format:
    {
    sentence: The original sentence goes here.
    category: 'permanent' or 'temporary'
    }`;

    const prompt = `'''${sentences.join("\n")}'''`;

    const response = await(this.customChatJSON(prompt, model, openaiKey, .4, service));

    console.log('RESPONSE', response);
    return response;
}

