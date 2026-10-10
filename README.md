# SyncWave 🌊 — Real-Time YouTube Watch Party

SyncWave is a modern, real-time synchronized YouTube watch party application designed for friends to stream videos together in sync with live chat, spatial WebRTC voice channels, custom private rooms, personalized avatars, and shared watch histories.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## ✨ Features

- ⏱️ **Sub-Second YouTube Playback Synchronization**: Synchronizes Play, Pause, Seek, and Video changes instantly across all participants using WebSocket events.
- 🔄 **Automatic Drift Correction**: Detects playback offsets (>1.75s) with a floating one-click "Sync with Room" button to catch up smoothly.
- 💬 **Live Room Chat & Floating Reactions**: Send messages in real time or trigger floating emoji reactions (🔥, ❤️, 😂, 🍿, 👏, 🎉, 🚀) that glide over the video screen for all viewers.
- 🎙️ **Integrated WebRTC Voice Chat**: Built-in peer-to-peer audio mesh with live voice activity detection (green glowing soundwave indicators), self-mute, deafen, and individual peer volume sliders.
- 🎨 **Avatar & Profile Customizer**: Modular SVG avatar builder with custom color gradients, facial expressions (Chill, Sunglasses, Kawaii, Star-Eyed, etc.), and accessories (Headphones, Crown, VR Visor, Beanie, Cat Ears).
- 🔒 **Custom Private Rooms**: Create viewing parties with custom names, custom slugs, optional PIN passwords, and Host-Only vs. Open DJ playback control policies.
- 📜 **Shared Watch History**: Automatically logs videos watched together with timestamps and attendee lists. Export as JSON or copy a formatted recap to share on Discord or Twitter.
- 📱 **Mobile-Friendly Layout**: Optimized theater mode for desktop, and stacked sticky-video layout with touch-friendly 44px+ controls for mobile devices.
- 🚀 **Turnkey Vercel Deployment**: Includes pre-configured `vercel.json` with client-side SPA routing and peer mesh fallback.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Player**: YouTube IFrame API with custom sync protocol
- **Real-Time Communication**: WebSockets (`ws`) + WebRTC audio mesh
- **Server**: Express.js with Vite middleware (`server.ts`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
git clone https://github.com/Tamil-Venthan/syncwave-watch-party.git
cd syncwave-watch-party
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deploying to Vercel

### Method 1: Git Import (Recommended)

1. Push this repository to your GitHub account.
2. Go to [vercel.com/new](https://vercel.com/new) and select `syncwave-watch-party`.
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Click **Deploy**!

### Method 2: Vercel CLI

```bash
npm run build
npx vercel --prod
```

---

## 📄 License

MIT License. Built with ❤️ for synchronized viewing parties.
