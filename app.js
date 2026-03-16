/**
 * Hypnosis AI - Application Logic
 * Handles View Switching, Mock Chat, and Character Building Interactions.
 */

class App {
    constructor() {
        this.currentView = 'landing';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Avatar Style Selector
        const avatarBtns = document.querySelectorAll('.avatar-btn');
        avatarBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                avatarBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show target view
        const targetView = document.getElementById(`view-${viewName}`);
        if(targetView) {
            // small delay for transition
            setTimeout(() => {
                targetView.classList.add('active');
            }, 50);
        }
        
        this.currentView = viewName;
        window.scrollTo(0,0);
    }

    triggerSubscription() {
        // In a real app, this calls Stripe Checkout
        alert("Redirecting to Stripe Checkout for $12.99/mo...");
    }

    selectGuide(name) {
        // Update Sidebar UI
        document.querySelectorAll('.guide-item').forEach(item => {
            item.classList.remove('active');
            if(item.querySelector('h4').innerText === name) {
                item.classList.add('active');
            }
        });

        // Update Chat Header
        document.getElementById('current-guide-name').innerText = name;
        
        // Reset Chat (Mock)
        const chatMsgs = document.getElementById('chat-messages');
        chatMsgs.innerHTML = `
            <div class="message assistant">
                <div class="msg-bubble">
                    Hello again. I'm ${name}. How can I assist your rest today?
                    <button class="play-audio-btn" aria-label="Play audio"><i class="ri-play-circle-line"></i></button>
                </div>
            </div>
        `;
    }

    async createCharacter() {
        const name = document.getElementById('char-name').value;
        const submitBtn = document.querySelector('#builder-form button[type="submit"]');
        const previewImg = document.getElementById('avatar-preview-img');
        const saveBtn = document.getElementById('save-guide-btn');
        
        // UI Loading State
        submitBtn.innerHTML = '<i class="ri-loader-4-line"></i> Generating...';
        submitBtn.disabled = true;
        
        previewImg.innerHTML = '';
        previewImg.classList.add('shimmer');

        // Update Preview Text
        document.getElementById('preview-name').innerText = name;
        document.getElementById('preview-traits').innerText = "Generating custom identity...";

        try {
            const falApiKey = "dd8c0597-13df-42ec-b7f0-e50bb8484ad1:409aafcb9b653170edd20e7c2cdc3609";
            
            // Get selected style and traits
            const style = document.querySelector('.avatar-btn.active').dataset.style;
            const personality = document.getElementById('char-personality').options[document.getElementById('char-personality').selectedIndex].text;
            
            const prompt = `A serene and peaceful ${style} meditation guide, ${personality} vibe, ethereal glow, highly detailed, photorealistic, safe for work, soft lighting, portrait`;
            
            const response = await fetch("https://api.fal.ai/v1/text-to-image", {
                method: "POST",
                headers: {
                    "Authorization": `Key ${falApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "prompt": prompt,
                    "model_name": "stable-diffusion-xl",
                    "num_images": 1,
                    "image_size": "square"
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const imageUrl = data.images[0].url;

            // Update UI
            submitBtn.innerHTML = 'Generate Character Avatar';
            submitBtn.disabled = false;
            
            previewImg.classList.remove('shimmer');
            previewImg.innerHTML = `<img src="${imageUrl}" class="fade-in" alt="Generated Guide Avatar">`;
            
            document.getElementById('preview-traits').innerText = "Identity established successfully.";
            saveBtn.classList.remove('hidden');
            
            // Add to sidebar list
            this.addGuideToSidebar(name, imageUrl);

        } catch (error) {
            console.error("Error generating avatar:", error);
            submitBtn.innerHTML = 'Generate Character Avatar';
            submitBtn.disabled = false;
            previewImg.classList.remove('shimmer');
            previewImg.innerHTML = `<i class="ri-error-warning-line placeholder" style="color:#ff6b6b"></i>`;
            document.getElementById('preview-traits').innerText = "Generation failed. Check API key limits.";
        }
    }

    addGuideToSidebar(name, imageUrl) {
        const ul = document.getElementById('guide-list');
        const li = document.createElement('li');
        li.className = 'guide-item';
        li.onclick = () => this.selectGuide(name);
        li.innerHTML = `
            <div class="guide-avatar"><img src="${imageUrl || 'https://images.unsplash.com/photo-1518596644265-27a3d3c7c252?auto=format&fit=crop&q=80&w=150'}" alt="${name}"></div>
            <div class="guide-info">
                <h4>${name}</h4>
                <span>Custom Guide</span>
            </div>
        `;
        ul.appendChild(li);
    }

    async generateAndPlayAudio(text, buttonElement) {
        try {
            // Updated to visual loading state
            const originalHtml = buttonElement.innerHTML;
            buttonElement.innerHTML = '<i class="ri-loader-4-line shimmer"></i>';
            buttonElement.disabled = true;

            const elevenLabsApiKey = "334c20358414cb90ddab7618992f304ba50d824a3bb2c1a474044b28547490e3";
            const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
            
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: "POST",
                headers: {
                    "xi-api-key": elevenLabsApiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });

            if (!response.ok) {
                throw new Error("ElevenLabs API error: " + response.status);
            }

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
            
            buttonElement.innerHTML = '<i class="ri-volume-up-line"></i>';
            audio.onended = () => {
                buttonElement.innerHTML = originalHtml;
                buttonElement.disabled = false;
            };

        } catch (error) {
            console.error("Audio generation failed:", error);
            buttonElement.innerHTML = '<i class="ri-error-warning-line" style="color:#ff6b6b"></i>';
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if(!text) return;

        const chatMsgs = document.getElementById('chat-messages');

        // Add User Message
        const userHtml = `
            <div class="message user">
                <div class="msg-bubble">${text}</div>
            </div>
        `;
        chatMsgs.insertAdjacentHTML('beforeend', userHtml);
        input.value = '';

        // Auto scroll
        chatMsgs.scrollTop = chatMsgs.scrollHeight;

        // Show thinking indicator
        const typingId = "typing-" + Date.now();
        const typingHtml = `
            <div class="message assistant" id="${typingId}">
                <div class="msg-bubble"><i class="ri-loader-4-line shimmer" style="display:inline-block; animation: spin 1s linear infinite;"></i> <em>Connecting...</em></div>
            </div>
        `;
        chatMsgs.insertAdjacentHTML('beforeend', typingHtml);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;

        try {
            const togetherApiKey = "tgp_v1_L6Fbnz1RWmtG9N7_SPBegzgy5UVrfzYet8XI8VbpdoE";
            const guideName = document.getElementById('current-guide-name').innerText || "Guide";
            
            const response = await fetch("https://api.together.xyz/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${togetherApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "meta-llama/Llama-3-70b-chat-hf",
                    "messages": [
                        {
                            "role": "system",
                            "content": `You are ${guideName}, a calming, hypnotic, and personal meditation and sleep guide. Keep responses soothing, brief (1-3 sentences max), and focused on relaxation or hypnosis. Never break character. Never mention you are an AI.`
                        },
                        {
                            "role": "user",
                            "content": text
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 150
                })
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const llmResponse = data.choices[0].message.content.trim();
            
            // Remove typing indicator
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();

            const messageId = "msg-" + Date.now();
            const botHtml = `
                <div class="message assistant">
                    <div class="msg-bubble">
                        ${llmResponse}
                        <button class="play-audio-btn" id="${messageId}" aria-label="Play audio" onclick="app.generateAndPlayAudio('${llmResponse.replace(/'/g, "\\'")}', this)">
                            <i class="ri-play-circle-line"></i>
                        </button>
                    </div>
                </div>
            `;
            chatMsgs.insertAdjacentHTML('beforeend', botHtml);
            chatMsgs.scrollTop = chatMsgs.scrollHeight;
            
            // Auto-play the audio
            const playBtn = document.getElementById(messageId);
            this.generateAndPlayAudio(llmResponse, playBtn);

        } catch (error) {
            console.error("Together AI Error:", error);
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            
            const errorHtml = `
                <div class="message assistant">
                    <div class="msg-bubble" style="color:#ff6b6b">
                        I lost my connection to the ethereal plane. Let's try again in a moment.
                    </div>
                </div>
            `;
            chatMsgs.insertAdjacentHTML('beforeend', errorHtml);
            chatMsgs.scrollTop = chatMsgs.scrollHeight;
        }
    }
}

// Initialize Application
const app = new App();
