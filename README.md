# RESUME IQ

Smart Resume Analyzer & Cover Letter Generator with ATS scoring.

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
└── .gitignore
```

## Installation

```bash
# Clone the repository
git clone https://github.com/Randheer-07/RESUME-IQ.git
cd RESUME-IQ

# Install dependencies
cd backend
npm install
```

## Usage

```bash
# Start the server
npm start

# Open in browser
http://localhost:3000
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

## License

ISC
