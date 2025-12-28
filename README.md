# 🚀 BeyondChats AI Content Enhancement Platform

> **Full Stack MERN Application** for automated content discovery, enhancement, and management using Generative AI

[![Live Demo](https://img.shields.io/badge/Demo-Live-success?style=for-the-badge)](https://beyondchats-ochre.vercel.app)
[![Video Walkthrough](https://img.shields.io/badge/Video-Watch-red?style=for-the-badge&logo=youtube)](YOUR_VIDEO_LINK)

**Live Application:** [https://beyondchats-ochre.vercel.app](https://beyondchats-ochre.vercel.app)  
**API Backend:** [https://beyondchats-ochre.vercel.app/api/articles](https://beyondchats-ochre.vercel.app/api/articles)

---

## 📋 Table of Contents

- [Overview](#-project-overview)
- [Features](#-key-features)
- [Architecture](#-architecture--data-flow)
- [Tech Stack](#-tech-stack)
- [Live Demo](#-live-demo-usage)
- [Local Setup](#-local-setup)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Challenges & Solutions](#-challenges--solutions)

---

## 🎯 Project Overview

An intelligent content management system that automatically discovers, enhances, and presents blog articles using cutting-edge AI technology. Built for the **BeyondChats Full Stack Internship Assignment**.

### **Three-Phase Workflow:**

1. **📥 Scrape Phase**: Automatically discovers and extracts blog articles from beyondchats.com
2. **🤖 AI Processing Phase**: Intelligent web search + content enhancement using Google Gemini and Groq AI
3. **📊 Display Phase**: Side-by-side comparison of original vs. AI-enhanced content with full citations

---

## ✨ Key Features

### 🎨 Frontend Features

- **Modern Dashboard UI** with glassmorphism effects and smooth animations
- **Real-time Status Tracking** (Pending, Completed, Failed)
- **Side-by-Side Comparison** of original and AI-enhanced content
- **Search & Filter** functionality for articles
- **One-Click Downloads** - Export articles as standalone HTML files
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Live Processing** - Process articles directly from the dashboard

### ⚙️ Backend Features

- **RESTful API** with Express.js
- **Serverless Deployment** on Vercel
- **MongoDB Integration** for data persistence
- **CORS Enabled** for cross-origin requests
- **Error Handling** with detailed logging

### 🧠 AI Processing Features

- **Multi-Source Web Search** (Google Scholar, DuckDuckGo, Google News)
- **Intelligent Content Extraction** using Cheerio
- **Multi-Model AI Support** with automatic fallback:
  - Primary: Google Gemini 2.5 Flash
  - Secondary: Google Gemini 1.5 Pro
  - Tertiary: Groq (Llama 3.3 70B, Llama 3.1 70B, Mixtral 8x7B)
- **Automatic Citations** with source tracking
- **Rate Limiting & Polite Delays** to respect server resources

---

## 🏗️ Architecture & Data Flow

```mermaid
graph TD
    subgraph "🎨 Frontend Layer"
        UI[Next.js Dashboard<br/>React + Tailwind CSS]
    end

    subgraph "🔧 Backend Layer"
        API[Express REST API<br/>Vercel Serverless]
        Scraper[Article Scraper<br/>Axios + Cheerio]
    end

    subgraph "🤖 AI Processing Layer"
        Controller[Article Controller]
        Search[Multi-Source Search<br/>Scholar + DDG + News]
        Extract[Content Extractor<br/>Cheerio Parser]
        AI[AI Generation<br/>Gemini + Groq]
    end

    DB[(MongoDB Atlas<br/>Document Store)]

    User((👤 User)) -->|1. Click 'Scrape'| UI
    UI -->|2. POST /api/articles/scrape| API
    API -->|3. Trigger Scraper| Scraper
    Scraper -->|4. Extract Articles| Scraper
    Scraper -->|5. Save to DB| DB

    User -->|6. Click 'Process'| UI
    UI -->|7. POST /api/articles/process/:id| API
    API -->|8. Fetch Article| Controller
    Controller -->|9. Search Web| Search
    Search -->|10. Return Sources| Controller
    Controller -->|11. Scrape Content| Extract
    Extract -->|12. Pass to AI| AI
    AI -->|13. Generate Enhanced Content| Controller
    Controller -->|14. Update Article| DB

    UI -->|15. GET /api/articles| API
    API -->|16. Return Data| DB
    DB -->|17. Display Results| UI

    style UI fill:#3b82f6,stroke:#1e40af,color:#fff
    style API fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style DB fill:#10b981,stroke:#059669,color:#fff
    style AI fill:#f59e0b,stroke:#d97706,color:#fff
```

---

## 🛠️ Tech Stack

### **Frontend**

| Technology   | Version | Purpose                         |
| ------------ | ------- | ------------------------------- |
| Next.js      | 14.x    | React framework with App Router |
| React        | 18.x    | UI library                      |
| Tailwind CSS | 3.x     | Utility-first styling           |
| Axios        | 1.6.x   | HTTP client                     |

### **Backend**

| Technology | Version | Purpose             |
| ---------- | ------- | ------------------- |
| Node.js    | 18.x+   | Runtime environment |
| Express.js | 4.x     | Web framework       |
| MongoDB    | Latest  | NoSQL database      |
| Mongoose   | 8.x     | MongoDB ODM         |
| Cheerio    | 1.0.x   | HTML parsing        |
| Axios      | 1.6.x   | HTTP requests       |

### **AI & Processing**

| Technology           | Purpose                    |
| -------------------- | -------------------------- |
| Google Generative AI | Primary content generation |
| Groq SDK             | Fallback AI provider       |
| Multiple Search APIs | Web content discovery      |

### **Deployment**

| Service       | Usage                      |
| ------------- | -------------------------- |
| Vercel        | Frontend + Backend hosting |
| MongoDB Atlas | Database hosting           |

---

## 🌐 Live Demo Usage

Visit the live application at **[https://beyondchats-ochre.vercel.app](https://beyondchats-ochre.vercel.app)**

### How to Use:

1. **View Existing Articles**

   - Browse articles in the left sidebar
   - See real-time status: 🟡 Pending, 🟢 Completed, 🔴 Failed
   - Click any article to view details

2. **Scrape New Articles**

   - Click the "✨ Scrape New Articles" button
   - Wait 10-15 seconds for the scraper to complete
   - New articles appear with "Pending" status

3. **Process Articles with AI**

   - Select a pending article
   - Click "Process Article Now" button
   - Watch as AI searches the web and generates enhanced content
   - Takes 30-60 seconds depending on search results

4. **View Enhanced Content**

   - Compare original source (left) vs. AI-enhanced version (right)
   - Click reference links to verify sources
   - Download the enhanced article as HTML

5. **Manage Articles**
   - Search articles using the search bar
   - Delete unwanted articles
   - Download completed articles

---

## 💻 Local Setup

### Prerequisites

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **MongoDB** installed locally or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- **API Keys** (Free):
  - [Google Gemini API Key](https://makersuite.google.com/app/apikey)
  - [Groq API Key](https://console.groq.com/) (Optional but recommended)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/beyondchats-assignment.git
cd beyondchats-assignment
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/beyondchats_assignment
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/beyondchats

# AI API Keys
GEMINI_API_KEY=your_google_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend server:

```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3️⃣ Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/articles
```

Start the frontend:

```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### 4️⃣ Test the Application

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Scrape New Articles"
3. Select a pending article
4. Click "Process Article Now"
5. Wait for AI to complete processing
6. View the enhanced content!

---

## 📡 API Documentation

### Base URL

- **Production**: `https://beyondchats-ochre.vercel.app/api/articles`
- **Local**: `http://localhost:5000/api/articles`

### Endpoints

#### 1. Get All Articles

```http
GET /api/articles
```

**Response:**

```json
[
  {
    "_id": "676f9a5b2c4d8e1234567890",
    "title": "Understanding AI in Healthcare",
    "original_url": "https://beyondchats.com/blogs/article-1",
    "original_content": "Original article text...",
    "updated_content": "<h2>Enhanced content</h2>...",
    "status": "completed",
    "references": [
      {
        "title": "Source Title",
        "url": "https://source.com"
      }
    ],
    "createdAt": "2024-12-28T10:30:00.000Z",
    "updatedAt": "2024-12-28T10:35:00.000Z"
  }
]
```

#### 2. Get Single Article

```http
GET /api/articles/:id
```

#### 3. Scrape New Articles

```http
GET /api/articles/scrape
```

**Response:**

```json
{
  "success": true,
  "message": "Scraping complete. Added 5 new articles.",
  "total_found": 5
}
```

#### 4. Process Article with AI

```http
POST /api/articles/process/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Article processed successfully",
  "article": {
    /* updated article object */
  }
}
```

#### 5. Update Article

```http
PUT /api/articles/:id
```

**Body:**

```json
{
  "title": "Updated Title",
  "status": "completed"
}
```

#### 6. Delete Article

```http
DELETE /api/articles/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Article deleted"
}
```

---

## 🔐 Environment Variables

### Backend (.env)

| Variable         | Description               | Required | Example                                 |
| ---------------- | ------------------------- | -------- | --------------------------------------- |
| `PORT`           | Server port               | No       | `5000`                                  |
| `MONGO_URI`      | MongoDB connection string | Yes      | `mongodb://localhost:27017/beyondchats` |
| `GEMINI_API_KEY` | Google Gemini API key     | Yes      | `AIzaSy...`                             |
| `GROQ_API_KEY`   | Groq API key (fallback)   | No       | `gsk_...`                               |
| `NODE_ENV`       | Environment mode          | No       | `production`                            |

### Frontend (.env.local)

| Variable              | Description          | Required | Example                            |
| --------------------- | -------------------- | -------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | Yes      | `https://yourapi.com/api/articles` |

---

## 🚀 Deployment

### Backend Deployment (Vercel)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel settings
5. Deploy!

**Important Files:**

- `vercel.json` - Routing configuration
- `server.js` - Must export the Express app

### Frontend Deployment (Vercel)

1. Push frontend code to GitHub
2. Import to Vercel
3. Set `NEXT_PUBLIC_API_URL` environment variable
4. Deploy!

### Database (MongoDB Atlas)

1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Whitelist IP: `0.0.0.0/0` (for Vercel)
3. Copy connection string to `MONGO_URI`

---

## 🎯 Challenges & Solutions

### Challenge 1: Puppeteer on Vercel

**Problem:** Puppeteer doesn't work on Vercel serverless functions  
**Solution:** Replaced with Axios + Cheerio for HTML parsing

### Challenge 2: Web Search Without API Keys

**Problem:** Need to search web without paid APIs  
**Solution:** Implemented multi-source scraping (Google Scholar, DuckDuckGo Lite, Google News)

### Challenge 3: AI Rate Limits

**Problem:** Gemini API sometimes hits rate limits  
**Solution:** Implemented fallback chain: Gemini 2.5 → Gemini 1.5 → Groq (3 models)

### Challenge 4: Content Extraction Reliability

**Problem:** Different websites have different HTML structures  
**Solution:** Multi-strategy extraction with 10+ CSS selectors

### Challenge 5: CORS Issues

**Problem:** Frontend can't access backend  
**Solution:** Configured CORS properly in Express + vercel.json headers

---

## 📂 Project Structure

```
beyondchats-assignment/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   └── articleController.js  # API logic + AI processing
│   ├── models/
│   │   └── Article.js            # Mongoose schema
│   ├── routes/
│   │   └── articleRoutes.js      # Express routes
│   ├── utils/
│   │   └── scraper.js            # Web scraping logic
│   ├── scripts/
│   │   ├── processArticles.js    # Standalone AI processor
│   │   └── clean.js              # Database cleanup utility
│   ├── .env                      # Environment variables (gitignored)
│   ├── server.js                 # Express server entry point
│   ├── vercel.json               # Vercel configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.js           # Main dashboard component
│   │       ├── layout.js         # Root layout
│   │       └── globals.css       # Tailwind imports
│   ├── public/
│   ├── .env.local                # Frontend env vars (gitignored)
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Backend server starts without errors
- [ ] MongoDB connects successfully
- [ ] Scraper finds and saves articles
- [ ] Articles appear in frontend
- [ ] Processing button triggers AI generation
- [ ] AI generates enhanced content with citations
- [ ] Download feature creates valid HTML file
- [ ] Delete functionality works
- [ ] Search filters articles correctly
- [ ] Responsive design works on mobile

### API Testing with cURL

```bash
# Test backend health
curl https://beyondchats-ochre.vercel.app/

# Get all articles
curl https://beyondchats-ochre.vercel.app/api/articles

# Trigger scrape
curl https://beyondchats-ochre.vercel.app/api/articles/scrape
```

---

## 📈 Future Enhancements

- [ ] **Batch Processing** - Process multiple articles simultaneously
- [ ] **Scheduling** - Automatic scraping with cron jobs
- [ ] **User Authentication** - Multi-user support
- [ ] **Advanced Filters** - Filter by date, status, keywords
- [ ] **Analytics Dashboard** - Processing stats and charts
- [ ] **Export Options** - PDF, Markdown, DOCX
- [ ] **Version History** - Track article revisions
- [ ] **Custom AI Prompts** - User-defined enhancement styles

---

## 🤝 Contributing

This is an assignment submission project, but suggestions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is submitted as part of the **BeyondChats Full Stack Internship Assignment**.

---

## 👨‍💻 Author

**Your Name**

- Portfolio: [yourportfolio.com](https://yourportfolio.com)
- LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- **BeyondChats Team** for the assignment opportunity
- **Google Gemini AI** for content generation
- **Groq** for fast AI inference
- **Vercel** for seamless deployment
- **MongoDB** for reliable data storage

---

## 📞 Support

For any questions or issues:

- 📧 Email: your.email@example.com
- 💬 Open an [Issue](https://github.com/yourusername/beyondchats-assignment/issues)

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ for BeyondChats

</div>
