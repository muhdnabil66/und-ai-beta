window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('welcomeScreen')?.classList.add('hidden'), 1500);
});
if (window.lucide) lucide.createIcons();

const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');

menuBtn?.addEventListener('click', () => sidebar.classList.toggle('active'));

async function askAI(prompt) {
    // This placeholder stays here for your GitHub Action to replace
    const apiKey = "INSERT_OPENROUTER_KEY_HERE"; 

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
    if (!response.ok) throw new Error(data.error?.message || "Connection Failed");
    return data.choices[0].message.content;
}

async function handleChat() {
    const text = userInput.value.trim();
    if (!text) return;
    userInput.value = '';

    const userMsg = document.createElement('div');
    userMsg.className = 'message-wrapper user-msg';
    userMsg.innerHTML = `<div class="message-content">${text}</div>`;
    chatBox.appendChild(userMsg);

    const aiMsg = document.createElement('div');
    aiMsg.className = 'message-wrapper ai-msg';
    aiMsg.innerHTML = `<div class="message-content">Thinking...</div>`;
    chatBox.appendChild(aiMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await askAI(text);
        aiMsg.querySelector('.message-content').innerText = res;
    } catch (e) {
        aiMsg.querySelector('.message-content').innerHTML = `<span style="color:#ff6b6b">Error: ${e.message}</span>`;
    }
}

document.getElementById('sendBtn').addEventListener('click', handleChat);
userInput.addEventListener('keydown', (e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } });