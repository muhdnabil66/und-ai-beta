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

// 1. Sidebar Toggle Logic
if (menuBtn && sidebar) {
    menuBtn.onclick = function() {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    };
}

// 2. Theme Toggle (Dark/Light)
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

// 6. Gemini API Logic (v1beta for 1.5-Flash Support)
async function askGemini(prompt) {
    const apiKey = window.CONFIG?.GEMINI_KEY;
    if (!apiKey || apiKey.includes('actual_key')) {
        throw new Error("API Key is missing from config.js");
    }

    // UPDATED URL: Using v1beta and the correct model path to fix the 404 error
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        console.error("Google API Detailed Error:", errorJson);
        // Display the specific message from Google if available
        throw new Error(errorJson.error?.message || "Status " + response.status);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// 7. Image Generation (Flux Schnell)
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

    if (!response.ok) throw new Error("Image API Error: " + response.status);

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
            const imgHTML = '<div class="img-container">' +
                            '<img src="' + imgUrl + '" style="width:100%; border-radius:12px; margin-top:10px;">' +
                            '<a href="' + imgUrl + '" download="ai-image.png" class="download-link" style="display:block; text-align:center; margin-top:5px; color:#4a90e2; text-decoration:none; font-size:0.8rem;">Download Image</a>' +
                            '</div>';
            appendMessage('ai', imgHTML);
        }
    } catch (e) {
        console.error("Action Error:", e);
        thinkingNode.remove();
        showPopup("Service Error", e.message);
    }
}

// 10. Event Listeners
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
