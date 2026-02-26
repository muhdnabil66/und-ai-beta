// 1. LOADING OVERLAY
window.addEventListener('load', () => {
    setTimeout(() => {
        const welcome = document.getElementById('welcomeScreen');
        if (welcome) welcome.classList.add('hidden');
    }, 2000);
});

if (window.lucide) { lucide.createIcons(); }

// 2. ELEMENT SELECTION
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('customModal');

let chatStreamInner = document.querySelector('.chat-stream-inner');
if (!chatStreamInner && chatBox) {
    chatStreamInner = document.createElement('div');
    chatStreamInner.className = 'chat-stream-inner';
    chatBox.appendChild(chatStreamInner);
}

// 3. THEME & MOBILE TOGGLE
document.getElementById('themeToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
});

menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar?.classList.toggle('active');
    sidebar?.classList.toggle('collapsed');
});

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar?.classList.contains('active')) {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// 4. MODAL SYSTEM
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

// 5. AI LOGIC
async function askAI(prompt) {
    const apiKey = "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"; 
    
    if (apiKey.includes("INSERT_OPENROUTER")) {
        throw new Error("Security Error: API Key missing.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "google/gemini-2.0-flash-lite:free",
            "messages": [{ "role": "user", "content": prompt }]
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API request failed.");
    return data.choices[0].message.content;
}

// 6. CHAT HANDLING
function appendMessage(role, content) {
    if (emptyState) emptyState.style.display = 'none';
    const msg = document.createElement('div');
    msg.className = `message-wrapper ${role}-msg`;
    msg.innerHTML = `<div class="message-content">${content.replace(/\n/g, '<br>')}</div>`;
    chatStreamInner.appendChild(msg);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    return msg;
}

async function handleChat() {
    const text = userInput.value.trim();
    if (!text) return;
    userInput.value = '';
    appendMessage('user', text);
    const thinking = appendMessage('ai', 'Thinking...');
    try {
        const aiRes = await askAI(text);
        thinking.remove();
        appendMessage('ai', aiRes);
    } catch (e) {
        thinking.innerHTML = `<div style="color:#ff6b6b;">Error: ${e.message}</div>`;
    }
}

// Global autoAsk for suggestions
window.autoAsk = function(text) {
    userInput.value = text;
    handleChat();
}

// 7. EVENT LISTENERS
document.getElementById('sendBtn')?.addEventListener('click', handleChat);
document.getElementById('newChatBtn')?.addEventListener('click', () => location.reload());

document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
    showPopup('Clear History', 'Delete all messages in this session?', () => location.reload());
});

document.getElementById('settingsBtn')?.addEventListener('click', () => {
    showPopup('Settings', 'Settings configuration is coming soon.');
});

document.getElementById('contactBtn')?.addEventListener('click', () => {
    window.location.href = 'contact.html';
});

document.getElementById('imgGenBtn')?.addEventListener('click', () => showPopup('Image Gen', 'Image generation optimization in progress.'));
document.getElementById('voiceBtn')?.addEventListener('click', () => showPopup('Voice', 'Voice input coming soon.'));
document.getElementById('attachBtn')?.addEventListener('click', () => showPopup('Attach', 'File attachment coming soon.'));

userInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChat();
    }
});