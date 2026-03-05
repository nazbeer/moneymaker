(function() {
  'use strict';

  const WIDGET_VERSION = '1.0.0';
  const DEFAULT_API_URL = 'https://healmind.app';

  class HealMindWidget {
    constructor(config) {
      this.apiKey = config.apiKey;
      this.apiUrl = config.apiUrl || DEFAULT_API_URL;
      this.position = config.position || 'bottom-right';
      this.theme = config.theme || 'light';
      this.primaryColor = config.primaryColor || '#7c3aed';
      this.title = config.title || 'Mental Health Support';
      this.subtitle = config.subtitle || 'How are you feeling today?';
      this.features = config.features || ['chat', 'mood', 'breathing'];
      this.isOpen = false;
      this.messages = [];
      this.container = null;

      this.init();
    }

    init() {
      this.injectStyles();
      this.createWidget();
      this.attachEventListeners();
    }

    injectStyles() {
      const style = document.createElement('style');
      style.id = 'healmind-widget-styles';
      style.textContent = `
        .hm-widget-container {
          position: fixed;
          z-index: 99999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .hm-widget-container.bottom-right { bottom: 20px; right: 20px; }
        .hm-widget-container.bottom-left { bottom: 20px; left: 20px; }

        .hm-trigger-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: ${this.primaryColor};
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .hm-trigger-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(124, 58, 237, 0.5);
        }
        .hm-trigger-btn svg {
          width: 28px;
          height: 28px;
        }

        .hm-panel {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 380px;
          height: 520px;
          background: ${this.theme === 'dark' ? '#1a1a2e' : '#ffffff'};
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          display: none;
          flex-direction: column;
          overflow: hidden;
          animation: hm-slide-up 0.3s ease;
        }
        .hm-panel.open { display: flex; }

        @keyframes hm-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hm-header {
          background: linear-gradient(135deg, ${this.primaryColor}, #4f46e5);
          color: white;
          padding: 16px 20px;
        }
        .hm-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
        .hm-header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; }

        .hm-tabs {
          display: flex;
          border-bottom: 1px solid ${this.theme === 'dark' ? '#333' : '#e5e7eb'};
          background: ${this.theme === 'dark' ? '#16213e' : '#f9fafb'};
        }
        .hm-tab {
          flex: 1;
          padding: 10px 8px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 12px;
          color: ${this.theme === 'dark' ? '#aaa' : '#6b7280'};
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .hm-tab.active {
          color: ${this.primaryColor};
          border-bottom-color: ${this.primaryColor};
          font-weight: 600;
        }

        .hm-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .hm-messages {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 100%;
        }

        .hm-msg {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
        }
        .hm-msg.user {
          align-self: flex-end;
          background: ${this.primaryColor};
          color: white;
          border-bottom-right-radius: 4px;
        }
        .hm-msg.assistant {
          align-self: flex-start;
          background: ${this.theme === 'dark' ? '#2a2a4a' : '#f3f4f6'};
          color: ${this.theme === 'dark' ? '#e5e7eb' : '#1f2937'};
          border-bottom-left-radius: 4px;
        }

        .hm-input-area {
          padding: 12px 16px;
          border-top: 1px solid ${this.theme === 'dark' ? '#333' : '#e5e7eb'};
          display: flex;
          gap: 8px;
        }
        .hm-input-area input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid ${this.theme === 'dark' ? '#444' : '#d1d5db'};
          border-radius: 24px;
          outline: none;
          font-size: 14px;
          background: ${this.theme === 'dark' ? '#1a1a2e' : '#fff'};
          color: ${this.theme === 'dark' ? '#fff' : '#000'};
        }
        .hm-input-area input:focus {
          border-color: ${this.primaryColor};
        }
        .hm-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: ${this.primaryColor};
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hm-mood-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin: 16px 0;
        }
        .hm-mood-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          border: 2px solid ${this.theme === 'dark' ? '#333' : '#e5e7eb'};
          border-radius: 12px;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 24px;
        }
        .hm-mood-btn:hover, .hm-mood-btn.selected {
          border-color: ${this.primaryColor};
          background: ${this.primaryColor}15;
        }
        .hm-mood-btn span { font-size: 11px; color: ${this.theme === 'dark' ? '#aaa' : '#6b7280'}; }

        .hm-breathing {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 20px;
        }
        .hm-breath-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${this.primaryColor}40, #4f46e540);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: ${this.primaryColor};
          font-weight: 600;
          animation: hm-breathe 8s ease-in-out infinite;
        }
        @keyframes hm-breathe {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(1.3); }
          75% { transform: scale(1); }
        }

        .hm-powered {
          text-align: center;
          padding: 8px;
          font-size: 11px;
          color: ${this.theme === 'dark' ? '#666' : '#9ca3af'};
          border-top: 1px solid ${this.theme === 'dark' ? '#333' : '#f3f4f6'};
        }
        .hm-powered a { color: ${this.primaryColor}; text-decoration: none; }
      `;
      document.head.appendChild(style);
    }

    createWidget() {
      this.container = document.createElement('div');
      this.container.className = 'hm-widget-container ' + this.position;
      this.container.innerHTML = `
        <div class="hm-panel" id="hm-panel">
          <div class="hm-header">
            <h3>${this.title}</h3>
            <p>${this.subtitle}</p>
          </div>
          <div class="hm-tabs">
            ${this.features.includes('chat') ? '<button class="hm-tab active" data-tab="chat">Chat</button>' : ''}
            ${this.features.includes('mood') ? '<button class="hm-tab" data-tab="mood">Mood</button>' : ''}
            ${this.features.includes('breathing') ? '<button class="hm-tab" data-tab="breathing">Breathe</button>' : ''}
          </div>
          <div class="hm-content" id="hm-content">
            <div class="hm-messages" id="hm-messages">
              <div class="hm-msg assistant">Hi! I'm here to support you. How are you feeling today?</div>
            </div>
          </div>
          <div id="hm-input-area" class="hm-input-area">
            <input type="text" id="hm-input" placeholder="Type a message..." />
            <button class="hm-send-btn" id="hm-send">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
          <div class="hm-powered">Powered by <a href="https://healmind.app" target="_blank">HealMind</a></div>
        </div>
        <button class="hm-trigger-btn" id="hm-trigger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a10 10 0 0 1-9.34-6.44L2 22l3.44-.66A10 10 0 0 1 12 2z"/>
            <path d="M8 12h.01M12 12h.01M16 12h.01"/>
          </svg>
        </button>
      `;
      document.body.appendChild(this.container);
    }

    attachEventListeners() {
      const trigger = document.getElementById('hm-trigger');
      const panel = document.getElementById('hm-panel');
      const input = document.getElementById('hm-input');
      const sendBtn = document.getElementById('hm-send');
      const tabs = this.container.querySelectorAll('.hm-tab');

      trigger.addEventListener('click', () => {
        this.isOpen = !this.isOpen;
        panel.classList.toggle('open', this.isOpen);
      });

      sendBtn.addEventListener('click', () => this.sendMessage());
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.switchTab(tab.dataset.tab);
        });
      });
    }

    switchTab(tab) {
      const content = document.getElementById('hm-content');
      const inputArea = document.getElementById('hm-input-area');

      if (tab === 'chat') {
        content.innerHTML = `<div class="hm-messages" id="hm-messages">
          ${this.messages.length === 0 ? '<div class="hm-msg assistant">Hi! I\'m here to support you. How are you feeling today?</div>' : ''}
          ${this.messages.map(m => `<div class="hm-msg ${m.role}">${this.escapeHtml(m.content)}</div>`).join('')}
        </div>`;
        inputArea.style.display = 'flex';
      } else if (tab === 'mood') {
        content.innerHTML = `
          <p style="text-align:center;color:#6b7280;margin-bottom:8px;font-size:14px;">How are you feeling right now?</p>
          <div class="hm-mood-grid">
            <button class="hm-mood-btn" data-mood="1">😢<span>Very Low</span></button>
            <button class="hm-mood-btn" data-mood="2">😔<span>Low</span></button>
            <button class="hm-mood-btn" data-mood="3">😐<span>Okay</span></button>
            <button class="hm-mood-btn" data-mood="4">🙂<span>Good</span></button>
            <button class="hm-mood-btn" data-mood="5">😊<span>Great</span></button>
          </div>
          <div id="hm-mood-result" style="text-align:center;margin-top:16px;"></div>
        `;
        inputArea.style.display = 'none';

        content.querySelectorAll('.hm-mood-btn').forEach(btn => {
          btn.addEventListener('click', () => this.logMood(parseInt(btn.dataset.mood)));
        });
      } else if (tab === 'breathing') {
        content.innerHTML = `
          <div class="hm-breathing">
            <div class="hm-breath-circle" id="hm-breath-text">Breathe In</div>
            <p style="color:#6b7280;font-size:13px;text-align:center;">Follow the circle. Breathe in as it expands, out as it contracts.</p>
          </div>
        `;
        inputArea.style.display = 'none';
        this.startBreathingGuide();
      }
    }

    startBreathingGuide() {
      const textEl = document.getElementById('hm-breath-text');
      if (!textEl) return;
      const phases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
      let i = 0;
      const interval = setInterval(() => {
        if (!document.getElementById('hm-breath-text')) {
          clearInterval(interval);
          return;
        }
        i = (i + 1) % phases.length;
        textEl.textContent = phases[i];
      }, 2000);
    }

    async sendMessage() {
      const input = document.getElementById('hm-input');
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      this.messages.push({ role: 'user', content: text });
      this.appendMessage('user', text);

      try {
        const res = await fetch(this.apiUrl + '/api/sdk/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.apiKey,
          },
          body: JSON.stringify({ message: text, history: this.messages.slice(-10) }),
        });
        const data = await res.json();
        if (data.message) {
          this.messages.push({ role: 'assistant', content: data.message });
          this.appendMessage('assistant', data.message);
        }
      } catch {
        this.appendMessage('assistant', 'I\'m having trouble connecting. Please try again.');
      }
    }

    appendMessage(role, content) {
      const messagesEl = document.getElementById('hm-messages');
      if (!messagesEl) return;
      const msg = document.createElement('div');
      msg.className = 'hm-msg ' + role;
      msg.textContent = content;
      messagesEl.appendChild(msg);
      const contentEl = document.getElementById('hm-content');
      contentEl.scrollTop = contentEl.scrollHeight;
    }

    async logMood(mood) {
      const resultEl = document.getElementById('hm-mood-result');
      const btns = this.container.querySelectorAll('.hm-mood-btn');
      btns.forEach(b => b.classList.remove('selected'));
      this.container.querySelector(`[data-mood="${mood}"]`).classList.add('selected');

      try {
        await fetch(this.apiUrl + '/api/sdk/mood', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.apiKey,
          },
          body: JSON.stringify({ mood }),
        });
        resultEl.innerHTML = '<p style="color:#10b981;font-weight:600;">Mood logged! Take care of yourself today.</p>';
      } catch {
        resultEl.innerHTML = '<p style="color:#ef4444;">Could not log mood. Try again.</p>';
      }
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    destroy() {
      if (this.container) {
        this.container.remove();
      }
      const style = document.getElementById('healmind-widget-styles');
      if (style) style.remove();
    }
  }

  // Expose globally
  window.HealMind = {
    init: function(config) {
      return new HealMindWidget(config);
    },
    version: WIDGET_VERSION,
  };
})();
