// 1. LOADING OVERLAY
window.addEventListener('load', () => {
    setTimeout(() => {
        const welcome = document.getElementById('welcomeScreen');
        if (welcome) welcome.classList.add('hidden');
    }, 2000);
});

if (window.lucide) { lucide.createIcons(); }

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

// Close sidebar on mobile when clicking outside
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

// 5. AI LOGIC (FIXED HEADERS)
async function askAI(prompt) {
    const apiKey = "INSERT_OPENROUTER_KEY_HERE"; 
    
    if (apiKey.includes("INSERT_OPENROUTER")) {
        throw new Error("API Key missing.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "UND AI"
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

window.autoAsk = function(text) {
    userInput.value = text;
    handleChat();
}

document.getElementById('sendBtn')?.addEventListener('click', handleChat);
document.getElementById('newChatBtn')?.addEventListener('click', () => location.reload());
document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
    showPopup('Clear History', 'Delete all messages?', () => location.reload());
});
document.getElementById('settingsBtn')?.addEventListener('click', () => {
    showPopup('Settings', 'Settings configuration is coming soon.');
});
document.getElementById('contactBtn')?.addEventListener('click', () => {
    window.location.href = 'contact.html';
});

userInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChat();
    }
});