// Initialize Icons
lucide.createIcons();

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
chatBox.appendChild(chatStreamInner);

// 1. Sidebar Toggle
menuBtn.onclick = () => {
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('active');
    } else {
        sidebar.classList.toggle('collapsed');
    }
};

// 2. Theme Toggle
themeToggle.onclick = () => {
    document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode');
};

// 3. Welcome Screen Smooth Removal
window.onload = () => {
    setTimeout(() => {
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
    }, 2000); // 2 second showcase
};

// 4. Custom Popup Logic
function showPopup(title, message, onConfirm = null, showCancel = false) {
    const modal = document.getElementById('customModal');
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalClose');

    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    
    if(showCancel) {
        cancelBtn.classList.remove('hidden');
    } else {
        cancelBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');

    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm();
        modal.classList.add('hidden');
    };
    cancelBtn.onclick = () => modal.classList.add('hidden');
}

// Clear Chat Action
function clearChat() {
    chatStreamInner.innerHTML = '';
    if(!document.getElementById('emptyState') && emptyState) {
        chatBox.insertBefore(emptyState, chatBox.firstChild);
    }
}

function newChat() {
    clearChat();
    if (window.innerWidth <= 768) sidebar.classList.remove('active');
}

// 5. Fill Input from Suggestions
function fillInput(text) {
    userInput.value = text;
    userInput.focus();
    handleAction('chat');
}

// 6. Voice Recognition (Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        voiceBtn.style.color = "var(--accent)";
        userInput.placeholder = "Listening...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value += transcript;
    };

    recognition.onerror = (event) => {
        console.error("Speech error", event);
        showPopup("Voice Input Error", "Could not recognize speech. Please try again.");
    };

    recognition.onend = () => {
        voiceBtn.style.color = "var(--text-muted)";
        userInput.placeholder = "Message UND AI...";
    };

    voiceBtn.onclick = () => recognition.start();
} else {
    voiceBtn.onclick = () => showPopup("Unsupported", "Voice recognition is not supported in this browser.");
}

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// 7. API Logic (Gemini 1.5 Flash - Updated Reference)
async function askGemini(prompt) {
    // We reference window.CONFIG because that is where GitHub Actions injects the key
    const apiKey = window.CONFIG?.GEMINI_KEY;
    if (!apiKey) throw new Error("Missing API Key");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if(!response.ok) throw new Error("API Error");
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// 8. Image Gen (Hugging Face - Updated Reference)
async function generateImage(prompt) {
    const hfToken = window.CONFIG?.HF_TOKEN;
    if (!hfToken) throw new Error("Missing HF Token");

    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        headers: { Authorization: `Bearer ${hfToken}` },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
    });
    
    if(!response.ok) throw new Error("API Error");

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// 9. Message Handling UI
function appendMessage(role, contentHTML, rawText = "") {
    if (emptyState && emptyState.parentNode) {
        emptyState.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${role}-msg`;
    
    wrapper.innerHTML = `
        <div class="message-content">
            ${contentHTML}
        </div>
        <div class="msg-actions">
            <button class="action-btn copy-btn" title="Copy text">
                <i data-lucide="copy"></i>
            </button>
        </div>
    `;

    chatStreamInner.appendChild(wrapper);
    lucide.createIcons();

    const copyBtn = wrapper.querySelector('.copy-btn');
    copyBtn.onclick = () => {
        const textToCopy = rawText || wrapper.querySelector('.message-content').innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.innerHTML = `<i data-lucide="check" style="color: #10b981;"></i>`;
            lucide.createIcons();
            setTimeout(() => {
                copyBtn.innerHTML = `<i data-lucide="copy"></i>`;
                lucide.createIcons();
            }, 2000);
        });
    };

    setTimeout(() => {
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    }, 50);

    return wrapper;
}

function showThinking() {
    const thinkingHTML = `
        <div class="thinking-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    return appendMessage('ai', thinkingHTML);
}

// 10. Action Execution
async function handleAction(type) {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    userInput.style.height = 'auto';

    appendMessage('user', text, text);
    const thinkingNode = showThinking();

    try {
        if (type === 'chat') {
            const res = await askGemini(text);
            thinkingNode.remove();
            const formattedRes = res.replace(/\n/g, '<br>');
            appendMessage('ai', formattedRes, res);
            
        } else if (type === 'image') {
            const imgUrl = await generateImage(text);
            thinkingNode.remove();
            const imgHTML = `<img src="${imgUrl}" alt="Generated Image" style="width:100%; border-radius:12px; margin-top:10px;">`;
            appendMessage('ai', imgHTML, "Image Generated");
        }
    } catch (e) {
        console.error(e);
        thinkingNode.remove();
        showPopup("Service Error", "There was an issue connecting to the AI. Please verify your API keys are active in Google Cloud and Hugging Face.");
    }
}

// Listeners
document.getElementById('sendBtn').onclick = () => handleAction('chat');
document.getElementById('imgGenBtn').onclick = () => handleAction('image');
userInput.onkeydown = (e) => { 
    if(e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        handleAction('chat'); 
    }
};