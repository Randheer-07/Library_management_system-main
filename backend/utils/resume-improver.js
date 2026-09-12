function generateImprovedResume(resumeData, jobDescription, improvements) {
    const jobKw = extractJobKw(jobDescription);
    const missKw = improvements.filter(i => i.keywords).flatMap(i => i.keywords);

    return {
        name: resumeData.name || 'Your Name',
        contact: [resumeData.email, resumeData.phone].filter(Boolean).join(' | ') || 'email@example.com | (555) 123-4567',
        summary: buildSummary(resumeData, jobKw),
        skills: buildSkills(resumeData.skills, jobKw, missKw),
        experience: buildExperience(resumeData.experience, jobKw),
        education: resumeData.education.length > 0 ? resumeData.education : [{ degree: 'Your Degree', school: 'University Name', year: 'Year' }]
    };
}

function extractJobKw(jd) {
    const kw = new Set();
    const re = [
        /\b(javascript|python|java|c\+\+|c#|ruby|php|swift|kotlin|typescript|go)\b/gi,
        /\b(react|angular|vue|node\.?js|express|django|flask|spring|rails)\b/gi,
        /\b(html|css|sql|aws|azure|docker|kubernetes|git|agile|scrum|devops)\b/gi,
        /\b(project management|leadership|communication|teamwork|problem solving)\b/gi
    ];
    re.forEach(r => {
        const m = jd.match(r);
        if (m) m.forEach(x => kw.add(x.toLowerCase()));
    });
    return [...kw];
}

function buildSummary(rd, jobKw) {
    const skills = rd.skills.slice(0, 4).join(', ') || 'relevant technical skills';
    const hasExp = rd.experience.length > 0;
    if (hasExp) {
        return `Results-driven professional with experience in ${skills}. Proven ability to deliver high-quality solutions using ${jobKw.slice(0, 3).join(', ') || 'modern technologies'}. Passionate about continuous improvement and contributing to team success.`;
    }
    return `Motivated professional with strong foundation in ${skills}. Eager to apply knowledge of ${jobKw.slice(0, 3).join(', ') || 'industry best practices'} to drive impactful results. Committed to learning and professional growth.`;
}

function buildSkills(current, jobKw, missKw) {
    const all = new Set(current);
    missKw.forEach(k => { if (k.length > 2) all.add(k); });
    const essentials = ['communication', 'teamwork', 'problem solving', 'leadership'];
    essentials.forEach(s => { if (jobKw.includes(s)) all.add(s); });
    return [...all].slice(0, 12);
}

function buildExperience(exps, jobKw) {
    if (exps.length === 0) {
        return [{
            title: 'Relevant Experience',
            company: 'Organization',
            dates: 'Present',
            bullets: [
                'Applied ' + jobKw.slice(0, 3).join(', ') + ' to deliver successful outcomes',
                'Collaborated with cross-functional teams to achieve objectives',
                'Demonstrated strong analytical and problem-solving skills'
            ]
        }];
    }
    return exps.map(exp => ({
        ...exp,
        bullets: improveBullets(exp.bullets, jobKw)
    }));
}

function improveBullets(bullets, jobKw) {
    if (!bullets || bullets.length === 0) {
        return [
            'Contributed to team projects and achieved departmental goals',
            'Applied technical skills to solve complex challenges',
            'Collaborated with stakeholders to deliver results'
        ];
    }
    const verbs = ['Led','Developed','Implemented','Created','Designed','Improved','Increased','Reduced','Achieved','Delivered','Managed','Optimized','Streamlined','Coordinated'];
    return bullets.map(b => {
        let r = b;
        const first = r.split(' ')[0].toLowerCase();
        if (!verbs.some(v => first.startsWith(v.toLowerCase()))) {
            const v = verbs[Math.floor(Math.random() * verbs.length)];
            r = v + ' ' + r.charAt(0).toLowerCase() + r.slice(1);
        }
        if (!r.match(/\d+%|\$\d+|\d+\s*(years?|months?|projects?|team)/i)) {
            const suffixes = [' resulting in 15% improvement',' impacting 500+ users',' reducing costs by 20%',' increasing efficiency by 25%'];
            r += suffixes[Math.floor(Math.random() * suffixes.length)];
        }
        return r;
    });
}

module.exports = { generateImprovedResume };
