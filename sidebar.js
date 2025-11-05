// --- Element References ---
const form = document.getElementById('prompt-form');
const input = document.getElementById('prompt-input');
const chatContainer = document.getElementById('chat-container');
const settingsIcon = document.getElementById('settings-icon');
const settingsPanel = document.getElementById('settings-panel');
const settingsForm = document.getElementById('settings-form');
const serverUrlInput = document.getElementById('server-url');
const statusMessage = document.getElementById('status-message');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// --- State Variables ---
let chatHistory = [];
let lastUserPrompt = null;
let currentAIResponseElement = null;
let currentAIContent = { think: '', text: '' };
let streamBuffer = '';
let isThinking = false;

// =================================================================================
// --- Initialization & Event Listeners ---
// =================================================================================

document.addEventListener('DOMContentLoaded', loadChatHistory);
form.addEventListener('submit', handleFormSubmit);
settingsIcon.addEventListener('click', () => settingsPanel.classList.toggle('visible'));
settingsForm.addEventListener('submit', saveSettings);
clearHistoryBtn.addEventListener('click', handleClearHistory);
input.addEventListener('input', autoResizeTextarea);

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
        case 'stream-chunk':
            processStreamChunk(message.content);
            break;
        case 'stream-end':
            finalizeAIResponse();
            break;
        case 'error':
            processStreamChunk(message.content, true);
            finalizeAIResponse();
            break;
    }
});

// =================================================================================
// --- Feature Logic ---
// =================================================================================

// --- History Management ---

async function loadChatHistory() {
    restoreOptions();
    const data = await browser.storage.local.get({ chatHistory: [] });
    chatHistory = data.chatHistory;
    renderHistory();
}

function renderHistory() {
    chatContainer.innerHTML = '';
    chatHistory.forEach(msg => {
        if (msg.role === 'user') {
            appendMessage('user', msg.content);
        } else if (msg.role === 'ai') {
            const aiMsg = createAIMessageElement(msg.content.think, msg.content.text);
            chatContainer.appendChild(aiMsg);
            addRegenerateButton(aiMsg, msg.lastUserPrompt);
        }
    });
    scrollToBottom();
}

async function handleClearHistory() {
    if (confirm('Are you sure you want to clear the entire chat history?')) {
        chatHistory = [];
        await browser.storage.local.set({ chatHistory: [] });
        renderHistory();
    }
}

async function updateHistory() {
    if (currentAIResponseElement && currentAIContent.text) {
        chatHistory.push({ role: 'ai', content: { ...currentAIContent }, lastUserPrompt });
        await browser.storage.local.set({ chatHistory });
    }
}

// --- Main Chat Logic ---

async function handleFormSubmit(e) {
    e.preventDefault();
    const prompt = input.value.trim();
    if (!prompt) return;

    lastUserPrompt = prompt;

    // Update UI and history
    appendMessage('user', prompt);
    chatHistory.push({ role: 'user', content: prompt });
    await browser.storage.local.set({ chatHistory });

    // Create placeholder and send prompt to background
    createAIResponsePlaceholder();
    browser.runtime.sendMessage({ prompt: prompt });

    input.value = '';
    autoResizeTextarea();
}

function processStreamChunk(chunk, isError = false) {
    if (!currentAIResponseElement) return;

    streamBuffer += chunk;

    if (isError) {
        const textElement = currentAIResponseElement.querySelector('.ai-text-content');
        textElement.style.color = '#ff8a80';
        textElement.textContent = streamBuffer;
        return;
    }
    
    // Process <think> tags
    while (true) {
        if (!isThinking) {
            const thinkStart = streamBuffer.indexOf('<think>');
            if (thinkStart === -1) break;

            const textBeforeThink = streamBuffer.substring(0, thinkStart);
            currentAIContent.text += textBeforeThink;
            streamBuffer = streamBuffer.substring(thinkStart + '<think>'.length);
            isThinking = true;

        } else { // isThinking
            const thinkEnd = streamBuffer.indexOf('</think>');
            if (thinkEnd === -1) break;

            const thinkText = streamBuffer.substring(0, thinkEnd);
            currentAIContent.think += thinkText;
            streamBuffer = streamBuffer.substring(thinkEnd + '</think>'.length);
            isThinking = false;
        }
    }

    // Update UI with processed content
    updateAIResponseUI();
}

async function finalizeAIResponse() {
    if (!currentAIResponseElement) return;

    if (isThinking) {
        currentAIContent.think += streamBuffer;
    } else {
        currentAIContent.text += streamBuffer;
    }
    streamBuffer = '';
    isThinking = false;
    
    updateAIResponseUI();
    
    const cursor = currentAIResponseElement.querySelector('.blinking-cursor');
    if (cursor) cursor.remove();
    addRegenerateButton(currentAIResponseElement, lastUserPrompt);
    
    await updateHistory();
    
    currentAIResponseElement = null;
    currentAIContent = { think: '', text: '' };
}

// --- DOM Manipulation & UI Helpers ---

function createAIResponsePlaceholder() {
    if (currentAIResponseElement) currentAIResponseElement.remove();
    
    currentAIContent = { think: '', text: '' };
    currentAIResponseElement = createAIMessageElement('', '');
    
    const textElement = currentAIResponseElement.querySelector('.ai-text-content');
    const cursorElement = document.createElement('span');
    cursorElement.classList.add('blinking-cursor');
    textElement.appendChild(cursorElement);

    chatContainer.appendChild(currentAIResponseElement);
    scrollToBottom();
}

function updateAIResponseUI() {
    if (!currentAIResponseElement) return;

    const thinkBubble = currentAIResponseElement.querySelector('.think-bubble');
    const textElement = currentAIResponseElement.querySelector('.ai-text-content');
    
    if (currentAIContent.think) {
        thinkBubble.textContent = currentAIContent.think;
        thinkBubble.classList.add('visible');
    }
    
    const cursor = textElement.querySelector('.blinking-cursor');
    textElement.textContent = currentAIContent.text;
    if (cursor) textElement.appendChild(cursor);

    scrollToBottom();
}

function createAIMessageElement(thinkContent, textContent) {
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.classList.add('message', 'ai-message');
    
    const thinkBubble = document.createElement('div');
    thinkBubble.classList.add('think-bubble');
    if (thinkContent) {
        thinkBubble.textContent = thinkContent;
        thinkBubble.classList.add('visible');
    }
    
    const textElement = document.createElement('p');
    textElement.classList.add('ai-text-content');
    textElement.textContent = textContent;

    aiMessageDiv.appendChild(thinkBubble);
    aiMessageDiv.appendChild(textElement);
    
    return aiMessageDiv;
}

function addRegenerateButton(aiMessageElement, userPromptForThisResponse) {
    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'regenerate-btn';
    regenerateBtn.title = 'Regenerate';
    regenerateBtn.innerHTML = '🔄';
    
    regenerateBtn.addEventListener('click', async () => {
        const indexToRemove = chatHistory.findIndex(msg => msg.role === 'ai' && msg.content.text === aiMessageElement.querySelector('.ai-text-content').textContent);
        if (indexToRemove > -1) {
            chatHistory.splice(indexToRemove, 1);
            await browser.storage.local.set({ chatHistory });
        }
        
        aiMessageElement.remove();
        
        lastUserPrompt = userPromptForThisResponse; // Important: reset lastUserPrompt for history
        createAIResponsePlaceholder();
        browser.runtime.sendMessage({ prompt: userPromptForThisResponse });
    });
    
    aiMessageElement.appendChild(regenerateBtn);
}


function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}


// --- Utility Functions ---

function autoResizeTextarea() {
    input.style.height = 'auto';
    input.style.height = (input.scrollHeight) + 'px';
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function saveSettings(e) {
    e.preventDefault();
    const serverUrl = serverUrlInput.value.trim();
    await browser.storage.local.set({ serverUrl });
    statusMessage.textContent = 'Saved!';
    setTimeout(() => { statusMessage.textContent = ''; }, 2000);
}

async function restoreOptions() {
    const data = await browser.storage.local.get({ serverUrl: 'http://localhost:1234' });
    serverUrlInput.value = data.serverUrl;
}
