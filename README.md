# 🚀 DevSync

**A developer-centric platform to analyze GitHub profiles seamlessly, built with a modern split-architecture.**

![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge&logo=netlify) 
![Status](https://img.shields.io/badge/Status-Beta-blue?style=for-the-badge)


🌐 **Live Website:** [https://devsyncapp.netlify.app](https://devsyncapp.netlify.app)  
📝 **Feedback Form:** [Share your thoughts here](https://docs.google.com/forms/d/e/1FAIpQLSeJglK4nm-wY09VFmAehbaV_8pC4ms0qazgBh8wyBMP8nW7BA/viewform?usp=dialog)

---

## 🤔 What is DevSync?
**DevSync** is a full-stack open-source web application designed for developers. Its primary feature is the **GitHub Profile Analyzer**, which allows users to fetch, analyze, and visualize any GitHub user's data effortlessly. It includes a secure GitHub OAuth 2.0 login system to provide a personalized experience for developers.

## 💡 Why was it built? (The Problem it Solves)
Building a decoupled app (Frontend on one server, Backend on another) usually introduces massive headaches like **CORS preflight errors**, **third-party cookie blocking**, and **API rate-limiting**. 

DevSync was built to solve these architectural challenges:
1. **Zero CORS Issues:** By utilizing a Netlify Edge Proxy (`netlify.toml`), all API and Auth requests are transparently routed to the backend. The browser thinks it's talking to one server!
2. **Bypassing Rate Limits:** Standard GitHub API requests are limited to 60/hour. DevSync’s backend securely injects a `GITHUB_TOKEN` to boost this limit to **5,000 requests/hour**, ensuring uninterrupted profile analysis.
3. **Secure Auth Flow:** Flawless GitHub OAuth integration without exposing client secrets to the frontend.

---

## 🛠️ How to Use DevSync

### For General Users (Live App)
1. Go to the live link: [DevSync App](https://devsyncapp.netlify.app)
2. **Analyze:** Enter any GitHub handle (e.g., `syedmqasim029`) in the Profile Analyzer box and hit "Analyze" to see their stats.
3. **Authenticate:** Click **Sign In** at the top to securely log in using your GitHub account and unlock the developer feed.

🏗️ Tech Stack
Frontend: React + Vite (Hosted on Netlify Edge CDN).

Backend: Node.js + Express (Hosted dynamically on Render).

Authentication: GitHub OAuth 2.0.

## 🤝 Contributing
Since this project is in active Beta, contributions, bug reports, and feature requests are highly welcome! Feel free to open an issue or submit a PR.

## 👨‍💻 Author
Syed Muhammad Qasim

GitHub: @syedmqasim029
