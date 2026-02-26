// 1. IMMEDIATE LOADING FIX: Force hide welcome screen after 2 seconds
window.addEventListener('load', () => {
    setTimeout(() => {
        const welcome = document.getElementById('welcomeScreen');
        if (welcome) {
            welcome.classList.add('hidden');
            console.log("Welcome screen hidden");
        }
    }, 2000); // Matches your index.html timing
});

// 2. INITIALIZE ICONS
if (window.lucide) { lucide.createIcons(); }

// 3. SELECT ELEMENTS
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('customModal');

// Create a container for messages if it doesn't exist
let chatStreamInner = document.querySelector('.chat-stream-inner');
if (!chatStreamInner && chatBox) {
    chatStreamInner = document.createElement('div');
    chatStreamInner.className = 'chat-stream-inner';
    chatBox.appendChild(chatStreamInner);
}

// 4. THEME & SIDEBAR TOGGLES
themeToggle?.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode'); // Supports light-mode CSS variables
});

menuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('collapsed'); // Controls width/visibility
});

// 5. POPUP SYSTEM
function showPopup(title, message, onConfirm = null) {
    if (!modal) return;
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    modal.classList.remove('hidden');

    document.getElementById('modalConfirm').onclick = () => {
        if (onConfirm) onConfirm();
        modal.classList.add('hidden');
    };
    document.getElementById('modalClose').onclick = () => {
        modal.classList.add('hidden');
    };
}

// 6. CHAT & IMAGE LOGIC
async function askAI(prompt) {
    const apiKey = "INSERT_OPENROUTER_KEY_HERE"; // Swapped by GitHub Action
    
    if (apiKey.includes("INSERT_OPENROUTER")) {
        throw new Error("Security Error: API Key missing. Please check deployment settings.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "google/gemini-2.0-flash-exp:free",
            "messages": [{ "role": "user", "content": prompt }]
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}

// Placeholder Image Logic (Hugging Face)
async function generateImage(prompt) {
    const hfToken = "INSERT_HF_TOKEN_HERE"; 
    if (hfToken.includes("INSERT_HF")) throw new Error("Image API Key missing.");

    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        headers: { "Authorization": `Bearer ${hfToken}` },
        method: "POST",
        body: JSON.stringify({ inputs: prompt })
    });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// 7. MESSAGE RENDERING
function appendMessage(role, content) {
    if (emptyState) emptyState.style.display = 'none';
    const msg = document.createElement('div');
    msg.className = `message-wrapper ${role}-msg`;
    msg.innerHTML = `<div class="message-content">${content.replace(/\n/g, '<br>')}</div>`;
    chatStreamInner.appendChild(msg);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    return msg;
}

// 8. ACTION HANDLERS
async function handleAction(type) {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    appendMessage('user', text);
    const thinking = appendMessage('ai', type === 'chat' ? 'Thinking...' : 'Generating image...');

    try {
        if (type === 'chat') {
            const aiRes = await askAI(text);
            thinking.remove();
            appendMessage('ai', aiRes);
        } else {
            const imgUrl = await generateImage(text);
            thinking.remove();
            appendMessage('ai', `<img src="${imgUrl}" style="width:100%; border-radius:12px;">`);
        }
    } catch (e) {
        thinking.innerHTML = `<div style="color:red;">Error: ${e.message}</div>`;
    }
}

// 9. EVENT LISTENERS
document.getElementById('sendBtn')?.addEventListener('click', () => handleAction('chat'));
document.getElementById('imgGenBtn')?.addEventListener('click', () => handleAction('image'));

document.getElementById('settingsBtn')?.addEventListener('click', () => {
    showPopup('Settings', 'Settings menu will be updated in the future.');
});

document.getElementById('voiceBtn')?.addEventListener('click', () => {
    showPopup('Voice', 'Voice feature will be updated in the future.');
});

// Sidebar functionality
function newChat() { location.reload(); }
function clearChat() { 
    chatStreamInner.innerHTML = '';
    location.reload();
}

// Suggestions helper
function fillInput(text) {
    if (userInput) userInput.value = text;
}