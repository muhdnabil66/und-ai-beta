// Initialize Icons
if (window.lucide) { lucide.createIcons(); }

const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');
const emptyState = document.getElementById('emptyState');

let chatStreamInner = document.createElement('div');
chatStreamInner.className = 'chat-stream-inner';
if (chatBox) { chatBox.appendChild(chatStreamInner); }

// --- CHAT LOGIC (OPENROUTER) ---
async function askAI(prompt) {
    // The robot swaps this fake text for your REAL key only on the live site
    const apiKey = "INSERT_OPENROUTER_KEY_HERE"; 
    
    if (apiKey.includes("INSERT_OPENROUTER")) {
        throw new Error("API Key not injected yet. Please wait 1 minute for the build to finish.");
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

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Connection Error");
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// --- IMAGE LOGIC (HUGGING FACE) ---
async function generateImage(prompt) {
    // The robot swaps this fake text for your REAL token only on the live site
    const hfToken = "INSERT_HF_TOKEN_HERE"; 

    if (hfToken.includes("INSERT_HF")) {
        throw new Error("HF Token not injected.");
    }

    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
        headers: { "Authorization": `Bearer ${hfToken}` },
        method: "POST",
        body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) throw new Error("Hugging Face API rejected the token or is busy.");

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
    
    const statusMsg = type === 'chat' ? 'Thinking...' : 'Generating image...';
    const thinking = appendMessage('ai', statusMsg);

    try {
        if (type === 'chat') {
            const aiRes = await askAI(text);
            thinking.remove();
            appendMessage('ai', aiRes);
        } else {
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

document.getElementById('sendBtn')?.addEventListener('click', () => handleAction('chat'));
document.getElementById('imgGenBtn')?.addEventListener('click', () => handleAction('image'));

userInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAction('chat');
    }
});

document.getElementById('themeToggle')?.addEventListener('click', () => document.body.classList.toggle('dark-mode'));
document.getElementById('menuBtn')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.toggle('collapsed'));

window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('welcomeScreen')?.classList.add('hidden'), 2000);
});
