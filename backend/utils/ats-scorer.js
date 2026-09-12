function calculateATSScore(resumeData, jobDescription) {
    const breakdown = {
        keywords:    { score: 0, max: 30, details: [] },
        formatting:  { score: 0, max: 20, details: [] },
        content:     { score: 0, max: 25, details: [] },
        experience:  { score: 0, max: 15, details: [] },
        education:   { score: 0, max: 10, details: [] }
    };

    const jobKeywords = extractKeywords(jobDescription);
    const resumeLower = resumeData.rawText.toLowerCase();

    // KEYWORDS (30 pts)
    const matched = [], missing = [];
    jobKeywords.forEach(kw => {
        if (resumeLower.includes(kw.toLowerCase())) matched.push(kw);
        else missing.push(kw);
    });
    const kwRatio = jobKeywords.length > 0 ? matched.length / jobKeywords.length : 0;
    breakdown.keywords.score = Math.round(kwRatio * 30);
    breakdown.keywords.details = { matched, missing, total: jobKeywords.length, pct: Math.round(kwRatio * 100) };

    // FORMATTING (20 pts)
    let fs = 0;
    const fd = [];
    if (resumeData.email) { fs += 4; fd.push('Email found'); } else fd.push('Missing email');
    if (resumeData.phone) { fs += 4; fd.push('Phone found'); } else fd.push('Missing phone');
    if (resumeData.summary && resumeData.summary.length > 20) { fs += 4; fd.push('Summary present'); } else fd.push('Missing summary');
    if (resumeData.skills.length >= 3) { fs += 4; fd.push('Skills section OK'); } else fd.push('Weak skills section');
    if (resumeData.experience.length > 0) { fs += 4; fd.push('Experience present'); } else fd.push('Missing experience');
    breakdown.formatting.score = fs;
    breakdown.formatting.details = fd;

    // CONTENT (25 pts)
    let cs = 0;
    const cd = [];
    const quantifyMatches = resumeData.rawText.match(/\d+%|\$\d+|\d+\s*years?|\d+\s*months?/gi) || [];
    if (quantifyMatches.length >= 3) { cs += 10; cd.push(quantifyMatches.length + ' quantified achievements'); }
    else if (quantifyMatches.length > 0) { cs += 5; cd.push(quantifyMatches.length + ' quantified items (add more)'); }
    else cd.push('No quantified achievements');

    const actionVerbs = ['managed','led','developed','implemented','created','designed','improved','increased','reduced','achieved','delivered','launched','optimized','coordinated','trained'];
    const foundVerbs = actionVerbs.filter(v => resumeLower.includes(v));
    if (foundVerbs.length >= 5) { cs += 8; cd.push(foundVerbs.length + ' action verbs'); }
    else if (foundVerbs.length > 0) { cs += 4; cd.push(foundVerbs.length + ' action verbs (add more)'); }
    else cd.push('No action verbs found');

    const wc = resumeData.rawText.split(/\s+/).length;
    if (wc >= 300 && wc <= 800) { cs += 7; cd.push('Good word count (' + wc + ')'); }
    else if (wc > 800) { cs += 4; cd.push('Too long (' + wc + ' words)'); }
    else { cs += 2; cd.push('Too short (' + wc + ' words)'); }

    breakdown.content.score = cs;
    breakdown.content.details = cd;

    // EXPERIENCE (15 pts)
    let es = 0;
    const ed = [];
    if (resumeData.experience.length > 0) {
        es += 5;
        ed.push(resumeData.experience.length + ' positions');
        const jobWords = jobDescription.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        let relevant = 0;
        resumeData.experience.forEach(exp => {
            const expText = (exp.title + ' ' + exp.bullets.join(' ')).toLowerCase();
            if (jobWords.filter(w => expText.includes(w)).length > 2) relevant++;
        });
        if (relevant > 0) { es += Math.min(10, relevant * 5); ed.push(relevant + ' relevant positions'); }
        else { es += 3; ed.push('Limited relevance'); }
    } else ed.push('No experience listed');
    breakdown.experience.score = es;
    breakdown.experience.details = ed;

    // EDUCATION (10 pts)
    let eduS = 0;
    const eduD = [];
    if (resumeData.education.length > 0) {
        eduS += 5;
        eduD.push(resumeData.education.length + ' entries');
        const hasDegree = resumeData.education.some(e =>
            /bachelor|master|phd|mba|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?/i.test(e.degree)
        );
        if (hasDegree) { eduS += 5; eduD.push('Degree found'); }
        else { eduS += 2; eduD.push('No formal degree'); }
    } else eduD.push('No education listed');
    breakdown.education.score = eduS;
    breakdown.education.details = eduD;

    const total = Object.values(breakdown).reduce((s, sec) => s + sec.score, 0);
    const pct = Math.round((total / 100) * 100);
    return { score: Math.min(pct, 100), breakdown };
}

function extractKeywords(jd) {
    const kw = new Set();
    const techRe = [
        /\b(javascript|python|java|c\+\+|c#|ruby|php|swift|kotlin|typescript|go|rust)\b/gi,
        /\b(react|angular|vue|node\.?js|express|django|flask|spring|rails)\b/gi,
        /\b(html|css|sass|less|graphql|rest|api|json|xml)\b/gi,
        /\b(aws|azure|gcp|docker|kubernetes|jenkins|ci\/cd|devops|terraform)\b/gi,
        /\b(sql|mysql|postgresql|mongodb|redis|elasticsearch)\b/gi,
        /\b(git|github|gitlab|jira|confluence|agile|scrum)\b/gi,
        /\b(tableau|power\s*bi|excel|photoshop|figma|adobe)\b/gi,
        /\b(machine\s*learning|deep\s*learning|ai|nlp|tensorflow)\b/gi
    ];
    techRe.forEach(re => {
        const m = jd.match(re);
        if (m) m.forEach(x => kw.add(x.toLowerCase()));
    });

    const soft = ['communication','leadership','teamwork','problem solving','analytical','creative',
        'innovative','detail oriented','organized','flexible','adaptable','time management'];
    soft.forEach(s => { if (jd.toLowerCase().includes(s)) kw.add(s); });

    const expM = jd.match(/(\d+\+?\s*years?\s*(?:of\s*)?experience)/gi);
    if (expM) expM.forEach(x => kw.add(x.toLowerCase()));

    return [...kw].slice(0, 40);
}

function getImprovements(resumeData, jobDescription, atsResult) {
    const imp = [];
    const bk = atsResult.breakdown;

    if (bk.keywords.score < 25) {
        const miss = bk.keywords.details.missing || [];
        if (miss.length > 0) {
            imp.push({
                category: 'Keywords', priority: 'high',
                title: 'Add Missing Keywords',
                description: 'Your resume is missing ' + miss.length + ' important keywords from the job description.',
                keywords: miss.slice(0, 10),
                suggestion: 'Incorporate these naturally: ' + miss.slice(0, 5).join(', ')
            });
        }
    }

    if (!resumeData.summary || resumeData.summary.length < 30) {
        imp.push({
            category: 'Content', priority: 'high',
            title: 'Add Professional Summary',
            description: 'A summary helps ATS systems quickly understand your qualifications.',
            suggestion: 'Write a 2-4 sentence summary highlighting your relevant experience and skills for this role.'
        });
    }

    if (resumeData.skills.length < 5) {
        imp.push({
            category: 'Skills', priority: 'medium',
            title: 'Expand Skills Section',
            description: 'Your skills section is too short.',
            suggestion: 'List 8-15 technical and soft skills matching the job requirements.'
        });
    }

    const qm = resumeData.rawText.match(/\d+%|\$\d+|\d+\s*years?/gi) || [];
    if (qm.length < 3) {
        imp.push({
            category: 'Content', priority: 'high',
            title: 'Add Quantifiable Achievements',
            description: 'ATS and recruiters value measurable results.',
            suggestion: 'Add metrics like "Increased sales by 25%" or "Managed team of 10".'
        });
    }

    if (resumeData.experience.length === 0) {
        imp.push({
            category: 'Experience', priority: 'high',
            title: 'Add Work Experience',
            description: 'Experience is critical for ATS scoring.',
            suggestion: 'Include job titles, companies, dates, and bullet points with achievements.'
        });
    }

    if (resumeData.education.length === 0) {
        imp.push({
            category: 'Education', priority: 'medium',
            title: 'Add Education Section',
            description: 'Education helps verify qualifications.',
            suggestion: 'Include degree, institution, and graduation year.'
        });
    }

    if (!resumeData.email) {
        imp.push({ category: 'Contact', priority: 'high', title: 'Add Email Address', description: 'Contact info is essential.', suggestion: 'Add a professional email address.' });
    }
    if (!resumeData.phone) {
        imp.push({ category: 'Contact', priority: 'medium', title: 'Add Phone Number', description: 'Phone helps recruiters reach you.', suggestion: 'Add your phone number.' });
    }

    const wc = resumeData.rawText.split(/\s+/).length;
    if (wc < 250) {
        imp.push({ category: 'Formatting', priority: 'medium', title: 'Resume Too Short', description: wc + ' words is too brief.', suggestion: 'Aim for 400-800 words with more detail.' });
    } else if (wc > 1000) {
        imp.push({ category: 'Formatting', priority: 'low', title: 'Resume Too Long', description: wc + ' words may be too much.', suggestion: 'Focus on most relevant content. Aim for 1-2 pages.' });
    }

    return imp;
}

module.exports = { calculateATSScore, getImprovements };
