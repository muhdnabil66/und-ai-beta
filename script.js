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

// 5. Suggestion Button Logic
function fillInput(text) {
    if (userInput) {
        userInput.value = text;
        userInput.focus();
        handleAction('chat');
    }
}

// 6. Gemini API Logic (v1 Stable + 1.5-Flash)
async function askGemini(prompt) {
    if (!window.CONFIG || !window.CONFIG.GEMINI_KEY) {
        throw new Error("Missing API Key");
    }

    const key = window.CONFIG.GEMINI_KEY;
    // Using v1 (stable) instead of v1beta to avoid regional 404s
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + key;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        console.error("Google API detailed error:", errorJson);
        throw new Error("Status " + response.status);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// 7. Image Generation (Flux Schnell)
async function generateImage(prompt) {
    if (!window.CONFIG || !window.CONFIG.HF_TOKEN) {
        throw new Error("Missing HF Token");
    }

    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        headers: { "Authorization": "Bearer " + window.CONFIG.HF_TOKEN },
        method: "POST",
        body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) throw new Error("Image API rejected request");

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// 8. Message UI Functions
function appendMessage(role, contentHTML) {
    if (emptyState && emptyState.parentNode) {
        emptyState.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.className = "message-wrapper " + role + "-msg";
    wrapper.innerHTML = '<div class="message-content">' + contentHTML + '</div>';

    chatStreamInner.appendChild(wrapper);

    setTimeout(() => {
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    }, 50);

    return wrapper;
}

function showThinking() {
    const html = '<div class="thinking-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    return appendMessage('ai', html);
}

// 9. Main Action Handler
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
            const imgHTML = '<div class="img-container"><img src="' + imgUrl + '" style="width:100%; border-radius:12px; margin-top:10px;"><a href="' + imgUrl + '" download="ai-image.png" class="download-link" style="display:block; text-align:center; margin-top:5px; color:var(--primary-color); text-decoration:none; font-size:0.8rem;">Download Image</a></div>';
            appendMessage('ai', imgHTML);
        }
    } catch (e) {
        console.error("Detailed Error Object:", e);
        thinkingNode.remove();
        showPopup("Connection Error", "The AI service returned: " + e.message + ". Check your Google Cloud Console to ensure the 'Generative Language API' is enabled for this project.");
    }
}

// 10. Listeners
if (document.getElementById('sendBtn')) {
    document.getElementById('sendBtn').onclick = () => handleAction('chat');
}
if (document.getElementById('imgGenBtn')) {
    document.getElementById('imgGenBtn').onclick = () => handleAction('image');
}
if (userInput) {
    userInput.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAction('chat');
        }
    };
}
