// Initialize Icons
if (window.lucide) { lucide.createIcons(); }

const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const emptyState = document.getElementById('emptyState');

// Setup Chat Inner
let chatStreamInner = document.createElement('div');
chatStreamInner.className = 'chat-stream-inner';
if (chatBox) { chatBox.appendChild(chatStreamInner); }

// --- CHAT LOGIC (OPENROUTER) ---
async function askAI(prompt) {
    const apiKey = window.CONFIG?.GEMINI_KEY; // This now holds your OpenRouter Key
    if (!apiKey || apiKey.includes('actual_key')) throw new Error("API Key not found");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "google/gemini-2.0-flash-exp:free", // Best free model on OpenRouter
            "messages": [{ "role": "user", "content": prompt }]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Connection Error");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// --- IMAGE LOGIC (HUGGING FACE) ---
async function generateImage(prompt) {
    const hfToken = window.CONFIG?.HF_TOKEN; 
    if (!hfToken || hfToken.includes('actual_key')) throw new Error("Hugging Face Token not found");

    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        headers: { "Authorization": `Bearer ${hfToken}` },
        method: "POST",
        body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) throw new Error("Image API is busy or offline");

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

// UI Message Function
function appendMessage(role, content) {
    if (emptyState) emptyState.remove();
    const msg = document.createElement('div');
    msg.className = `message-wrapper ${role}-msg`;
    msg.innerHTML = `<div class="message-content">${content.replace(/\n/g, '<br>')}</div>`;
    chatStreamInner.appendChild(msg);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    return msg;
}

// --- MAIN ACTION HANDLER ---
async function handleAction(type) {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    appendMessage('user', text);
    
    // UI feedback based on button clicked
    const statusMsg = type === 'chat' ? 'Thinking...' : 'Generating image...';
    const thinking = appendMessage('ai', statusMsg);

    try {
        if (type === 'chat') {
            const aiRes = await askAI(text);
            thinking.remove();
            appendMessage('ai', aiRes);
        } else {
            // Image Generation Logic
            const imgUrl = await generateImage(text);
            thinking.remove();
            const imgHTML = `<div class="img-result">
                                <img src="${imgUrl}" style="width:100%; border-radius:12px; margin-top:10px; border: 1px solid #444;">
                                <a href="${imgUrl}" download="ai-image.png" style="display:block; text-align:center; color:#4a90e2; margin-top:8px; text-decoration:none; font-size:0.9rem;">⬇ Download Image</a>
                             </div>`;
            appendMessage('ai', imgHTML);
        }
    } catch (e) {
        thinking.innerHTML = `<div style="color:#ff6b6b; padding:10px; border:1px solid #ff6b6b; border-radius:8px;"><strong>Error:</strong> ${e.message}</div>`;
    }
}

// --- BUTTON LISTENERS ---
// Make sure these IDs match your buttons in index.html
document.getElementById('sendBtn')?.addEventListener('click', () => handleAction('chat'));
document.getElementById('imgGenBtn')?.addEventListener('click', () => handleAction('image'));

userInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAction('chat');
    }
});

// Sidebar & Theme logic
document.getElementById('themeToggle')?.addEventListener('click', () => document.body.classList.toggle('dark-mode'));
document.getElementById('menuBtn')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.toggle('collapsed'));

// Auto-hide welcome screen
window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('welcomeScreen')?.classList.add('hidden'), 2000);
});
