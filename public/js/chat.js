/* Quantum Yapper 2.0 — Client Chat Engine */
(function () {
  "use strict";

  // ── Constants ──
  const MAX_MSG_LENGTH = 2000;
  const MAX_DOM_MESSAGES = 300;
  const TYPING_TIMEOUT_MS = 2000;
  const RECONNECT_BTN_MS = 5000;

  // ── Wait for DOM + libs ──
  function boot() {
    if (typeof Qs === "undefined" || typeof io === "undefined") {
      return setTimeout(boot, 50);
    }
    init();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  function init() {
    // ── Parse query params ──
    const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });
    if (!username || !room) {
      location.href = "/";
      return;
    }

    // ── Save session ──
    try {
      sessionStorage.setItem("qy_user", username);
      sessionStorage.setItem("qy_room", room);
    } catch (_) {}

    // ── Socket ──
    const socket = io();

    // ── DOM refs ──
    const $messages = document.getElementById("messages");
    const $form = document.getElementById("message-form");
    const $input = document.getElementById("message-input");
    const $sendBtn = document.getElementById("send-btn");
    const $locBtn = document.getElementById("send-location");
    const $scrollFab = document.getElementById("scroll-fab");
    const $toast = document.getElementById("toast");
    const $sidebar = document.getElementById("sidebar");
    const $sidebarOverlay = document.getElementById("sidebar-overlay");
    const $sidebarToggle = document.getElementById("sidebar-toggle");
    const $headerRoom = document.getElementById("header-room");
    const $headerUsers = document.getElementById("header-users");
    const $typingIndicator = document.getElementById("typing-indicator");
    const $typingText = document.getElementById("typing-text");
    const tpl = document.getElementById("message-template");
    const sidebarTpl = document.getElementById("sidebar-template");

    let isUserNearBottom = true;
    let typingTimer = null;
    let isTyping = false;
    let toastTimer = null;

    // ── Toast notifications (replaces alert()) ──
    function showToast(msg, type) {
      $toast.textContent = msg;
      $toast.className = "toast visible" + (type ? " toast--" + type : "");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { $toast.classList.remove("visible"); }, 3500);
    }

    // ── Time formatting (replaces Moment.js) ──
    function formatTime(ts) {
      return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(ts));
    }

    // ── URL auto-linking ──
    function linkify(text) {
      const urlRe = /((https?:\/\/)[^\s<]+)/gi;
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return escaped.replace(urlRe, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    // ── Auto-scroll logic ──
    function checkIfNearBottom() {
      const threshold = 80;
      isUserNearBottom = ($messages.scrollHeight - $messages.scrollTop - $messages.clientHeight) < threshold;
      $scrollFab.classList.toggle("visible", !isUserNearBottom);
    }

    function scrollToBottom(smooth) {
      $messages.scrollTo({
        top: $messages.scrollHeight,
        behavior: smooth ? "smooth" : "instant"
      });
      $scrollFab.classList.remove("visible");
      isUserNearBottom = true;
    }

    $messages.addEventListener("scroll", checkIfNearBottom, { passive: true });
    $scrollFab.addEventListener("click", () => scrollToBottom(true));

    // ── DOM culling (prevents memory leak) ──
    function cullOldMessages() {
      while ($messages.children.length > MAX_DOM_MESSAGES) {
        $messages.removeChild($messages.firstElementChild);
      }
    }

    // ── Render a message ──
    function renderMessage(data) {
      const clone = tpl.content.cloneNode(true);
      const row = clone.querySelector(".message");
      const bubble = clone.querySelector(".message__bubble");
      const nameEl = clone.querySelector(".message__name");
      const textEl = clone.querySelector(".message__text");
      const metaEl = clone.querySelector(".message__meta");

      const isSelf = data.username.toLowerCase() === username.toLowerCase();
      const isSystem = data.username === "System" || data.username === "Admin";

      if (isSystem) {
        row.classList.add("message--system");
      } else if (isSelf) {
        row.classList.add("message--self");
      } else {
        row.classList.add("message--other");
      }

      nameEl.textContent = data.username;
      metaEl.textContent = formatTime(data.createdAt);

      if (data.url) {
        textEl.innerHTML = '<a href="' + data.url + '" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-location-dot"></i> Shared Location</a>';
      } else {
        textEl.innerHTML = linkify(data.text || "");
      }

      $messages.appendChild(clone);
      cullOldMessages();

      if (isUserNearBottom) {
        scrollToBottom(false);
      } else {
        $scrollFab.classList.add("visible");
      }
    }

    // ── Sidebar rendering ──
    function renderSidebar(data) {
      const clone = sidebarTpl.content.cloneNode(true);
      clone.querySelector(".room-name").textContent = data.room;

      const ul = clone.querySelector(".users");
      data.users.forEach((u) => {
        const li = document.createElement("li");
        li.textContent = u.username;
        ul.appendChild(li);
      });

      $sidebar.innerHTML = "";
      $sidebar.appendChild(clone);

      // Re-bind leave button
      const leaveBtn = $sidebar.querySelector("#leave-room-btn");
      if (leaveBtn) {
        leaveBtn.addEventListener("click", () => {
          socket.disconnect();
          location.href = "/";
        });
      }

      // Update mobile header
      if ($headerRoom) $headerRoom.textContent = data.room;
      if ($headerUsers) $headerUsers.textContent = data.users.length + " online";
    }

    // ── Textarea auto-resize ──
    function autoResize() {
      $input.style.height = "auto";
      $input.style.height = Math.min($input.scrollHeight, 120) + "px";
    }

    $input.addEventListener("input", autoResize);

    // ── Typing indicator ──
    $input.addEventListener("input", () => {
      if (!isTyping) {
        isTyping = true;
        socket.emit("typing", true);
      }
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        isTyping = false;
        socket.emit("typing", false);
      }, TYPING_TIMEOUT_MS);
    });

    socket.on("userTyping", (data) => {
      if (data.isTyping) {
        $typingText.textContent = data.username + " is typing...";
        $typingIndicator.classList.add("visible");
      } else {
        $typingIndicator.classList.remove("visible");
      }
    });

    // ── Mobile sidebar toggle ──
    function openSidebar() {
      $sidebar.classList.add("open");
      $sidebarOverlay.classList.add("visible");
    }
    function closeSidebar() {
      $sidebar.classList.remove("open");
      $sidebarOverlay.classList.remove("visible");
    }

    $sidebarToggle.addEventListener("click", openSidebar);
    $sidebarOverlay.addEventListener("click", closeSidebar);

    // ── Socket events ──
    socket.on("message", (message) => {
      renderMessage(message);
    });

    socket.on("locationMessage", (data) => {
      renderMessage({
        username: data.username,
        url: data.url,
        createdAt: data.createdAt
      });
    });

    socket.on("roomData", (data) => {
      renderSidebar(data);
    });

    // ── Send message ──
    $form.addEventListener("submit", (e) => {
      e.preventDefault();

      const msg = $input.value.trim();
      if (!msg) return;
      if (msg.length > MAX_MSG_LENGTH) {
        showToast("Message is too long (max " + MAX_MSG_LENGTH + " chars)", "error");
        return;
      }

      $sendBtn.disabled = true;

      // Stop typing
      if (isTyping) {
        isTyping = false;
        clearTimeout(typingTimer);
        socket.emit("typing", false);
      }

      socket.emit("sendMessage", msg, (error) => {
        $sendBtn.disabled = false;
        $input.value = "";
        $input.style.height = "auto";

        // Don't force focus on mobile (fixes keyboard issue)
        if (window.innerWidth > 768) {
          $input.focus();
        }

        if (error) {
          showToast(error, "error");
        }
      });

      // Safety: re-enable button after timeout if server doesn't respond
      setTimeout(() => { $sendBtn.disabled = false; }, RECONNECT_BTN_MS);
    });

    // ── Shift+Enter for newline, Enter to send ──
    $input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        $form.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });

    // ── Send location ──
    $locBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser", "error");
        return;
      }

      // Safe geolocation permission check
      try {
        if (navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: "geolocation" }).then((res) => {
            if (res.state === "denied") {
              showToast("Location permission denied", "error");
            }
          }).catch(() => {});
        }
      } catch (_) {}

      $locBtn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          socket.emit("sendLocation", {
            Latitude: position.coords.latitude,
            Longitude: position.coords.longitude,
          }, () => {
            $locBtn.disabled = false;
          });
          setTimeout(() => { $locBtn.disabled = false; }, RECONNECT_BTN_MS);
        },
        () => {
          $locBtn.disabled = false;
          showToast("Unable to get your location", "error");
        }
      );
    });

    // ── Join room ──
    socket.emit("join", { username, room }, (error) => {
      if (error) {
        showToast(error, "error");
        setTimeout(() => { location.href = "/"; }, 2000);
      }
    });

    // ── Focus input on desktop ──
    if (window.innerWidth > 768) {
      $input.focus();
    }
  }
})();
