#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.MAABAR_SUPABASE_URL || 'https://utzalmszfqfcofywfetv.supabase.co';
const SUPABASE_ANON_KEY = process.env.MAABAR_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
const ADMIN_JWT = process.env.MAABAR_ADMIN_JWT || '';
const requestFile = process.argv[2] || 'docs/demo-marketplace-seed/seed-demo-auth-users.request.example.json';

if (!ADMIN_JWT) {
  console.error('Missing MAABAR_ADMIN_JWT.');
  console.error('Example: MAABAR_ADMIN_JWT="<admin access token>" node scripts/invoke_demo_seed_auth_users.js');
  process.exit(1);
}

const requestPath = path.resolve(process.cwd(), requestFile);
if (!fs.existsSync(requestPath)) {
  console.error(`Request file not found: ${requestPath}`);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
} catch (error) {
  console.error(`Failed to parse JSON request file: ${requestPath}`);
  console.error(error);
  process.exit(1);
}

async function main() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/seed-demo-auth-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADMIN_JWT}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let parsed = text;

  try {
    parsed = JSON.parse(text);
  } catch {
    // keep raw text
  }

  if (!response.ok) {
    console.error(`seed-demo-auth-users failed with HTTP ${response.status}`);
    console.error(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));
    process.exit(1);
  }

  console.log(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
