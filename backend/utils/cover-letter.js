function generateCoverLetter(resumeData, jobDescription) {
    const name = resumeData.name || 'Your Name';
    const contact = [resumeData.email, resumeData.phone].filter(Boolean).join(' | ');
    const company = extractCompany(jobDescription);
    const position = extractPosition(jobDescription);
    const skills = resumeData.skills.slice(0, 5);
    const jobSkills = extractJobSkills(jobDescription);

    const p1 = `I am writing to express my strong interest in the ${position} position${company ? ' at ' + company : ''}. With my background in ${skills.length > 0 ? skills.join(', ') : 'this field'}, I am confident I can contribute meaningfully to your team.`;

    const p2 = jobSkills.length > 0
        ? `My experience aligns well with your requirements. I bring proficiency in ${jobSkills.slice(0, 4).join(', ')}${jobSkills.length > 4 ? ' among other areas' : ''}, which directly matches what you are looking for in this role.`
        : `I have developed a strong skill set that includes ${skills.length > 0 ? skills.join(', ') : 'relevant technical and soft skills'}, which I am eager to apply in this position.`;

    let p3;
    if (resumeData.experience.length > 0) {
        const exp = resumeData.experience[0];
        p3 = `In my recent role as ${exp.title}${exp.company ? ' at ' + exp.company : ''}, I ${exp.bullets.length > 0 ? exp.bullets[0].toLowerCase() : 'gained valuable experience'}. This has prepared me well for the challenges of the ${position} role.`;
    } else {
        p3 = `While I am early in my career, I bring fresh perspectives, strong problem-solving abilities, and a commitment to continuous learning that would benefit your organization.`;
    }

    const p4 = `I am excited about the opportunity to bring my skills and enthusiasm to${company ? ' ' + company : ' your organization'}. I would welcome the chance to discuss how my background, skills, and interests align with your needs.`;

    const p5 = `Thank you for considering my application. I look forward to the opportunity to speak with you about the ${position} role. I am available at your convenience for an interview.`;

    const paragraphs = [p1, p2, p3, p4, p5];

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fullText = `${name}\n${contact}\n\n${date}\n\nDear Hiring Manager,\n\n${paragraphs.join('\n\n')}\n\nSincerely,\n${name}`;

    return { candidateName: name, contactInfo: contact, position, company, paragraphs, fullText };
}

function extractCompany(jd) {
    const m = jd.match(/(?:at|for|join)\s+([A-Z][A-Za-z\s&]{2,40}?)(?:\s|,|\.|\n)/);
    if (m) return m[1].trim();
    const m2 = jd.match(/([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})\s+(?:Inc|LLC|Corp|Ltd|Co\.)/);
    if (m2) return m2[1].trim();
    return '';
}

function extractPosition(jd) {
    const m = jd.match(/(?:position|role|title)\s*:\s*([^\n]{3,60})/i);
    if (m) return m[1].trim();
    const m2 = jd.match(/(?:looking for|hiring)\s+(?:a\s+)?([A-Z][A-Za-z\s]{3,50}?)(?:\s+to|\s+who|\s+with|\n)/i);
    if (m2) return m2[1].trim();
    return 'the open position';
}

function extractJobSkills(jd) {
    const skills = [];
    const re = [
        /\b(javascript|python|java|c\+\+|c#|ruby|php|swift|kotlin|typescript|go)\b/gi,
        /\b(react|angular|vue|node\.?js|express|django|flask|spring)\b/gi,
        /\b(html|css|sql|aws|azure|docker|kubernetes|git|agile|scrum)\b/gi
    ];
    re.forEach(r => {
        const m = jd.match(r);
        if (m) skills.push(...m.map(x => x.toLowerCase()));
    });
    return [...new Set(skills)].slice(0, 6);
}

module.exports = { generateCoverLetter };
