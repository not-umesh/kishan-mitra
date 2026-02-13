# Kisan-Mitra 🌾🤖

Yo! Welcome to **Kisan-Mitra**. This is a super cool, 100% free-tier app that helps our Indian farmers with weather updates, mandi prices, and AI-powered advice. No paid APIs, just pure code magic. ✨

Built with **Expo (React Native)** on the frontend and **Node.js/Express** on the backend. Secured, fast, and ready to roll.

---

## 🚀 Quick Setup Guide

Follow these steps exactly, and you'll be up in no time. No cap.

### 1️⃣ Clone the Repo
Grab the code first:
```bash
git clone https://github.com/not-umesh/kishan-mitra.git
cd kishan-mitra
```

---

### 2️⃣ Backend Setup (The Brain 🧠)
This handles the API keys so they don't leak. Smart, right?

1.  **Go to the backend folder:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your keys:**
    - Rename/Create a `.env` file in the `backend` folder.
    - Paste your keys (Get them for free from data.gov.in and openrouter.ai):
    ```env
    PORT=3000
    DATA_GOV_API_KEY=paste_your_key_here
    OPENROUTER_API_KEY=paste_your_key_here
    ```

4.  **Start the server:**
    ```bash
    npm run dev
    ```
    *You should see: "Server running on port 3000 ‘‘</UV> ’’"*

---

### 3️⃣ Frontend Setup (The Face 📱)
This is what you see on your phone.

1.  **Open a NEW terminal** (keep the backend running!).

2.  **Go to the project root:**
    ```bash
    cd ..
    ```

3.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

4.  **Configure network:**
    - Find your computer's local IP (e.g., `192.168.1.5`).
    - Open `.env` in the root folder.
    - Update `BACKEND_URL`:
    ```env
    BACKEND_URL=http://YOUR_LOCAL_IP:3000
    ```

5.  **Launch it:**
    ```bash
    npx expo start --clear
    ```
    - Scan the QR code with the **Expo Go** app on your Android phone.
    - Boom! You're live. 🚀

---

## 🛡️ Security Features
We didn't just build it; we locked it down.
- **Rate Limiting**: Stops spam (100 req/15min).
- **Helmet**: Secure HTTP headers.
- **Input Validation**: No sketchy data allowed.

---

## 🤝 Contributing
Feel free to fork it, fix bugs, or add cool features. Just keep it clean and helpful for the farmers.

**‘‘</UV> ’’**
