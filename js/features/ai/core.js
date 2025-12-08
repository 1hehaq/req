// AI Core Module - Generic LLM wrapper and provider abstraction

export function getAISettings() {
    const provider = localStorage.getItem('ai_provider') || 'anthropic';

    if (provider === 'gemini') {
        return {
            provider: 'gemini',
            apiKey: localStorage.getItem('gemini_api_key') || '',
            model: localStorage.getItem('gemini_model') || 'gemini-flash-latest'
        };
    }

    return {
        provider: 'anthropic',
        apiKey: localStorage.getItem('anthropic_api_key') || '',
        model: localStorage.getItem('anthropic_model') || 'claude-3-5-sonnet-20241022'
    };
}

export function saveAISettings(provider, apiKey, model) {
    localStorage.setItem('ai_provider', provider);

    if (provider === 'gemini') {
        localStorage.setItem('gemini_api_key', apiKey);
        localStorage.setItem('gemini_model', model);
    } else {
        localStorage.setItem('anthropic_api_key', apiKey);
        localStorage.setItem('anthropic_model', model);
    }
}

export async function streamExplanation(apiKey, model, request, onUpdate, provider = 'anthropic') {
    if (provider === 'gemini') {
        return streamExplanationFromGemini(apiKey, model, request, onUpdate);
    }
    return streamExplanationFromClaude(apiKey, model, request, onUpdate);
}

export async function streamExplanationWithSystem(apiKey, model, systemPrompt, userPrompt, onUpdate, provider = 'anthropic') {
    if (provider === 'gemini') {
        return streamExplanationFromGeminiWithSystem(apiKey, model, systemPrompt, userPrompt, onUpdate);
    }
    return streamExplanationFromClaudeWithSystem(apiKey, model, systemPrompt, userPrompt, onUpdate);
}

export async function streamExplanationFromClaude(apiKey, model, request, onUpdate) {
    const systemPrompt = "You are an expert security researcher and web developer. Explain the following HTTP request in detail, highlighting interesting parameters, potential security implications, and what this request is likely doing. Be concise but thorough.";

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 1024,
            system: systemPrompt,
            stream: true,
            messages: [
                { role: 'user', content: `Explain this HTTP request:\n\n${request}` }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to communicate with Anthropic API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr === '[DONE]') continue;

                try {
                    const data = JSON.parse(dataStr);
                    if (data.type === 'content_block_delta' && data.delta.text) {
                        fullText += data.delta.text;
                        onUpdate(fullText);
                    }
                } catch (e) {
                    // Ignore parse errors for incomplete chunks
                }
            }
        }
    }

    return fullText;
}

export async function streamExplanationFromClaudeWithSystem(apiKey, model, systemPrompt, userPrompt, onUpdate) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 2048,
            system: systemPrompt,
            stream: true,
            messages: [
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to communicate with Anthropic API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                if (dataStr === '[DONE]') continue;

                try {
                    const data = JSON.parse(dataStr);
                    if (data.type === 'content_block_delta' && data.delta.text) {
                        fullText += data.delta.text;
                        onUpdate(fullText);
                    }
                } catch (e) {
                    // Ignore parse errors for incomplete chunks
                }
            }
        }
    }

    return fullText;
}

export async function streamExplanationFromGemini(apiKey, model, request, onUpdate) {
    const systemPrompt = "You are an expert security researcher and web developer. Explain the following HTTP request in detail, highlighting interesting parameters, potential security implications, and what this request is likely doing. Be concise but thorough.";

    const prompt = `${systemPrompt}\n\nExplain this HTTP request:\n\n${request}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to communicate with Gemini API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (!dataStr) continue;

                try {
                    const data = JSON.parse(dataStr);
                    if (data.candidates && data.candidates[0]?.content?.parts) {
                        for (const part of data.candidates[0].content.parts) {
                            if (part.text) {
                                fullText += part.text;
                                onUpdate(fullText);
                            }
                        }
                    }
                } catch (e) {
                    // Ignore parse errors for incomplete chunks
                }
            }
        }
    }

    return fullText;
}

export async function streamExplanationFromGeminiWithSystem(apiKey, model, systemPrompt, userPrompt, onUpdate) {
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: combinedPrompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to communicate with Gemini API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (!dataStr) continue;

                try {
                    const data = JSON.parse(dataStr);
                    if (data.candidates && data.candidates[0]?.content?.parts) {
                        for (const part of data.candidates[0].content.parts) {
                            if (part.text) {
                                fullText += part.text;
                                onUpdate(fullText);
                            }
                        }
                    }
                } catch (e) {
                    // Ignore parse errors for incomplete chunks
                }
            }
        }
    }

    return fullText;
}

