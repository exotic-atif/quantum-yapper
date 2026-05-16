# ⚡ Quantum Yapper 2.0

A futuristic real-time chat application built with **Node.js**, **Express**, and **Socket.IO**.  
Quantum Yapper delivers a premium, immersive group chat experience with a modern dark UI, glassmorphism design, and buttery-smooth interactions.

### 🌐 **[Live Demo → quantum-yapper.onrender.com](https://quantum-yapper.onrender.com/)**

---

## 🚀 Features

### Core
- 🔥 **Real-time messaging** — instant delivery via Socket.IO WebSockets
- 👥 **Multi-room support** — create or join any room by name
- 👀 **Live user presence** — see who's online with green status indicators
- 📍 **Location sharing** — share your GPS location with one tap
- ⌨️ **Typing indicators** — see when someone is typing in real-time
- 🛡 **Profanity filter** — powered by [bad-words](https://www.npmjs.com/package/bad-words)

### UI/UX (2.0 Overhaul)
- 🎨 **Futuristic dark theme** — deep space palette with violet neon accents
- 💎 **Glassmorphism design** — frosted glass cards with backdrop blur
- 💬 **Message bubbles** — distinct self (gradient purple), other (glass), and system (centered chip) styles
- 📝 **Multi-line composer** — textarea with Shift+Enter for newlines, Enter to send
- 🔗 **URL auto-linking** — links in messages are automatically clickable
- ⬇️ **Smart auto-scroll** — stays at bottom for new messages, shows a "scroll to bottom" FAB when reading older messages
- 📱 **Mobile-first responsive** — slide-out sidebar overlay, proper `100dvh`, no keyboard issues
- ✨ **Smooth animations** — GPU-accelerated message entrance, spring-like easing, staggered effects
- 🔔 **Toast notifications** — elegant non-blocking toasts instead of native `alert()` popups
- 🚪 **Leave room button** — clean exit without needing to close the tab
- 🧹 **DOM culling** — auto-removes old messages (max 300) to prevent memory leaks
- 🔒 **Message length limit** — max 2000 characters, validated client + server side
- 🔤 **Case-insensitive usernames** — prevents impersonation ("User" and "user" are the same)
- ♿ **Focus-visible states** — full keyboard navigation accessibility
- 🖋 **Custom scrollbar** — slim, themed scrollbar that matches the UI

### What Was Fixed (from v1)
- ✅ Blank/space-only messages no longer allowed (`.trim()` validation)
- ✅ Auto-scroll no longer breaks when scrolling up
- ✅ `100dvh` replaces `100vh` (fixes mobile Safari address bar issue)
- ✅ Sidebar is an overlay on mobile (no longer pushes chat off-screen)
- ✅ Removed hardcoded `width: 17%` on buttons
- ✅ Removed `pc-mob.js` UA-sniffing (CSS media queries handle it)
- ✅ Removed Moment.js dependency (uses native `Intl.DateTimeFormat`)
- ✅ Removed Mustache.js dependency (uses native `<template>` elements)
- ✅ Geolocation API wrapped in try/catch (no more iOS Safari crash)
- ✅ Send button re-enables after 5s timeout (prevents permanent lock)
- ✅ Mobile keyboard doesn't force-reopen after sending a message
- ✅ System messages are visually distinct (centered chip style)
- ✅ Scripts use `defer` for optimal loading
- ✅ Static files served with cache headers

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) | Runtime |
| [Express](https://expressjs.com/) | Web server |
| [Socket.IO](https://socket.io/) | Real-time WebSocket communication |
| [Bad Words](https://www.npmjs.com/package/bad-words) | Profanity filter |
| [Font Awesome](https://fontawesome.com/) | Icons |
| [Google Fonts (Outfit)](https://fonts.google.com/specimen/Outfit) | Typography |

---

## 📦 Getting Started

```bash
# Clone the repo
git clone https://github.com/exotic-atif/quantum-yapper.git
cd quantum-yapper

# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

The app will be running at **http://localhost:3000**

---

## 🚢 Deployment

Deployed on **[Render](https://render.com/)** — auto-deploys from the `main` branch.

**Live URL:** [https://quantum-yapper.onrender.com/](https://quantum-yapper.onrender.com/)

---

## 📄 License

MIT
