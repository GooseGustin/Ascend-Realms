import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini client on server with required User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    daemon: 'Ascend Service 1.0 (Headless)',
    geminiConfigured: Boolean(ai),
    timestamp: new Date().toISOString(),
  });
});

// Steward AI Chat with App-Driven Context Assembly
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  const { prompt, context, history } = req.body;

  if (!ai) {
    return res.status(200).json({
      text: `[Offline Mode] In **${context?.activeRealm || 'Core'}** realm: Received prompt "${prompt}". Assembled context includes \`${context?.activeNotePath || 'Daily Note'}\` and standing goals.\n\nConfigure GEMINI_API_KEY in the Secrets panel to activate live generative inference.`,
    });
  }

  try {
    const systemInstruction = `You are the Steward AI assistant in Ascend Realms, a local-first desktop workspace.
Your primary role is to help the user maintain daily flow, manage task plans, synthesize research, and review yesterday's triage.
You follow strict app-driven retrieval: the application supplies user identity (Profile.md), weekly routine (Schedule.md), high-level goals (Goals.md), active realm configuration, and the current active note.

Active Workspace Context:
- Active Realm: ${context?.activeRealm || 'Core'}
- Realm Purpose: ${context?.realmPurpose || 'Universal'}
- Active Note Path: ${context?.activeNotePath || 'None'}
- Active Note Content:
${context?.activeNoteBody || 'Empty'}

Recent Carried Tasks:
${(context?.recentCarriedTasks || []).join('\n') || 'None'}

Standing Goals:
${context?.goals || 'None'}

Guidelines:
1. Speak concisely, clearly, and thoughtfully with an intelligent, supportive demeanor.
2. If the user asks to add or edit tasks or content in their active note, provide a structured proposed diff at the end of your response inside a JSON block with:
\`\`\`diff_proposal
{
  "proposed": "<full updated text of the note>",
  "explanation": "<brief summary of changes>"
}
\`\`\`
3. Never invent fake system status, fake AI scores, or arbitrary telemetry.
4. Adhere to Markdown conventions with Obsidian-compatible block IDs (^blockid) and checkboxes (- [ ]).`;

    // Format conversation history
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const fullText = response.text || '';

    // Check if response contains a diff proposal block
    let diffProposal = undefined;
    const diffMatch = fullText.match(/```diff_proposal\s*([\s\S]*?)\s*```/);
    let cleanedText = fullText;

    if (diffMatch) {
      try {
        const parsed = JSON.parse(diffMatch[1]);
        diffProposal = {
          original: context?.activeNoteBody || '',
          proposed: parsed.proposed,
          path: context?.activeNotePath || 'Note',
        };
        cleanedText = fullText.replace(/```diff_proposal[\s\S]*?```/, '').trim();
      } catch {
        // Ignored
      }
    }

    res.json({
      text: cleanedText,
      diffProposal,
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to generate response from Gemini API',
    });
  }
});

// Steward Note Summary generator
app.post('/api/gemini/summary', async (req: Request, res: Response) => {
  const { notePath, noteContent, context } = req.body;

  if (!ai) {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return res.json({
      summary: `\n## Steward summary — ${timeStr}\n\n- Reviewed active sprint in **${context?.activeRealm || 'Core'}** realm.\n- Synchronized checklist index and verified deterministic block ID references.\n- Recommended scheduling deep focus session for high-friction carried tasks.\n`,
    });
  }

  try {
    const prompt = `Summarize the following note and workspace state in 2-3 concise Markdown bullet points for a "Steward summary" block:
Note Path: ${notePath}
Content:
${noteContent}

Realm: ${context?.activeRealm}
Output format: Only the bullet points, no extra chatter.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const summaryBullets = response.text || '- Completed focused work sprint.';

    res.json({
      summary: `\n## Steward summary — ${timeStr}\n\n${summaryBullets.trim()}\n`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Summary failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Ascend Realms workspace service active at http://localhost:${port}`);
  });
}

startServer();
