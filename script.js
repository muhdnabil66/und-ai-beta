// Initialize Icons
if (window.lucide) {
    lucide.createIcons();
}

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const userInput = document.getElementById('userInput');
const welcomeScreen = document.getElementById('welcomeScreen');
const themeToggle = document.getElementById('themeToggle');
const chatBox = document.getElementById('chatBox');
const emptyState = document.getElementById('emptyState');

// Wrapper for chat stream
let chatStreamInner = document.createElement('div');
chatStreamInner.className = 'chat-stream-inner';
if (chatBox) {
    chatBox.appendChild(chatStreamInner);
}

// 1. Sidebar Toggle
if (menuBtn && sidebar) {
    menuBtn.onclick = function() {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    };
}

// 2. Theme Toggle
if (themeToggle) {
    themeToggle.onclick = function() {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
    };
}

// 3. Welcome Screen Removal
window.addEventListener('load', function() {
    if (welcomeScreen) {
        setTimeout(function() {
            welcomeScreen.classList.add('hidden');
        }, 2000);
    }
});

// 4. Custom Popup Logic
function showPopup(title, message) {
    const modal = document.getElementById('customModal');
    if (!modal) {
        alert(title + ": " + message);
        return;
    }
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    modal.classList.remove('hidden');
    
    const confirmBtn = document.getElementById('modalConfirm');
    confirmBtn.onclick = function() {
        modal.classList.add('hidden');
    };
}

// 5. Suggestion Buttons
function fillInput(text) {
    if (userInput) {
        userInput.value = text;
        userInput.focus();
        handleAction('chat');
    }
}

// 6. Gemini API (Using -latest to fix 404/Not Found)
async function askGemini(prompt) {
    const apiKey = window.CONFIG?.GEMINI_KEY;
    if (!apiKey || apiKey.includes('actual_key')) {
        throw new Error("API Key is missing from config.js");
    }

    // Changing the model name to include '-latest' which is more robust
    const model = "gemini-1.5-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        console.error("Full Google API Error:", errorJson);
        throw new Error(errorJson.error?.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// 7. Image Generation
async function generateImage(prompt) {
    const hfToken = window.CONFIG?.HF_TOKEN;
    if (!hfToken || hfToken.includes('actual_key')) {
        throw new Error("Hugging Face Token is missing");
    }

    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        headers: { "Authorization": "Bearer " + hfToken },
        method: "POST",
        body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) throw new Error("Image API Error");

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// 8. UI Helpers
function appendMessage(role, contentHTML) {
    if (emptyState) emptyState.remove();

    const wrapper = document.createElement('div');
    wrapper.className = "message-wrapper " + role + "-msg";
    wrapper.innerHTML = '<div class="message-content">' + contentHTML + '</div>';

    chatStreamInner.appendChild(wrapper);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    return wrapper;
}

function showThinking() {
    const html = '<div class="thinking-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    return appendMessage('ai', html);
}

// 9. Main Action
async function handleAction(type) {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    appendMessage('user', text);
    const thinkingNode = showThinking();

    try {
        if (type === 'chat') {
            const res = await askGemini(text);
            thinkingNode.remove();
            appendMessage('ai', res.replace(/\n/g, '<br>'));
        } else {
            const imgUrl = await generateImage(text);
            thinkingNode.remove();
            const imgHTML = `<img src="${imgUrl}" style="width:100%; border-radius:12px; margin-top:10px;">`;
            appendMessage('ai', imgHTML);
        }
    } catch (e) {
        console.error(e);
        thinkingNode.remove();
        showPopup("Service Error", e.message);
    }
}

// 10. Listeners
document.getElementById('sendBtn')?.addEventListener('click', () => handleAction('chat'));
document.getElementById('imgGenBtn')?.addEventListener('click', () => handleAction('image'));
userInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAction('chat');
    }
});
