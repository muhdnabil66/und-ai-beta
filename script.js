// Initialize Icons
if (window.lucide) { lucide.createIcons(); }

const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('customModal');

// --- THEME TOGGLE ---
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode');
});

// --- SIDEBAR TOGGLE ---
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

// --- POPUP SYSTEM ---
function showPopup(title, message, onConfirm = null) {
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

// --- BUTTON ACTIONS ---
document.getElementById('settingsBtn').addEventListener('click', () => {
    showPopup('Settings', 'Settings menu is coming in a future update.');
});

document.getElementById('contactBtn').addEventListener('click', () => {
    window.location.href = 'contact.html';
});

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    showPopup('Clear History', 'Are you sure you want to delete all chats?', () => {
        document.getElementById('chatStreamInner').innerHTML = '';
        location.reload(); // Simple way to reset state
    });
});

document.getElementById('newChatBtn').addEventListener('click', () => {
    location.reload();
});

// --- PLACEHOLDER FEATURES ---
document.getElementById('voiceBtn').addEventListener('click', () => {
    showPopup('Voice Input', 'Microphone access is being optimized for your browser.');
});

document.getElementById('attachBtn').addEventListener('click', () => {
    showPopup('File Upload', 'File analysis feature is coming soon.');
});

// --- CHAT & API LOGIC ---
async function askAI(prompt) {
    // IMPORTANT: Use GitHub Secrets to replace this string during deployment
    const apiKey = "INSERT_OPENROUTER_KEY_HERE"; 
    
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

// Simple Helper for suggestions
function fillInput(text) {
    userInput.value = text;
}

// Handle Send
async function handleChat() {
    const text = userInput.value.trim();
    if (!text) return;

    if (emptyState) emptyState.style.display = 'none';
    
    // Add user message to UI (Simplified for brevity)
    const userDiv = document.createElement('div');
    userDiv.className = 'message-wrapper user-msg';
    userDiv.innerHTML = `<div class="message-content">${text}</div>`;
    chatBox.appendChild(userDiv);

    userInput.value = '';

    try {
        const aiRes = await askAI(text);
        const aiDiv = document.createElement('div');
        aiDiv.className = 'message-wrapper ai-msg';
        aiDiv.innerHTML = `<div class="message-content">${aiRes}</div>`;
        chatBox.appendChild(aiDiv);
    } catch (e) {
        showPopup('Error', e.message);
    }
}

document.getElementById('sendBtn').addEventListener('click', handleChat);