# aniMatchAuth (New Repo)

**aniMatchAuth** is an Express.js–based authentication and session management backend developed as part of the AniMatch project.

This repository is a **sanitized version** of the project.  
All sensitive data, credentials, and internal-only files have been intentionally removed.  
It is not deployed and is shared for **demonstration and learning purposes only**.

---

## 🚀 Features

- Express.js server setup
- Session-based authentication using `express-session`
- Modular route structure (`auth`, `onboarding`, `pages`)
- Supabase integration
- Secure environment variable handling via `dotenv`
- Static asset serving
- Cache-control headers to prevent stale sessions

---

## 🧱 Tech Stack

- Node.js
- Express.js
- express-session
- Supabase
- dotenv

---

## 📁 Project Structure

```
aniMatchAuth/
│
├── public/             # Static assets
├── routes/             # Route handlers
│   ├── auth.js
│   ├── onboarding.js
│   └── pages.js
│
├── server.js           # Express server entry point
├── package.json
├── package-lock.json
├── README.md
├── .env.example        # Environment variable template
├── .gitignore
```

---

## 🔐 Environment Variables

This project uses environment variables for configuration.

Create a `.env` file in the root directory based on the provided template.

### `.env.example`

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SESSION_SECRET=replace_with_a_secure_random_string
```

> **Important:**  
> The real `.env` file is excluded from version control.  
> This repository does **not** contain any real credentials.

---

## 📦 Installation (Local Development)

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create the environment file
   ```bash
   cp .env.example .env
   ```
   Fill in your own Supabase credentials and session secret.

---

## ▶️ Running the Server

```bash
node server.js
```

The server will start on:

```
http://localhost:3000
```

(or the port defined in your environment variables).

---

## 🧠 Security & Repository Notes

- `node_modules/` is excluded from version control
- Environment variables are never committed
- Session cookies are configured with:
  - `httpOnly`
  - `secure` enabled in production mode
- Cache headers prevent session reuse on browser navigation
- This repository was created with a **clean Git history** for portfolio sharing

---

This project is **not production-ready** and is **not deployed**.

---

## 📄 License

Shared for educational and demonstration purposes.
"# AniMatchGR" 
