const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.log('.env.local file not found');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

console.log('--- Env Keys Found ---');
lines.forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const parts = trimmed.split('=');
  const key = parts[0].trim();
  const value = parts.slice(1).join('=').trim();
  if (key) {
    const masked = value ? (value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : '***') : 'empty';
    console.log(`${key}: ${masked}`);
  }
});
