/**
 * menubot — Menu-Based Chatbot Engine (Generic / Reusable)
 * ---------------------------------------------------------
 * محرك عام مش مربوط بمشروع معين. كل حاجة مربوطة بالمشروع
 * (النصوص، الألوان، الاتجاه) بتتحدد من data.json + theme.css.
 *
 * خيارات init():
 *   containerId   (مطلوب)  - id العنصر اللي هيتبنى فيه البوت
 *   dataUrl       (اختياري) - مسار ملف JSON
 *   data          (اختياري) - تمرير الداتا مباشرة بدل fetch
 *   mode          (اختياري) - "inline" | "floating"  (تلغي meta.mode لو موجودة)
 */

(function (global) {
  "use strict";

  class MenuBot {
    constructor(options) {
      this.containerId = options.containerId;
      this.dataUrl = options.dataUrl;
      this.data = options.data || null;
      this.modeOverride = options.mode || null;
      this.container = document.getElementById(this.containerId);

      if (!this.container) {
        console.error(`menubot: العنصر #${this.containerId} مش موجود في الصفحة.`);
        return;
      }

      this.currentNodeId = null;
      this.isBusy = false;
      this.isOpen = false;
    }

    async init() {
      try {
        if (!this.data) {
          const res = await fetch(this.dataUrl);
          if (!res.ok) throw new Error(`فشل تحميل ${this.dataUrl}: ${res.status}`);
          this.data = await res.json();
        }
        this.mode = this.modeOverride || this.data.meta.mode || "inline";
        this.direction = this.data.meta.direction || "rtl";
        this.floatCorner = this.data.meta.floatCorner || (this.direction === "rtl" ? "right" : "right");

        this._buildShell();
        this._start();
      } catch (err) {
        console.error("menubot init error:", err);
        if (this.container) {
          this.container.innerHTML =
            '<p style="color:#c0392b;font-family:sans-serif;">تعذر تحميل بيانات الشات بوت.</p>';
        }
      }
    }

    /* ---------------- بناء الهيكل ---------------- */
    _buildShell() {
      const meta = this.data.meta;
      const isFloating = this.mode === "floating";

      const panelHtml = `
        <div class="mb-chat-widget${isFloating ? " mb-floating mb-corner-" + this.floatCorner : ""}"
             id="${this.containerId}-panel" dir="${this.direction}"
             ${isFloating ? 'style="display:none;"' : ""}>
          <div class="mb-chat-header">
            <div class="mb-chat-avatar">${this._escape(meta.avatarInitial || "B")}</div>
            <div class="mb-chat-header-info">
              <span class="mb-chat-header-title">${this._escape(meta.botName || "المساعد")}</span>
              <span class="mb-chat-header-subtitle">${this._escape(meta.onlineLabel || "متاح دلوقتي")}</span>
            </div>
            ${isFloating ? '<button type="button" class="mb-chat-close" aria-label="إغلاق">×</button>' : ""}
          </div>
          <div class="mb-chat-messages" id="${this.containerId}-messages"></div>
          <div class="mb-chat-options" id="${this.containerId}-options"></div>
          ${
            meta.disclaimer
              ? `<div class="mb-chat-disclaimer">${this._escape(meta.disclaimer)}</div>`
              : ""
          }
        </div>
      `;

      if (isFloating) {
        this.container.innerHTML = `
          <button type="button" class="mb-launcher mb-corner-${this.floatCorner}" id="${this.containerId}-launcher" aria-label="فتح الشات">
            ${meta.launcherIcon ? this._escape(meta.launcherIcon) : "💬"}
          </button>
          ${panelHtml}
        `;
        this.launcherEl = document.getElementById(`${this.containerId}-launcher`);
        this.panelEl = document.getElementById(`${this.containerId}-panel`);
        this.launcherEl.addEventListener("click", () => this._toggleOpen());
        const closeBtn = this.panelEl.querySelector(".mb-chat-close");
        if (closeBtn) closeBtn.addEventListener("click", () => this._toggleOpen(false));
      } else {
        this.container.innerHTML = panelHtml;
        this.panelEl = document.getElementById(`${this.containerId}-panel`);
      }

      this.messagesEl = document.getElementById(`${this.containerId}-messages`);
      this.optionsEl = document.getElementById(`${this.containerId}-options`);
    }

    _toggleOpen(force) {
      this.isOpen = typeof force === "boolean" ? force : !this.isOpen;
      this.panelEl.style.display = this.isOpen ? "flex" : "none";
      this.panelEl.classList.toggle("mb-open", this.isOpen);
      if (this.isOpen) this._scrollToBottom();
    }

    /* ---------------- Public API للتحكم من بره الكلاس ---------------- */
    /** يفتح نافذة الشات بوت (لازم يكون mode = "floating") */
    open() {
      this._toggleOpen(true);
    }

    /** يقفل نافذة الشات بوت */
    close() {
      this._toggleOpen(false);
    }

    /** يفتح لو مقفول ويقفل لو مفتوح */
    toggle() {
      this._toggleOpen();
    }

    /* ---------------- بداية المحادثة ---------------- */
    _start() {
      const rootId = this.data.meta.rootNodeId || "main";
      this._goToNode(rootId, { skipUserBubble: true });
    }

    _goToNode(nodeId, opts = {}) {
      const node = this.data.nodes[nodeId];
      if (!node) {
        console.warn(`menubot: العقدة "${nodeId}" غير موجودة في البيانات.`);
        return;
      }
      this.currentNodeId = nodeId;
      this._clearOptions();

      const renderBotTurn = () => {
        this._addBubble(node.botMessage, "bot");
        this._renderOptionsForNode(node);
      };

      if (opts.skipUserBubble) {
        this._showTyping(renderBotTurn);
      } else {
        renderBotTurn();
      }
    }

    _renderOptionsForNode(node) {
      this._clearOptions();
      const meta = this.data.meta;

      if (node.type === "menu" && Array.isArray(node.options)) {
        node.options.forEach((opt) => {
          const btn = this._makeButton(opt.label, "mb-option-btn", () =>
            this._handleUserChoice(opt.label, opt.target)
          );
          this.optionsEl.appendChild(btn);
        });
      }

      if (node.cta) {
        const url = this._resolveTemplate(node.cta.url);
        const ctaBtn = document.createElement("a");
        ctaBtn.href = url;
        ctaBtn.target = "_blank";
        ctaBtn.rel = "noopener noreferrer";
        ctaBtn.className = "mb-option-btn mb-option-btn--cta";
        ctaBtn.textContent = node.cta.label;
        this.optionsEl.appendChild(ctaBtn);
      }

      const isRoot = this.currentNodeId === (meta.rootNodeId || "main");
      if (!isRoot) {
        if (node.parent) {
          const backBtn = this._makeButton(
            meta.backLabel || "⬅️ رجوع",
            "mb-option-btn mb-option-btn--nav",
            () => this._handleUserChoice(meta.backLabel || "⬅️ رجوع", node.parent, { silent: true })
          );
          this.optionsEl.appendChild(backBtn);
        }
        const homeBtn = this._makeButton(
          meta.homeLabel || "🏠 القائمة الرئيسية",
          "mb-option-btn mb-option-btn--nav",
          () =>
            this._handleUserChoice(meta.homeLabel || "🏠 القائمة الرئيسية", meta.rootNodeId || "main", {
              silent: true,
            })
        );
        this.optionsEl.appendChild(homeBtn);
      }
    }

    _handleUserChoice(label, targetId) {
      if (this.isBusy) return;
      this._addBubble(label, "user");
      this._clearOptions();
      this._showTyping(() => {
        const node = this.data.nodes[targetId];
        if (!node) return;
        this.currentNodeId = targetId;
        this._addBubble(node.botMessage, "bot");
        this._renderOptionsForNode(node);
      });
    }

    /* ---------------- Helpers ---------------- */
    _addBubble(text, sender) {
      const bubble = document.createElement("div");
      bubble.className = `mb-bubble mb-bubble--${sender}`;
      bubble.textContent = text;
      this.messagesEl.appendChild(bubble);
      this._scrollToBottom();
    }

    _showTyping(callback) {
      this.isBusy = true;
      const typingEl = document.createElement("div");
      typingEl.className = "mb-typing";
      typingEl.innerHTML = "<span></span><span></span><span></span>";
      this.messagesEl.appendChild(typingEl);
      this._scrollToBottom();

      const delay = this.data.meta.typingDelayMs ?? 600;
      setTimeout(() => {
        typingEl.remove();
        callback();
        this.isBusy = false;
      }, delay);
    }

    _makeButton(label, className, onClick) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = className;
      btn.textContent = label;
      btn.addEventListener("click", onClick);
      return btn;
    }

    _clearOptions() {
      this.optionsEl.innerHTML = "";
    }

    _scrollToBottom() {
      requestAnimationFrame(() => {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      });
    }

    _resolveTemplate(str) {
      if (typeof str !== "string") return str;
      return str.replace(/\{\{(\w+)\}\}/g, (_, key) => this.data.meta[key] ?? "");
    }

    _escape(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }
  }

  global.MenuBot = {
    init(options) {
      const bot = new MenuBot(options);
      bot.init();
      return bot;
    },
  };
})(window);

// عشان يشتغل مع import في Vite / ES Modules
export const MenuBot = window.MenuBot;
