# ⚡ BigQuery Release Pulse

BigQuery Release Pulse is a sleek, modern, single-page web dashboard designed to fetch, filter, and share Google Cloud's BigQuery release notes in real-time. Built with a Python Flask backend and a premium glassmorphic vanilla JavaScript/CSS frontend.

---

## ✨ Features

- **Real-Time Integration**: Fetches release updates live from the official Google Cloud BigQuery Atom feed.
- **Granular Update Cards**: Employs browser-side `DOMParser` to slice multi-part release updates (such as a single day containing a *Feature* and an *Announcement*) into distinct, digestible cards.
- **Search & Category Filters**: Dynamic client-side searching matching text strings instantly, paired with filter tabs to toggle between *Features*, *Announcements*, and *Deprecations*.
- **Interactive Tweet Composer**: Automatically drafts structured tweets formatting the release date, update type, description, and link. Includes smart truncation to respect the 280-character Twitter boundary.
- **Live X (Twitter) Preview**: Displays an interactive mock representation showing exactly how the post will look on X, complete with a character counter warning indicators (yellow above 250, red above 280).
- **Responsive Layout**: Adapts gracefully to all screen resolutions (grid view on desktop, bottom-drawer panel on mobile devices).

---

## 🛠️ Technology Stack

- **Backend**: Python 3, Flask
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom gradients, animations, glassmorphism), Vanilla JavaScript (ES6, Web APIs)
- **Feeds**: Google Cloud BigQuery RSS/Atom XML

---

## 📁 File Structure

```text
nitheesh-event-talk-app/
├── app.py                # Flask Web Server & RSS Parsing Controller
├── requirements.txt      # Python dependencies
├── .gitignore            # Excludes caches, venvs, and logs from Git
├── templates/
│   └── index.html        # Main dashboard page layout
└── static/
    ├── app.js            # Frontend DOM parsing, search, and Tweet composer
    └── style.css         # Styling, glassmorphic cards, and custom animations
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Python 3** installed on your system.

### 1. Clone & Navigate
If you haven't already, clone the repository and navigate into the project directory:
```powershell
cd C:\Users\Nitheesh\agy-cli-projects
```

### 2. Install Dependencies
Install the required packages using pip:
```powershell
pip install -r requirements.txt
```

### 3. Run the Server
Launch the Flask development server:
```powershell
python app.py
```
By default, the server will start on: `http://127.0.0.1:5000`

### 4. Open the App
Open your web browser and go to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📢 How to Use the Tweet Feature

1. Scroll or search through the release notes feed on the left.
2. Click on any card you wish to share.
3. The **Draft Tweet** composer in the sidebar will slide open or populate.
4. Customize the tweet text inside the textarea if desired. The character counter and live X mock card preview will update in real-time.
5. Click the **Post to X** button to open a new tab containing X's Web Intent composer with your draft pre-populated.

---

## 📄 License
This project is licensed under the MIT License - see standard license files for details.
