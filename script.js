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
const voiceBtn = document.getElementById('voiceBtn');

// Wrapper for chat stream inner content
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

// 3. Welcome Screen Smooth Removal
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

// 5. Missing Function Fix (For Suggestion Buttons)
function fillInput(text) {
    if (userInput) {
        userInput.value = text;
        userInput.focus();
        handleAction('chat');
    }
}

// 6. API Logic (Stable URL to fix 404)
async function askGemini(prompt) {
    if (!window.CONFIG || !window.CONFIG.GEMINI_KEY) {
        throw new Error("Missing API Key in config.js");
    }

    const key = window.CONFIG.GEMINI_KEY;
    // Standard stable model name
    const model = "gemini-1.5-flash";
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";
    const fullUrl = baseUrl + model + ":generateContent?key=" + key;

    const response = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        throw new Error("Google API rejected the request. Status: " + response.status);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// 7. Image Gen (Hugging Face)
async function generateImage(prompt) {
    if (!window.CONFIG || !window.CONFIG.HF_TOKEN) {
        throw new Error("Missing HF Token");
    }

    const hfToken = window.CONFIG.HF_TOKEN;
    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        headers: { "Authorization": "Bearer " + hfToken },
        method: "POST",
        body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) throw new Error("Image API Error");

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// 8. UI Messaging
function appendMessage(role, contentHTML, rawText) {
    if (emptyState && emptyState.parentNode) {
        emptyState.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.className = "message-wrapper " + role + "-msg";
    wrapper.innerHTML = '<div class="message-content">' + contentHTML + '</div>';

    chatStreamInner.appendChild(wrapper);

    setTimeout(function() {
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    }, 50);

    return wrapper;
}

function showThinking() {
    const html = '<div class="thinking-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    return appendMessage('ai', html, "");
}

// 9. Handle Action
async function handleAction(type) {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    appendMessage('user', text, text);
    const thinkingNode = showThinking();

    try {
        if (type === 'chat') {
            const res = await askGemini(text);
            thinkingNode.remove();
            appendMessage('ai', res.replace(/\n/g, '<br>'), res);
        } else {
            const imgUrl = await generateImage(text);
            thinkingNode.remove();
            
            // Image with Download Link
            const imgHTML = '<div class="generated-image-container">' +
                            '<img src="' + imgUrl + '" style="width:100%; border-radius:12px; margin-top:10px;">' +
                            '<a href="' + imgUrl + '" download="generated-image.png" class="download-link">Download Image</a>' +
                            '</div>';
            appendMessage('ai', imgHTML, "Image");
        }
    } catch (e) {
        console.error(e);
        thinkingNode.remove();
        showPopup("Service Error", "The AI rejected the request (Status 404/403). Please ensure 'Generative Language API' is enabled in your Google Cloud Console project.");
    }
}

// 10. Event Listeners
if (document.getElementById('sendBtn')) {
    document.getElementById('sendBtn').onclick = function() { handleAction('chat'); };
}
if (document.getElementById('imgGenBtn')) {
    document.getElementById('imgGenBtn').onclick = function() { handleAction('image'); };
}
if (userInput) {
    userInput.onkeydown = function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAction('chat');
        }
    };
}