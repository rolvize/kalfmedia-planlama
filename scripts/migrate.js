const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Check if pg is installed, if not, install it automatically
try {
  require('pg');
} catch (e) {
  console.log("Required package 'pg' is missing. Installing it now...");
  const execSync = require('child_process').execSync;
  try {
    execSync('npm install pg', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log("'pg' package installed successfully.");
  } catch (err) {
    console.error("Failed to install 'pg' automatically. Please run 'npm install pg' manually.", err);
    process.exit(1);
  }
}

const { Client } = require('pg');

// Parse .env.local
const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  if (match) {
    supabaseUrl = match[1].trim();
  }
}

if (!supabaseUrl) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL was not found in your .env.local file.");
  process.exit(1);
}

// Extract project reference
const refMatch = supabaseUrl.match(/https:\/\/(.*)\.supabase\.co/);
if (!refMatch) {
  console.error("Error: Could not extract project reference from Supabase URL:", supabaseUrl);
  process.exit(1);
}

const projRef = refMatch[1];
const dbHost = `db.${projRef}.supabase.co`;

const schemaPath = path.join(__dirname, '../schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error("Error: schema.sql was not found in the project root directory.");
  process.exit(1);
}

const sql = fs.readFileSync(schemaPath, 'utf8');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("=========================================================");
console.log("Supabase PostgreSQL Database Migration Script");
console.log("=========================================================");
console.log(`Database Host: ${dbHost}`);
console.log("User:          postgres");
console.log("Database:      postgres");
console.log("=========================================================");

// Masked password reading
function askPassword(query) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(query);
    
    // Resume stdin
    stdin.resume();
    stdin.setEncoding('utf8');
    
    // Toggle raw mode for character masking
    stdin.setRawMode(true);
    
    let password = '';
    const onData = function (char) {
      char = char.toString('utf8');
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          // Stop raw mode and return
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          stdin.setRawMode(false);
          process.exit();
          break;
        case '\u007f': // Backspace on macOS
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    };
    
    stdin.on('data', onData);
  });
}

async function run() {
  const password = await askPassword("Please enter your Supabase Database Password: ");
  rl.close();
  
  if (!password) {
    console.error("Error: Password cannot be empty.");
    process.exit(1);
  }
  
  console.log("\nConnecting to Supabase PostgreSQL database...");
  const client = new Client({
    host: dbHost,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log("Connected successfully! Initializing database migration...");
    
    // Run schema.sql
    await client.query(sql);
    console.log("SUCCESS: All tables, policies, and triggers created successfully!");
  } catch (err) {
    console.error("\nERROR: Database migration failed!");
    console.error(err.message || err);
  } finally {
    await client.end();
  }
}

run();
