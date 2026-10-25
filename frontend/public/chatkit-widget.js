
(function () {
  "use strict";

  // Read configuration from the embed script.
  const script = document.currentScript;

  if (!script) {
    console.error("ChatKit: unable to identify the embed script.");
    return;
  }

  const tenantId = script.dataset.tenantId;
  const widgetKey = script.dataset.widgetKey;
  const apiBase = (
    script.dataset.apiBase || "https://chatkit-ai-v2.onrender.com"
  ).replace(/\/+$/, "");

  if (!tenantId || !widgetKey) {
    console.error(
      "ChatKit: data-tenant-id and data-widget-key are required."
    );
    return;
  }

  // Generate or reuse a visitor ID for this tenant.
  const storageKey = `chatkit_visitor_${tenantId}`;

  function createVisitorId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (char) {
        const random = Math.floor(Math.random() * 16);
        const value =
          char === "x" ? random : (random & 0x3) | 0x8;

        return value.toString(16);
      }
    );
  }

  function getVisitorId() {
    try {
      let id = localStorage.getItem(storageKey);

      if (!id) {
        id = createVisitorId();
        localStorage.setItem(storageKey, id);
      }

      return id;
    } catch (error) {
      return createVisitorId();
    }
  }

  const visitorId = getVisitorId();

  const state = {
    token: null,
    chatId: null,
    started: false,
    starting: false,
    sending: false,
    faqs: [],
  };

  // --------------------------------------------------
  // API helper
  // --------------------------------------------------

  async function request(path, options, token) {
    options = options || {};

    const headers = new Headers(options.headers || {});

    if (options.body) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", "Bearer " + token);
    }

    let response;

    try {
      response = await fetch(apiBase + path, {
        ...options,
        headers: headers,
      });
    } catch (error) {
      const networkError = new Error(
        "Unable to connect to the chat service. Please try again."
      );

      networkError.status = 0;
      throw networkError;
    }

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      const detail =
        typeof data.detail === "string"
          ? data.detail
          : typeof data.message === "string"
            ? data.message
            : "Request failed (HTTP " + response.status + ")";

      const error = new Error(detail);
      error.status = response.status;

      throw error;
    }

    return data;
  }

  // --------------------------------------------------
  // Obtain widget JWT
  // --------------------------------------------------

  async function createWidgetToken() {
    const result = await request(
      "/tenants/create_widget_token",
      {
        method: "POST",
        body: JSON.stringify({
          tenant_id: tenantId,
          widget_key: widgetKey,
          user_id: visitorId,
        }),
      }
    );

    if (!result.widget_token) {
      throw new Error("The server did not return a widget token.");
    }

    state.token = result.widget_token;

    return state.token;
  }

  // --------------------------------------------------
  // Widget styles
  // --------------------------------------------------

  const style = document.createElement("style");

  style.textContent = `
    .ck-root, .ck-root * {
      box-sizing: border-box;
      font-family: Inter, system-ui, -apple-system,
        BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .ck-launcher {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 2147483000;
      border: 0;
      border-radius: 999px;
      padding: 15px 21px;
      background: #4f46e5;
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 24px #0002;
    }

    .ck-panel {
      position: fixed;
      right: 24px;
      bottom: 88px;
      z-index: 2147483000;
      display: none;
      flex-direction: column;
      width: min(370px, calc(100vw - 32px));
      height: min(540px, calc(100dvh - 120px));
      min-height: 320px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      background: white;
      box-shadow: 0 12px 45px #0002;
    }

    .ck-panel.ck-open {
      display: flex;
    }

    .ck-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      color: white;
      background: #4f46e5;
    }

    .ck-header-title {
      font-size: 16px;
      font-weight: 700;
    }

    .ck-header-subtitle {
      margin-top: 3px;
      font-size: 12px;
      opacity: .85;
    }

    .ck-close {
      border: 0;
      background: transparent;
      color: white;
      font-size: 24px;
      cursor: pointer;
    }

    .ck-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
    }

    .ck-message {
      width: fit-content;
      max-width: 88%;
      margin: 0 0 10px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }

    .ck-bot {
      margin-right: auto;
      background: white;
      border: 1px solid #e5e7eb;
      color: #111827;
    }

    .ck-user {
      margin-left: auto;
      background: #4f46e5;
      color: white;
    }


    .ck-faqs {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 12px 0 14px;
      width: 100%;
    }

    .ck-faq-item {
      overflow: hidden;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
    }

    .ck-faq-question {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      width: 100%;
      padding: 11px 12px;
      border: 0;
      background: #fff;
      color: #3730a3;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.45;
      text-align: left;
      cursor: pointer;
    }

    .ck-faq-question:hover {
      background: #eef2ff;
    }

    .ck-faq-question:focus-visible {
      outline: 2px solid #6366f1;
      outline-offset: -2px;
    }

    .ck-faq-chevron {
      flex-shrink: 0;
      font-size: 16px;
      transition: transform 0.2s ease;
    }

    .ck-faq-question[aria-expanded="true"] .ck-faq-chevron {
      transform: rotate(180deg);
    }

    .ck-faq-answer {
      padding: 0 12px 12px;
      color: #374151;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }


    .ck-status {
      padding: 5px 14px;
      color: #b91c1c;
      background: white;
      font-size: 12px;
    }

    .ck-composer {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      background: white;
    }

    .ck-input {
      flex: 1;
      min-width: 0;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 11px;
      font-size: 14px;
      outline: none;
    }

    .ck-input:focus {
      border-color: #6366f1;
    }

    .ck-send {
      border: 0;
      border-radius: 10px;
      padding: 0 14px;
      background: #4f46e5;
      color: white;
      font-weight: 600;
      cursor: pointer;
    }

    .ck-send:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    @media (max-width: 480px) {
      .ck-launcher {
        right: 16px;
        bottom: 16px;
      }

      .ck-panel {
        right: 8px;
        bottom: 76px;
        width: calc(100vw - 16px);
        height: min(620px, calc(100dvh - 96px));
      }
    }
  `;

  document.head.appendChild(style);

  // --------------------------------------------------
  // Create widget interface
  // --------------------------------------------------

  const root = document.createElement("div");
  root.className = "ck-root";

  const launcher = document.createElement("button");
  launcher.className = "ck-launcher";
  launcher.type = "button";
  launcher.textContent = "Chat with us";
  launcher.setAttribute("aria-label", "Open chat");

  const panel = document.createElement("section");
  panel.className = "ck-panel";
  panel.setAttribute("aria-label", "ChatKit chat");

  const header = document.createElement("div");
  header.className = "ck-header";

  const heading = document.createElement("div");

  const title = document.createElement("div");
  title.className = "ck-header-title";
  title.textContent = "Chat with us";

  const subtitle = document.createElement("div");
  subtitle.className = "ck-header-subtitle";
  subtitle.textContent = "We're here to help";

  heading.append(title, subtitle);

  const closeButton = document.createElement("button");
  closeButton.className = "ck-close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Close chat");

  header.append(heading, closeButton);

  const messages = document.createElement("div");
  messages.className = "ck-messages";
  messages.setAttribute("aria-live", "polite");

  const status = document.createElement("div");
  status.className = "ck-status";
  status.setAttribute("role", "status");

  const composer = document.createElement("form");
  composer.className = "ck-composer";

  const input = document.createElement("input");
  input.className = "ck-input";
  input.type = "text";
  input.placeholder = "Type your message...";
  input.autocomplete = "off";
  input.maxLength = 4000;
  input.setAttribute("aria-label", "Your message");
  input.required = true;

  const sendButton = document.createElement("button");
  sendButton.className = "ck-send";
  sendButton.type = "submit";
  sendButton.textContent = "Send";

  composer.append(input, sendButton);
  panel.append(header, messages, status, composer);
  root.append(launcher, panel);

  document.body.appendChild(root);

  // --------------------------------------------------
  // UI helpers
  // --------------------------------------------------

  function addMessage(sender, text) {
    const element = document.createElement("div");

    element.className =
      "ck-message " +
      (sender === "user" ? "ck-user" : "ck-bot");

    // Do not render user/API text as HTML.
    element.textContent = String(text == null ? "" : text);

    messages.appendChild(element);
    messages.scrollTop = messages.scrollHeight;
  }

  function setStatus(text) {
    status.textContent = text || "";
  }

  function setBusy(busy) {
    state.sending = busy;
    input.disabled = busy;
    sendButton.disabled = busy;
    sendButton.textContent = busy ? "..." : "Send";
  }


  function normalizeFaqs(faqs) {
    const normalized = [];

    function addFaq(question, answer) {
      if (typeof question !== "string") return;

      const cleanQuestion = question.trim();
      const cleanAnswer =
        typeof answer === "string" ? answer.trim() : "";

      if (!cleanQuestion || !cleanAnswer) return;

      normalized.push({
        question: cleanQuestion,
        answer: cleanAnswer,
      });
    }

    if (Array.isArray(faqs)) {
      faqs.forEach(function (item) {
        if (!item || typeof item !== "object") return;

        // Modern format: { question: "...", answer: "..." }
        if (typeof item.question === "string") {
          addFaq(item.question, item.answer);
          return;
        }

        // Alternate format: { q: "...", a: "..." }
        if (typeof item.q === "string") {
          addFaq(item.q, item.a || item.answer);
          return;
        }

        // Legacy format: { "Question": "Answer" }
        Object.keys(item).forEach(function (question) {
          if (typeof item[question] === "string") {
            addFaq(question, item[question]);
          }
        });
      });
    } else if (faqs && typeof faqs === "object") {
      Object.keys(faqs).forEach(function (question) {
        const answer = faqs[question];

        if (typeof answer === "string") {
          addFaq(question, answer);
        } else if (answer && typeof answer === "object") {
          addFaq(
            answer.question || question,
            answer.answer
          );
        }
      });
    }

    // Remove duplicate questions without losing their answers.
    const unique = new Map();

    normalized.forEach(function (faq) {
      unique.set(faq.question, faq.answer);
    });

    return Array.from(unique.entries()).map(function (entry) {
      return {
        question: entry[0],
        answer: entry[1],
      };
    });
  }

  function renderFaqs() {
    if (!state.faqs.length) return;

    const container = document.createElement("div");
    container.className = "ck-faqs";
    container.setAttribute("aria-label", "Frequently asked questions");

    state.faqs.forEach(function (faq, index) {
      const item = document.createElement("div");
      item.className = "ck-faq-item";

      const questionButton = document.createElement("button");
      questionButton.className = "ck-faq-question";
      questionButton.type = "button";
      questionButton.setAttribute("aria-expanded", "false");

      const answerId =
        "ck-faq-answer-" +
        String(index) +
        "-" +
        visitorId.replace(/[^a-zA-Z0-9_-]/g, "");

      questionButton.setAttribute("aria-controls", answerId);

      const questionText = document.createElement("span");
      questionText.textContent = faq.question;

      const chevron = document.createElement("span");
      chevron.className = "ck-faq-chevron";
      chevron.textContent = "⌄";
      chevron.setAttribute("aria-hidden", "true");

      questionButton.append(questionText, chevron);

      const answer = document.createElement("div");
      answer.className = "ck-faq-answer";
      answer.id = answerId;
      answer.hidden = true;

      // Use textContent so FAQ content is never interpreted as HTML.
      answer.textContent = faq.answer;

      questionButton.addEventListener("click", function () {
        const isExpanded =
          questionButton.getAttribute("aria-expanded") === "true";

        questionButton.setAttribute(
          "aria-expanded",
          String(!isExpanded)
        );

        answer.hidden = isExpanded;
      });

      item.append(questionButton, answer);
      container.appendChild(item);
    });

    messages.appendChild(container);
    messages.scrollTop = messages.scrollHeight;
  }


  // --------------------------------------------------
  // Start chat session
  // --------------------------------------------------

  async function startChat() {
    if (state.started) return true;
    if (state.starting) return false;

    state.starting = true;
    setStatus("Connecting...");

    try {
      await createWidgetToken();

      const result = await request(
        "/chat_session/start",
        {
          method: "POST",
          body: JSON.stringify({
            tenant_id: tenantId,
            user_info: {
              source: "website",
            },
          }),
        },
        state.token
      );

      if (!result.chat_id) {
        throw new Error(
          "The server did not return a chat session ID."
        );
      }

      state.chatId = result.chat_id;
      state.faqs = normalizeFaqs(result.faqs);
      state.started = true;

      setStatus("");

      addMessage(
        "bot",
        result.welcome_message ||
          "Hello! How can I help you today?"
      );

      renderFaqs();

      return true;
    } catch (error) {
      console.error("ChatKit start failed:", error);

      setStatus(
        error.message || "Unable to start chat. Please try again."
      );

      return false;
    } finally {
      state.starting = false;
    }
  }

  // --------------------------------------------------
  // Send a message
  // --------------------------------------------------

  async function sendMessage(text) {
    const value = String(text || "").trim();

    if (!value || state.sending) return;

    if (value.length > 4000) {
      setStatus("Please keep your message under 4000 characters.");
      return;
    }

    if (!state.started) {
      const started = await startChat();
      if (!started) return;
    }

    if (!state.chatId) return;

    setStatus("");
    addMessage("user", value);

    input.value = "";
    setBusy(true);
    setStatus("Thinking...");

    try {
      async function submitMessage() {
        return request(
          "/chat_session/" +
            encodeURIComponent(state.chatId) +
            "/message",
          {
            method: "POST",
            body: JSON.stringify({
              text: value,
            }),
          },
          state.token
        );
      }

      let result;

      try {
        result = await submitMessage();
      } catch (error) {
        // Refresh the token once if it has expired.
        if (error.status !== 401) {
          throw error;
        }

        await createWidgetToken();
        result = await submitMessage();
      }

      addMessage(
        "bot",
        result.text || "I couldn't generate a response."
      );

      setStatus("");
    } catch (error) {
      console.error("ChatKit message failed:", error);

      setStatus(
        error.message || "Message failed. Please try again."
      );
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  // --------------------------------------------------
  // Event listeners
  // --------------------------------------------------

  launcher.addEventListener("click", async function () {
    panel.classList.add("ck-open");
    launcher.style.display = "none";

    if (!state.started) {
      await startChat();
    }

    input.focus();
  });

  closeButton.addEventListener("click", function () {
    panel.classList.remove("ck-open");
    launcher.style.display = "";
  });

  composer.addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(input.value);
  });
})();