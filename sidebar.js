// --- Element References ---
const form = document.getElementById('prompt-form');
const input = document.getElementById('prompt-input');
const chatContainer = document.getElementById('chat-container');
const settingsIcon = document.getElementById('settings-icon');
const settingsPanel = document.getElementById('settings-panel');
const settingsForm = document.getElementById('settings-form');
const serverUrlInput = document.getElementById('server-url');
const statusMessage = document.getElementById('status-message');

let currentAIResponseElement = null;

// --- Settings Logic ---

// Toggle the settings panel visibility
settingsIcon.addEventListener('click', () => {
    settingsPanel.classList.toggle('visible');
});

// Save settings to storage
settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const serverUrl = serverUrlInput.value.trim();

    browser.storage.local.set({
        serverUrl: serverUrl
    }).then(() => {
        statusMessage.textContent = 'Saved!';
        setTimeout(() => {
            statusMessage.textContent = '';
        }, 2000);
    });
});

// Restore settings from storage when the sidebar opens
function restoreOptions() {
    browser.storage.local.get({
        serverUrl: 'http://localhost:1234' // Default value
    }).then((result) => {
        serverUrlInput.value = result.serverUrl;
    });
}

// --- Chat Logic ---

// Handle main prompt form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = input.value.trim();
    if (prompt) {
        appendMessage('user', prompt);
        createAIResponsePlaceholder();
        browser.runtime.sendMessage({ prompt: prompt });
        input.value = '';
        input.style.height = 'auto';
    }
});

// Listen for messages (streamed chunks, errors) from the background script
browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'stream-chunk') {
        appendToAIResponse(message.content);
    } else if (message.type === 'stream-end') {
        finalizeAIResponse();
    } else if (message.type === 'error') {
        appendToAIResponse(message.content, true);
        finalizeAIResponse();
    }
});

function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function createAIResponsePlaceholder() {
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.classList.add('message', 'ai-message');
    
    const textElement = document.createElement('p');
    textElement.style.margin = '0';
    textElement.style.display = 'inline';
    
    const cursorElement = document.createElement('span');
    cursorElement.classList.add('blinking-cursor');

    aiMessageDiv.appendChild(textElement);
    aiMessageDiv.appendChild(cursorElement);

    chatContainer.appendChild(aiMessageDiv);
    currentAIResponseElement = aiMessageDiv;
    scrollToBottom();
}

function appendToAIResponse(text, isError = false) {
    if (currentAIResponseElement) {
        const textElement = currentAIResponseElement.querySelector('p');
        if (isError) textElement.style.color = '#ff8a80';
        textElement.textContent += text;
        scrollToBottom();
    }
}

function finalizeAIResponse() {
    if (currentAIResponseElement) {
        const cursor = currentAIResponseElement.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();
    }
    currentAIResponseElement = null;
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Auto-resize textarea
input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = (input.scrollHeight) + 'px';
});

// --- Initializer ---
// Load settings when the script runs
document.addEventListener('DOMContentLoaded', restoreOptions);