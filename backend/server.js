const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { parseResume } = require('./utils/resume-parser');
const { calculateATSScore, getImprovements } = require('./utils/ats-scorer');
const { generateCoverLetter } = require('./utils/cover-letter');
const { generateImprovedResume } = require('./utils/resume-improver');
const { buildCoverLetterDocx, buildResumeDocx } = require('./utils/docx-builder');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, TXT files are allowed'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============ ANALYZE ENDPOINT ============
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a resume file.' });
        }

        const jobDescription = req.body.jobDescription;
        if (!jobDescription || jobDescription.trim().length < 20) {
            return res.status(400).json({ error: 'Please provide a valid job description (at least 20 characters).' });
        }

        // 1. Parse resume
        const resumeData = await parseResume(req.file.path, req.file.mimetype);

        // 2. Calculate ATS score
        const atsResult = calculateATSScore(resumeData, jobDescription);

        // 3. Get improvements
        const improvements = getImprovements(resumeData, jobDescription, atsResult);

        // 4. Generate cover letter
        const coverLetter = generateCoverLetter(resumeData, jobDescription);

        // 5. Generate improved resume
        const improvedResume = generateImprovedResume(resumeData, jobDescription, improvements);

        // Clean up uploaded file
        try { fs.unlinkSync(req.file.path); } catch (e) {}

        return res.json({
            success: true,
            data: {
                resumeData,
                atsScore: atsResult.score,
                atsBreakdown: atsResult.breakdown,
                improvements,
                coverLetter,
                improvedResume
            }
        });

    } catch (err) {
        console.error('ANALYSIS ERROR:', err);
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        return res.status(500).json({ error: 'Failed to analyze resume. ' + err.message });
    }
});

// ============ DOWNLOAD COVER LETTER ============
app.post('/api/download/cover-letter', async (req, res) => {
    try {
        const data = req.body;
        if (!data || !data.candidateName) {
            return res.status(400).json({ error: 'No cover letter data provided.' });
        }
        const buffer = await buildCoverLetterDocx(data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=Cover_Letter.docx');
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error('COVER LETTER DOWNLOAD ERROR:', err);
        return res.status(500).json({ error: 'Failed to generate cover letter.' });
    }
});

// ============ DOWNLOAD IMPROVED RESUME ============
app.post('/api/download/improved-resume', async (req, res) => {
    try {
        const data = req.body;
        if (!data || !data.name) {
            return res.status(400).json({ error: 'No resume data provided.' });
        }
        const buffer = await buildResumeDocx(data);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=Improved_Resume.docx');
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error('RESUME DOWNLOAD ERROR:', err);
        return res.status(500).json({ error: 'Failed to generate improved resume.' });
    }
});

// ============ START ============
app.listen(PORT, '0.0.0.0', () => {
    console.log('RESUME IQ running at http://localhost:' + PORT);
});
