// Initialize Icons
if (window.lucide) { lucide.createIcons(); }

const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const emptyState = document.getElementById('emptyState');

// Setup Chat Inner
let chatStreamInner = document.createElement('div');
chatStreamInner.className = 'chat-stream-inner';
if (chatBox) { chatBox.appendChild(chatStreamInner); }

// Theme & Sidebar
document.getElementById('themeToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
});

document.getElementById('menuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('collapsed');
});

// Gemini API Function with Automatic Fallback
async function askGemini(prompt) {
    const apiKey = window.CONFIG?.GEMINI_KEY;
    if (!apiKey || apiKey.includes('actual_key')) throw new Error("Key not found");

    // We will try these names in order until one works
    const modelNames = ["gemini-1.5-flash", "gemini-pro"];
    let lastError = "";

    for (const model of modelNames) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (response.ok) {
                const data = await response.json();
                return data.candidates[0].content.parts[0].text;
            } else {
                const err = await response.json();
                lastError = err.error?.message || "Unknown Error";
                console.warn(`Model ${model} failed, trying next...`);
            }
        } catch (e) {
            lastError = e.message;
        }
    }
    throw new Error(lastError);
}

// UI Message Function
function appendMessage(role, text) {
    if (emptyState) emptyState.remove();
    const msg = document.createElement('div');
    msg.className = `message-wrapper ${role}-msg`;
    msg.innerHTML = `<div class="message-content">${text.replace(/\n/g, '<br>')}</div>`;
    chatStreamInner.appendChild(msg);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    return msg;
}

// Handle Send
async function handleAction() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    appendMessage('user', text);
    const thinking = appendMessage('ai', 'Processing...');

    try {
        const aiRes = await askGemini(text);
        thinking.remove();
        appendMessage('ai', aiRes);
    } catch (e) {
        thinking.innerHTML = `<div class="message-content" style="color:#ff6b6b; border: 1px solid #ff6b6b;"><strong>Service Error:</strong><br>${e.message}</div>`;
    }
}

// Listeners
document.getElementById('sendBtn')?.addEventListener('click', handleAction);
userInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAction();
    }
});

// Welcome Screen
window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('welcomeScreen')?.classList.add('hidden'), 2000);
});
