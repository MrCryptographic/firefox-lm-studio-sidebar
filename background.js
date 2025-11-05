// Listen for a message from the sidebar UI to start a fetch request.
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.prompt) {
        fetchFromLMStudio(message.prompt);
        return true; 
    }
});

async function fetchFromLMStudio(prompt) {
    // --- START OF CHANGES ---
    // Get the saved URL from storage, with a default fallback.
    const data = await browser.storage.local.get({
        serverUrl: 'http://localhost:1234'
    });
    const serverUrl = data.serverUrl;
    const completionsUrl = `${serverUrl}/v1/chat/completions`;
    // --- END OF CHANGES ---

    try {
        // Use the new completionsUrl variable in the fetch call
        const response = await fetch(completionsUrl, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "local-model",
                messages: [
                    { "role": "system", "content": "You are a helpful assistant." },
                    { "role": "user", "content": prompt }
                ],
                temperature: 0.7,
                stream: true,
            }),
        });
        
        // ... (the rest of the file is exactly the same) ...
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n\n");
            
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.substring(6);
                    if (data.trim() === "[DONE]") {
                        break;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content;
                        if (content) {
                            browser.runtime.sendMessage({ type: "stream-chunk", content: content });
                        }
                    } catch (e) {
                        console.error("Error parsing JSON stream chunk:", e);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error fetching from LM Studio:", error);
        browser.runtime.sendMessage({ type: "error", content: `Could not connect to the server at ${serverUrl}. Please check the URL in the extension's options.` });
    } finally {
        browser.runtime.sendMessage({ type: "stream-end" });
    }
}