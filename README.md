MiniNotes App
------------
* A simple React Native + Django Notes App. Users can add, view, and manage notes. The backend is Django REST API, and the frontend is a React Native app built with Expo.

Features
---------
* Features
* Add new notes (title + content)
* View all notes in a scrollable list
* Works on iOS and Android devices
* Responsive and lightweight UI

Prerequisites
-------------
* Python 3.13+
* Node.js + npm
* Expo CLI: npm install -g expo-cli
* Git
* Virtual environment for Python (venv)

Setup Instructions
------------------
git clone https://github.com/yourusername/mininotes.git
cd mininotes

cd mybackend
# Create virtual environment (optional but recommended)
python -m venv venv
# Activate virtual environment
# Windows
venv\Scripts\activate
# Linux / Mac
source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# Apply migrations
python manage.py migrate
# Start development server
python manage.py runserver

cd ../mynotesapp
# Install dependencies
npm install
# Start Expo development server
expo start

~ This will open the Expo DevTools in your browser.
~ You can run on your device:
~ iOS: Install Expo Go → Scan QR code
~ Android: Install Expo Go → Scan QR code
~ Make sure your device and PC are on the same network.

#Update in App.js
const BASE_URL = "http://YOUR_LOCAL_IP:8000/api/notes/";


URL for the backend testing - http://192.168.1.143:8000/api/notes/
