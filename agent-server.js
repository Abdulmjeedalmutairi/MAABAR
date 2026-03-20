const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PROJECT_DIR = 'C:/Users/Mje_0/maabar';

const SYSTEM_PROMPT = `You are a Senior Frontend Developer specialized in B2B platforms.
Project: "Maabar" - connects Saudi buyers with Chinese suppliers.
Stack: React, Supabase, inline styles.
Brand colors: #1a1a1a (dark), #FAF8F4 (light bg), #e8e4de (border).
Background image URL: url('https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/hero-image/hero.png')
Rules:
- Never break existing imports or props
- Keep existing functionality intact
- Return ONLY valid JSON, no markdown, no extra text
- All string values in JSON must be on single lines (no unescaped newlines)`;

function getFile(filePath) {
  const full = path.join(PROJECT_DIR, filePath);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
}

function writeFile(filePath, content) {
  const full = path.join(PROJECT_DIR, filePath);
  fs.writeFileSync(full, content, 'utf8');
}

function getFileList() {
  const files = {};
  ['src/pages', 'src/components'].forEach(dir => {
    const full = path.join(PROJECT_DIR, dir);
    if (fs.existsSync(full)) {
      fs.readdirSync(full).forEach(f => {
        if (f.match(/\.(jsx|js|css)$/)) {
          files[`${dir}/${f}`] = fs.statSync(path.join(full, f)).size;
        }
      });
    }
  });
  return files;
}

app.post('/command', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.json({ error: 'no command' });

  try {
    const fileList = getFileList();
    const fileListStr = Object.entries(fileList)
      .map(([f, size]) => `${f} (${size} bytes)`)
      .join('\n');

    // Step 1: identify target file
    const step1 = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Files:\n${fileListStr}\n\nCommand: ${command}\n\nWhich file needs editing? Reply ONLY with JSON: {"file":"src/pages/X.jsx"}`
      }]
    });

    const step1Text = step1.content[0].text.trim();
    const step1Match = step1Text.match(/\{[^}]+\}/);
    if (!step1Match) return res.json({ error: 'Could not identify file' });

    const { file: targetFile } = JSON.parse(step1Match[0]);
    const fileContent = getFile(targetFile);
    if (!fileContent) return res.json({ error: `File not found: ${targetFile}` });

    // Step 2: get the edited file using streaming to handle large responses
    const step2 = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Here is the current content of ${targetFile}:\n\n${fileContent}\n\nCommand: ${command}\n\nReturn the complete edited file content as plain text only. No JSON, no markdown, no explanation. Just the raw code.`
      }]
    });

    let newContent = step2.content[0].text.trim();
    
    // Clean up if wrapped in markdown
    if (newContent.startsWith('```')) {
      newContent = newContent.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
    }

    writeFile(targetFile, newContent);

    exec(
      `cd C:/Users/Mje_0/maabar && git add . && git commit -m "agent update" && git push origin master`,
      (err, stdout, stderr) => {
        if (err) return res.json({ success: false, error: stderr, file: targetFile });
        res.json({ success: true, files: [targetFile], message: 'تم التعديل ✅' });
      }
    );

  } catch (e) {
    res.json({ error: e.message });
  }
});

app.listen(3001, () => console.log('✅ Agent server running on http://localhost:3001'));