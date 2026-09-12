const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

async function buildCoverLetterDocx(data) {
    const children = [];

    children.push(new Paragraph({
        children: [new TextRun({ text: data.candidateName || 'Your Name', bold: true, size: 28 })],
        spacing: { after: 100 }
    }));
    if (data.contactInfo) {
        children.push(new Paragraph({
            children: [new TextRun({ text: data.contactInfo, size: 20 })],
            spacing: { after: 200 }
        }));
    }

    children.push(new Paragraph({
        children: [new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), size: 20 })],
        spacing: { after: 300 }
    }));

    children.push(new Paragraph({
        children: [new TextRun({ text: 'Dear Hiring Manager,', size: 22 })],
        spacing: { after: 200 }
    }));

    const paras = data.paragraphs || [data.fullText || ''];
    paras.forEach(p => {
        children.push(new Paragraph({
            children: [new TextRun({ text: p, size: 22 })],
            spacing: { after: 200 }
        }));
    });

    children.push(new Paragraph({
        children: [new TextRun({ text: 'Sincerely,', size: 22 })],
        spacing: { after: 100 }
    }));
    children.push(new Paragraph({
        children: [new TextRun({ text: data.candidateName || 'Your Name', bold: true, size: 22 })],
        spacing: { after: 100 }
    }));

    const doc = new Document({
        sections: [{
            properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
            children
        }]
    });

    return await Packer.toBuffer(doc);
}

async function buildResumeDocx(data) {
    const children = [];

    children.push(new Paragraph({
        children: [new TextRun({ text: data.name || 'Your Name', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
    }));

    if (data.contact) {
        children.push(new Paragraph({
            children: [new TextRun({ text: data.contact, size: 20 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        }));
    }

    if (data.summary) {
        children.push(sectionHeader('PROFESSIONAL SUMMARY'));
        children.push(new Paragraph({
            children: [new TextRun({ text: data.summary, size: 22 })],
            spacing: { after: 200 }
        }));
    }

    if (data.skills && data.skills.length > 0) {
        children.push(sectionHeader('SKILLS'));
        children.push(new Paragraph({
            children: [new TextRun({ text: data.skills.join('  |  '), size: 22 })],
            spacing: { after: 200 }
        }));
    }

    if (data.experience && data.experience.length > 0) {
        children.push(sectionHeader('EXPERIENCE'));
        data.experience.forEach(exp => {
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: exp.title || '', bold: true, size: 22 }),
                    new TextRun({ text: exp.company ? ' at ' + exp.company : '', size: 22 })
                ],
                spacing: { after: 50 }
            }));
            if (exp.dates) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: exp.dates, italics: true, size: 20 })],
                    spacing: { after: 50 }
                }));
            }
            if (exp.bullets && exp.bullets.length > 0) {
                exp.bullets.forEach(b => {
                    children.push(new Paragraph({
                        children: [new TextRun({ text: '\u2022  ' + b, size: 22 })],
                        indent: { left: 360 },
                        spacing: { after: 50 }
                    }));
                });
            }
            children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
        });
    }

    if (data.education && data.education.length > 0) {
        children.push(sectionHeader('EDUCATION'));
        data.education.forEach(edu => {
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: edu.degree || '', bold: true, size: 22 }),
                    new TextRun({ text: edu.school ? ' - ' + edu.school : '', size: 22 }),
                    new TextRun({ text: edu.year ? ' (' + edu.year + ')' : '', size: 20 })
                ],
                spacing: { after: 100 }
            }));
        });
    }

    const doc = new Document({
        sections: [{
            properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
            children
        }]
    });

    return await Packer.toBuffer(doc);
}

function sectionHeader(text) {
    return new Paragraph({
        children: [new TextRun({ text: text, bold: true, size: 24, underline: {} })],
        spacing: { before: 200, after: 100 }
    });
}

module.exports = { buildCoverLetterDocx, buildResumeDocx };
