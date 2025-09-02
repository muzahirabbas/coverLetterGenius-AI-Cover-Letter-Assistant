// src/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { dejavuFontBase64 } from './font'; // <-- IMPORT FONT DATA

// --- TYPE DEFINITIONS ---
type Bindings = {
  // Add any other bindings (KV, R2, D1, etc.) here
}

// --- INTERFACES ---
interface RequestPayload {
  resumeText: string;
  jobDescription: string;
  companyInfo: string;
  geminiApiKey: string;
  modelName: 'gemini-2.5-pro' | 'gemini-2.5-flash';
  // Optional fields from the frontend
  fullName?: string;
  email?: string;
  address?: string;
}
interface ExtractedInfo {
    fullName: string;
    email: string;
    phone: string;
    address: string;
}
interface GeneratedContent {
    companyName: string;
    hiringManagerName: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// --- MIDDLEWARE ---
app.use('/api/generate', cors());

// --- AI FUNCTIONS ---
async function callGemini(prompt: string, apiKey: string, modelName: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) {
        console.error("AI API Error:", await response.text());
        throw new Error(`AI API request failed with status ${response.status}`);
    }
    const data = await response.json();
    const jsonString = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonString) {
        throw new Error("Invalid response structure from AI API.");
    }
    const cleanedJsonString = jsonString.replace(/^```json\s*|```$/g, '');
    return JSON.parse(cleanedJsonString);
}
async function extractUserInfoFromCV(resumeText: string, apiKey: string, modelName: string): Promise<ExtractedInfo> {
  const prompt = `You are an expert data extraction bot. Your task is to parse the following resume text and extract the user's contact information. Identify the full name, email address, phone number, and mailing address (City and State is sufficient). If a piece of information is not found, return an empty string "" for that field. Return ONLY a raw JSON object with the keys: "fullName", "email", "phone", and "address". Do not add any other text or markdown. Resume Text:\n---\n${resumeText}\n---`;
  return callGemini(prompt, apiKey, modelName);
}
async function generateCoverLetterContent(payload: RequestPayload, userInfo: ExtractedInfo, apiKey: string, modelName: string): Promise<GeneratedContent> {
  const prompt = `You are an expert career coach. Your task is to write the body of a professional cover letter. Instructions: 1. Infer the Company Name and the Hiring Manager's Name from the Job Description and Company Info. If a specific name isn't available, use a generic title like "Hiring Manager". 2. Write three compelling body paragraphs for the cover letter. 3. Use the user's resume for their experience, and the job description for the requirements. 4. Paragraph 1 (Introduction): State the position from the job description and express enthusiasm. 5. Paragraph 2 (Body): Connect the user's experience to the job requirements. 6. Paragraph 3 (Closing): Use the "Company Info" to show genuine interest in the company. 7. Return ONLY a raw JSON object with keys: "companyName", "hiringManagerName", "paragraph1", "paragraph2", "paragraph3". User's Full Name: ${userInfo.fullName} User's Resume:\n---\n${payload.resumeText}\n--- Job Description:\n---\n${payload.jobDescription}\n--- Company Info:\n---\n${payload.companyInfo}\n---`;
  return callGemini(prompt, apiKey, modelName);
}

// --- PDF GENERATION FUNCTION ---
async function createPdf(userInfo: ExtractedInfo, content: GeneratedContent): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    function base64ToArrayBuffer(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    const fontBytes = base64ToArrayBuffer(dejavuFontBase64);
    const customFont = await pdfDoc.embedFont(fontBytes);
    
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const FONT_SIZE_HEADER = 14;
    const FONT_SIZE_BODY = 11;
    const LINE_HEIGHT = FONT_SIZE_BODY * 1.4;
    const MARGIN = 72;
    const BORDER_MARGIN = 40;
    const BORDER_COLOR = rgb(0.8, 0.8, 0.8);
    const TEXT_COLOR = rgb(0.1, 0.1, 0.1);
    
    let y = height - MARGIN;

    page.drawRectangle({
        x: BORDER_MARGIN,
        y: BORDER_MARGIN,
        width: width - 2 * BORDER_MARGIN,
        height: height - 2 * BORDER_MARGIN,
        borderColor: BORDER_COLOR,
        borderWidth: 1,
    });

    const drawLine = (text: string, size = FONT_SIZE_BODY) => {
        if (y < MARGIN || !text) return;
        page.drawText(text.trim(), { x: MARGIN, y, font: customFont, size, color: TEXT_COLOR });
        y -= size * 1.2;
    };
    
    const drawParagraph = (text: string) => {
        if (!text) return;
        const words = text.replace(/\s+/g, ' ').trim().split(' ');
        let currentLine = '';
        const maxWidth = width - 2 * MARGIN;

        for (const word of words) {
            const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
            const testWidth = customFont.widthOfTextAtSize(testLine, FONT_SIZE_BODY);
            if (testWidth > maxWidth) {
                drawLine(currentLine, FONT_SIZE_BODY);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine.length > 0) {
            drawLine(currentLine, FONT_SIZE_BODY);
        }
        y -= LINE_HEIGHT;
    };

    drawLine(userInfo.fullName, FONT_SIZE_HEADER);
    y -= 4;
    if (userInfo.address) drawLine(userInfo.address);
    if (userInfo.phone && userInfo.email) {
        drawLine(`${userInfo.phone} | ${userInfo.email}`);
    } else {
        if (userInfo.phone) drawLine(userInfo.phone);
        if (userInfo.email) drawLine(userInfo.email);
    }
    y -= LINE_HEIGHT * 1.5;

    const today = new Date();
    drawLine(today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    y -= LINE_HEIGHT * 1.5;

    const manager = content.hiringManagerName || "Hiring Manager";
    drawLine(manager);
    if (content.companyName) drawLine(content.companyName);
    y -= LINE_HEIGHT * 1.5;
    
    drawLine(`Dear ${manager},`);
    y -= LINE_HEIGHT;

    drawParagraph(content.paragraph1);
    drawParagraph(content.paragraph2);
    drawParagraph(content.paragraph3);

    drawParagraph('I am confident I possess the skills to excel in this role and am eager to discuss my qualifications further. Thank you for your time and consideration.');
    
    drawLine('Sincerely,');
    y -= LINE_HEIGHT * 3; // **FIX:** Increased space for signature
    drawLine(userInfo.fullName);

    return pdfDoc.save();
}

// --- API ENDPOINT ---
app.post('/api/generate', async (c) => {
  try {
    const payload = await c.req.json<RequestPayload>();
    const { geminiApiKey: apiKey, modelName } = payload;

    if (!apiKey) {
      return c.json({ error: 'Gemini API key was not provided.' }, 400);
    }

    // First, extract all info from the CV as a baseline.
    const extractedUserInfo = await extractUserInfoFromCV(payload.resumeText, apiKey, modelName);
    
    // Then, create the final user info object, overwriting with optional fields if they exist.
    const userInfo: ExtractedInfo = {
        fullName: payload.fullName || extractedUserInfo.fullName,
        email: payload.email || extractedUserInfo.email,
        address: payload.address || extractedUserInfo.address,
        phone: extractedUserInfo.phone, // Phone is always from CV
    };

    if (!userInfo.fullName || !userInfo.email) {
      return c.json({ error: 'Could not automatically extract Name and Email from the CV. Please fill in the optional fields.' }, 400);
    }

    const generatedContent = await generateCoverLetterContent(payload, userInfo, apiKey, modelName);
    
    const pdfBytes = await createPdf(userInfo, generatedContent);
    
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Cover-Letter-Genius.pdf"',
      },
    });
  } catch (error: any) {
    console.error(error);
    return c.json({ error: 'Failed to generate cover letter.', details: error.message }, 500);
  }
});

export default app;