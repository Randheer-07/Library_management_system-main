# RESUME IQ

Smart Resume Analyzer & Cover Letter Generator with ATS scoring.

**Live Demo:** [https://resume-iq.onrender.com](https://resume-iq.onrender.com)

## Features

- **ATS Compatibility Score** — Analyze your resume against job descriptions with a detailed breakdown (Keywords, Formatting, Content, Experience, Education)
- **Smart Suggestions** — Get prioritized improvements to maximize your resume's ATS score
- **Cover Letter Generator** — Auto-generate personalized cover letters based on your resume and the job description
- **Improved Resume** — Download an optimized version of your resume with better ATS compatibility
- **Dark/Light Theme** — Toggle between themes with preference saved to localStorage
- **Responsive Design** — Works on phones, tablets, and desktops
- **No Login Required** — Direct access, no signup needed
- **DOCX Downloads** — Download cover letter and improved resume as Word documents

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Libraries:** Multer (file upload), Mammoth (DOCX parsing), PDF-parse (PDF parsing), docx (DOCX generation)

## Project Structure

```
RESUME IQ/
├── frontend/
│   └── index.html          # Single-page frontend
├── backend/
│   ├── server.js            # Express server & API routes
│   ├── utils/
│   │   ├── resume-parser.js # Extract structured data from resumes
│   │   ├── ats-scorer.js    # Calculate ATS compatibility score
│   │   ├── cover-letter.js  # Generate personalized cover letters
│   │   ├── resume-improver.js # Generate improved resume content
│   │   └── docx-builder.js  # Build downloadable DOCX files
│   ├── uploads/             # Temporary file storage (auto-cleaned)
│   └── package.json
├── package.json             # Root package.json (for Render deployment)
├── .gitignore
└── README.md
```

## Local Development

```bash
# Clone the repository
git clone https://github.com/Randheer-07/RESUME-IQ.git
cd RESUME-IQ

# Install dependencies
npm install

# Start the server
npm start

# Open in browser
http://localhost:3000
```

## Deploy to Render

### Option A: Auto-Deploy from GitHub (Recommended)

1. Push this repository to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Web Service**
4. Connect your GitHub repository: `Randheer-07/RESUME-IQ`
5. Configure:
   - **Name:** `resume-iq`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Click **Create Web Service**
7. Render will auto-deploy on every push to `main`/`master`

### Option B: Manual Deploy via Render CLI

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy
render deploy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Upload resume + job description for analysis |
| POST | `/api/download/cover-letter` | Download generated cover letter as DOCX |
| POST | `/api/download/improved-resume` | Download improved resume as DOCX |

## Supported File Formats

- PDF
- DOC
- DOCX
- TXT

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port (Render sets this automatically) |

## License

ISC
