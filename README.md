<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Note-IT AI: Next-Gen Academic Learning & Research Studio

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-12.14-FFCA28?logo=firebase&logoColor=white)](https://firebase.google.com)
[![Azure Storage](https://img.shields.io/badge/Azure_Blob_Storage-12.32-0078D4?logo=microsoftazure&logoColor=white)](https://azure.microsoft.com)
</div>

---

**Note-IT AI** is a state-of-the-art personal knowledge, learning, and research companion designed for scholars, researchers, and students. Powered by advanced Gemini and OpenAI models under a secure **BYOK (Bring Your Own Key)** architecture, the system ingests multi-format lectures, documents, and transcripts to synthesize study materials, track weak topics, map knowledge graphs, and enable grounded Q&A.

---

## Key Features

- **🛡️ Secure BYOK (Bring Your Own Key) Integration**
  - Connect your own Gemini or OpenAI API keys directly.
  - Keys are encrypted client-side using **AES-256-GCM** before being securely synchronized to Firebase, ensuring maximum user privacy.

- **🎙️ Live Lecture Capture & Synthesis Engine**
  - Record live lecture audio or upload existing media and document files (PDFs, `.docx`, `.pptx`, `.xlsx`, and YouTube links).
  - The synthesis engine generates structured study guides, detailed transcripts, concise summaries, flashcards, and conceptual cheat sheets.

- **🔍 RAG-Powered Research Hub (Research Studio)**
  - Engage in grounded conversations with your library of documents.
  - Every answer includes precise citations, mapping directly to specific document page numbers or audio timestamps (`[MM:SS]`).

- **🎯 Cognitive Weak Topics Radar (Tracker)**
  - Real-time diagnostic telemetry visualizes your learning progression.
  - Automatically assesses quiz and recall telemetry to build a personalized action plan for subjects like Calculus, Stereochemistry, Neural Networks, etc.

- **📝 Interactive Presenter & Quiz Workspace**
  - Dual-pane workspaces to view original source materials next to generated study notes.
  - Practice mock tests across three custom difficulty tiers (Easy, Medium, Hard).
  - Built-in visual **Knowledge Studio** maps relationships between key terms dynamically.

- **✨ Rich Aesthetics & Micro-Animations**
  - Dark-mode first design using custom HSL palettes and glassmorphism.
  - Seamless layout transitions powered by **Framer Motion** (`motion/react`) and responsive structures using **Tailwind CSS v4**.

---

## Technology Stack

### Frontend
- **Framework:** React 19 (TypeScript)
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion (via `motion/react`)
- **Icons:** Lucide React

### Backend
- **Server:** Node.js + Express
- **Runtime Compiler:** `tsx`
- **Document Parsers:** `pdf-parse`, `mammoth` (Word), `officeparser` (PowerPoint), `xlsx` (Excel), `@mozilla/readability` & `jsdom` (Web Scraping)
- **YouTube API:** `youtube-transcript`

### Cloud Infrastructure
- **Database & Auth:** Firebase Auth & Firestore
- **Storage:** Azure Blob Storage (with automated Local Uploads folder fallback)

---

## Environment Setup

Clone the repository and copy the environment template to configure your local setup:

```bash
cp .env.example .env
```

Open `.env` and fill in the necessary keys:

| Key | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your primary Google Gemini API Key |
| `ENCRYPTION_SECRET` | A secure 32-character key used for AES encrypting user API keys |
| `VITE_FIREBASE_*` | Firebase project configurations (Auth, Database, Storage) |
| `AZURE_STORAGE_*` | Credentials for Azure Blob Storage (optional; fallbacks to local upload directories if missing) |
| `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` | Path to the Firebase service account JSON key file for backend administration |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Firebase Project setup

### Installation

1. Install backend and frontend dependencies:
   ```bash
   npm install
   ```

2. Configure the database rules on Firebase or review [firestore.rules](firestore.rules).

### Running Locally

To run Note-IT AI, you need to spin up both the Vite client server and the Express backend API.

1. **Start the Frontend Client (Vite):**
   ```bash
   npm run dev
   ```
   *The client runs by default on [http://localhost:5173](http://localhost:5173)*

2. **Start the Backend API Server:**
   ```bash
   npm start
   ```
   *The backend starts by default on [http://localhost:3002](http://localhost:3002)*

3. **Production Build:**
   ```bash
   npm run build
   ```

---

<div align="center">
<img width="1920" height="1080" alt="Screenshot 2026-06-13 085257" src="https://github.com/user-attachments/assets/3c8f8350-4f2a-4a80-a886-875494f0d2f2" />
</div>
