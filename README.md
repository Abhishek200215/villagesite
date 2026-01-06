# ವೀರಪುರ ಗ್ರಾಮ - Village Digital Platform

A simple, villager-friendly website for Veerapura village with real-time updates.

## Features:
- 🎤 Voice search in Kannada
- 🌾 Real-time crop prices
- 🚑 Emergency contacts
- 👷 Job opportunities
- 📢 Admin announcements
- 📱 PWA - Install as app
- 🌐 Kannada/English support

## Setup:

### 1. Firebase Setup (FREE):
1. Go to https://firebase.google.com
2. Create project "veerapura-village"
3. Enable Firestore Database
4. Enable Authentication → Email/Password
5. Add admin user: admin@veerapura.in
6. In Firestore, create collection "users"
7. Add document with admin's UID: {role: "admin"}
8. Get Firebase config and update in index.html

### 2. GitHub Deployment:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOURNAME/veerapura-village.git
git push -u origin main