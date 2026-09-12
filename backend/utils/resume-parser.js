const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const fs = require('fs');

async function parseResume(filePath, mimeType) {
    let text = '';

    if (mimeType === 'application/pdf') {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        text = data.text;
    } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
    ) {
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value;
    } else {
        text = fs.readFileSync(filePath, 'utf-8');
    }

    return extractStructuredData(text);
}

function extractStructuredData(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const lower = text.toLowerCase();

    return {
        rawText: text,
        name: getName(lines),
        email: (text.match(/[\w.\-]+@[\w.\-]+\.\w{2,}/) || [''])[0],
        phone: (text.match(/[\+]?[\d\s\-\(\)]{7,15}/) || [''])[0].trim(),
        skills: getSkills(lower),
        experience: getExperience(lines),
        education: getEducation(lines),
        summary: getSummary(lines),
        sections: lines.filter(l => /^(experience|education|skills|summary|objective|certifications?|projects?)\s*$/i.test(l))
    };
}

function getName(lines) {
    if (lines.length > 0 && lines[0].length < 40 && !lines[0].includes('@')) {
        return lines[0];
    }
    return '';
}

function getSkills(lower) {
    const dict = [
        'javascript','python','java','c\\+\\+','c#','ruby','php','swift','kotlin','typescript','go','rust',
        'react','angular','vue','node','express','django','flask','spring','rails',
        'html','css','sass','less','graphql','rest','api','json','xml',
        'aws','azure','gcp','docker','kubernetes','jenkins','ci/cd','devops','terraform',
        'sql','mysql','postgresql','mongodb','redis','elasticsearch','oracle',
        'git','github','gitlab','jira','confluence',
        'agile','scrum','kanban',
        'machine learning','deep learning','nlp','data science','tensorflow','pytorch',
        'photoshop','illustrator','figma','sketch','adobe',
        'tableau','power bi','excel','spss',
        'project management','leadership','communication','teamwork',
        'problem solving','analytical','strategic','creative','detail oriented',
        'microsoft office','linux','windows',
        'security','networking','testing','automation','selenium',
        'seo','marketing','social media'
    ];

    const found = [];
    dict.forEach(skill => {
        const re = new RegExp(skill, 'i');
        if (re.test(lower)) found.push(skill.replace(/\\\+/g, '+'));
    });
    return [...new Set(found)];
}

function getExperience(lines) {
    const results = [];
    let inExp = false;
    let current = null;
    const startRe = /^(experience|work\s+history|employment|professional\s+experience)/i;
    const stopRe = /^(education|skills|summary|objective|certifications|projects|awards)/i;

    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (startRe.test(l)) { inExp = true; continue; }
        if (inExp && stopRe.test(l)) {
            if (current) results.push(current);
            inExp = false;
            continue;
        }
        if (inExp) {
            if (l.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|20\d{2})\b/i)) {
                if (current) {
                    if (!current.dates) current.dates = l;
                    else current.bullets.push(l);
                }
            } else if (l.match(/^[•\-\*\u2022]/) || l.match(/^\d+\./)) {
                if (current) current.bullets.push(l.replace(/^[\-\*\u2022•]\s*/, '').replace(/^\d+\.\s*/, ''));
            } else if (l.length > 10 && (!current || (current && current.bullets.length > 0 && current.title))) {
                if (current) results.push(current);
                const parts = l.split(/\s+at\s+|\s+-\s+|\s*\|\s*/i);
                current = {
                    title: parts[0] ? parts[0].trim() : l,
                    company: parts[1] ? parts[1].trim() : '',
                    dates: '',
                    bullets: []
                };
            } else if (l.length > 5 && !current) {
                const parts = l.split(/\s+at\s+|\s+-\s+/i);
                current = {
                    title: parts[0] ? parts[0].trim() : l,
                    company: parts[1] ? parts[1].trim() : '',
                    dates: '',
                    bullets: []
                };
            }
        }
    }
    if (current) results.push(current);
    return results;
}

function getEducation(lines) {
    const results = [];
    let inEdu = false;
    const startRe = /^(education|academic)/i;
    const stopRe = /^(experience|skills|summary|objective|certifications|projects)/i;

    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (startRe.test(l)) { inEdu = true; continue; }
        if (inEdu && stopRe.test(l)) { inEdu = false; continue; }
        if (inEdu && l.length > 5) {
            results.push({ degree: l, school: '', year: '' });
        }
    }
    return results;
}

function getSummary(lines) {
    const startRe = /^(summary|objective|profile|about)/i;
    const stopRe = /^(experience|skills|education|work|certifications|projects)/i;
    let inSum = false;
    const parts = [];

    for (const l of lines) {
        if (startRe.test(l)) { inSum = true; continue; }
        if (inSum && stopRe.test(l)) break;
        if (inSum) parts.push(l);
    }
    return parts.join(' ');
}

module.exports = { parseResume };
