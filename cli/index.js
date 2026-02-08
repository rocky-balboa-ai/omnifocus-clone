#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Config paths
const CONFIG_DIR = path.join(process.env.HOME, '.config/omnifocus');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const TOKEN_PATH = path.join(CONFIG_DIR, 'token.json');

// Load config
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {}
  return null;
}

// Save config
function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Load cached token
function loadToken() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      if (data.expiry > Date.now()) {
        return data.token;
      }
    }
  } catch (e) {}
  return null;
}

// Save token
function saveToken(token, expiresIn) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify({
    token,
    expiry: Date.now() + (expiresIn * 1000) - 60000 // 1 min buffer
  }));
}

// Prompt for input
function prompt(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    if (hidden) {
      process.stdout.write(question);
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      
      let password = '';
      const onData = (char) => {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          console.log();
          rl.close();
          resolve(password);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007F' || char === '\b') {
          password = password.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(question + '*'.repeat(password.length));
        } else {
          password += char;
          process.stdout.write('*');
        }
      };
      stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

// HTTP request helper
function request(method, baseUrl, urlPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + urlPath);
    const isHttps = url.protocol === 'https:';
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = (isHttps ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Get authenticated token
async function getToken(config) {
  // Check for cached token first
  const cached = loadToken();
  if (cached) return cached;
  
  // Get fresh token
  const res = await request('POST', config.apiUrl, '/api/auth/login', {
    username: config.username,
    password: config.password
  });
  
  if (res.status === 201 || res.status === 200) {
    saveToken(res.data.accessToken, res.data.expiresIn || 5184000);
    return res.data.accessToken;
  }
  throw new Error('Authentication failed. Run: omnifocus configure');
}

// API call wrapper
async function api(config, method, path, body = null) {
  const token = await getToken(config);
  return request(method, config.apiUrl, path, body, token);
}

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((d - now) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return `\x1b[31m${d.toLocaleDateString()}\x1b[0m`;
  if (diff === 0) return `\x1b[33m${d.toLocaleDateString()}\x1b[0m`;
  return d.toLocaleDateString();
}

// Require config helper
function requireConfig() {
  const config = loadConfig();
  if (!config) {
    console.error('❌ Not configured. Run: omnifocus configure');
    process.exit(1);
  }
  return config;
}

// Commands
const commands = {
  // Configure CLI
  async configure(args) {
    console.log('\n🔧 OmniFocus CLI Configuration\n');
    
    const existingConfig = loadConfig();
    
    const apiUrl = await prompt(`API URL [${existingConfig?.apiUrl || 'https://api-omnifocus.mycyborg.ai'}]: `);
    const username = await prompt(`Username [${existingConfig?.username || ''}]: `);
    const password = await prompt('Password: ', true);
    
    const config = {
      apiUrl: apiUrl || existingConfig?.apiUrl || 'https://api-omnifocus.mycyborg.ai',
      username: username || existingConfig?.username || '',
      password: password || existingConfig?.password || ''
    };
    
    // Test connection
    console.log('\nTesting connection...');
    try {
      const res = await request('POST', config.apiUrl, '/api/auth/login', {
        username: config.username,
        password: config.password
      });
      
      if (res.status === 200 || res.status === 201) {
        saveConfig(config);
        saveToken(res.data.accessToken, res.data.expiresIn || 5184000);
        console.log('✅ Configuration saved! You\'re ready to go.\n');
      } else {
        console.error('❌ Authentication failed:', res.data.message || 'Invalid credentials');
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Connection failed:', e.message);
      process.exit(1);
    }
  },

  // Show current config
  async config(args) {
    const config = loadConfig();
    if (!config) {
      console.log('Not configured. Run: omnifocus configure');
      return;
    }
    console.log('\n📋 Current Configuration:\n');
    console.log(`  API URL:  ${config.apiUrl}`);
    console.log(`  Username: ${config.username}`);
    console.log(`  Password: ${'*'.repeat(config.password?.length || 0)}`);
    console.log(`\n  Config file: ${CONFIG_PATH}\n`);
  },

  // List actions
  async list(args) {
    const config = requireConfig();
    const params = new URLSearchParams();
    
    if (args.includes('--flagged')) params.set('flagged', 'true');
    if (args.includes('--overdue')) params.set('overdue', 'true');
    if (args.includes('--today')) params.set('dueToday', 'true');
    if (args.includes('--rocky')) params.set('managedBy', 'rocky');
    if (args.includes('--inbox')) params.set('inbox', 'true');
    
    const statusArg = args.find(a => a.startsWith('--status='));
    if (statusArg) params.set('rockyStatus', statusArg.split('=')[1]);
    
    const categoryArg = args.find(a => a.startsWith('--category='));
    if (categoryArg) params.set('category', categoryArg.split('=')[1]);
    
    const priorityArg = args.find(a => a.startsWith('--priority='));
    if (priorityArg) params.set('priority', priorityArg.split('=')[1]);
    
    const limitArg = args.find(a => a.startsWith('--limit='));
    if (limitArg) params.set('limit', limitArg.split('=')[1]);
    
    const query = params.toString() ? '?' + params.toString() : '';
    const res = await api(config, 'GET', '/api/actions' + query);
    
    if (res.status !== 200) {
      console.error('Error:', res.data);
      return;
    }
    
    const actions = Array.isArray(res.data) ? res.data : (res.data.data || []);
    
    if (actions.length === 0) {
      console.log('No tasks found.');
      return;
    }
    
    if (args.includes('--json')) {
      console.log(JSON.stringify(actions, null, 2));
      return;
    }
    
    console.log(`\n📋 Tasks (${actions.length}):\n`);
    for (const a of actions) {
      const flag = a.flagged ? '🚩' : '  ';
      const status = a.rockyStatus ? `[${a.rockyStatus}]` : '';
      const due = a.dueDate ? `📅 ${formatDate(a.dueDate)}` : '';
      const project = a.project ? `📁 ${a.project.name}` : '';
      console.log(`${flag} ${a.title}`);
      console.log(`   ID: ${a.id.slice(0,8)} ${status} ${due} ${project}`);
      if (a.note) console.log(`   📝 ${a.note.slice(0, 60)}...`);
      console.log();
    }
  },

  // Show single action
  async show(args) {
    const config = requireConfig();
    const id = args[0];
    if (!id) {
      console.error('Usage: omnifocus show <id>');
      return;
    }
    
    const res = await api(config, 'GET', `/api/actions/${id}`);
    if (res.status !== 200) {
      console.error('Error:', res.data);
      return;
    }
    
    const a = res.data;
    console.log(`\n📌 ${a.title}\n`);
    console.log(`ID:       ${a.id}`);
    console.log(`Status:   ${a.status}`);
    console.log(`Flagged:  ${a.flagged ? 'Yes 🚩' : 'No'}`);
    console.log(`Due:      ${formatDate(a.dueDate)}`);
    console.log(`Defer:    ${formatDate(a.deferDate)}`);
    console.log(`Project:  ${a.project?.name || '-'}`);
    console.log(`Tags:     ${a.tags?.map(t => t.name).join(', ') || '-'}`);
    console.log(`Rocky:    ${a.managedBy || '-'} / ${a.rockyStatus || '-'}`);
    console.log(`Category: ${a.category || '-'}`);
    console.log(`Priority: ${a.priority || '-'}`);
    if (a.note) console.log(`\nNote:\n${a.note}`);
    if (a.activityLog?.length) {
      console.log(`\nActivity Log:`);
      for (const log of a.activityLog.slice(-5)) {
        console.log(`  [${new Date(log.timestamp).toLocaleString()}] ${log.author}: ${log.note}`);
      }
    }
  },

  // Add action
  async add(args) {
    const config = requireConfig();
    const title = args.filter(a => !a.startsWith('--')).join(' ');
    if (!title) {
      console.error('Usage: omnifocus add "Task title" [options]');
      return;
    }
    
    const body = { title };
    
    if (args.includes('--flag')) body.flagged = true;
    if (args.includes('--rocky')) body.managedBy = 'rocky';
    
    const dueArg = args.find(a => a.startsWith('--due='));
    if (dueArg) body.dueDate = dueArg.split('=')[1];
    
    const noteArg = args.find(a => a.startsWith('--note='));
    if (noteArg) body.note = noteArg.split('=')[1];
    
    const projectArg = args.find(a => a.startsWith('--project='));
    if (projectArg) body.projectId = projectArg.split('=')[1];
    
    const categoryArg = args.find(a => a.startsWith('--category='));
    if (categoryArg) body.category = categoryArg.split('=')[1];
    
    const priorityArg = args.find(a => a.startsWith('--priority='));
    if (priorityArg) body.priority = priorityArg.split('=')[1];
    
    const statusArg = args.find(a => a.startsWith('--status='));
    if (statusArg) body.rockyStatus = statusArg.split('=')[1];
    
    const res = await api(config, 'POST', '/api/actions', body);
    if (res.status === 201) {
      console.log(`✅ Created: ${res.data.title} (${res.data.id.slice(0,8)})`);
    } else {
      console.error('Error:', res.data);
    }
  },

  // Complete action
  async complete(args) {
    const config = requireConfig();
    const id = args[0];
    if (!id) {
      console.error('Usage: omnifocus complete <id>');
      return;
    }
    
    const res = await api(config, 'POST', `/api/actions/${id}/complete`);
    if (res.status === 200 || res.status === 201) {
      console.log(`✅ Completed: ${res.data.title}`);
    } else {
      console.error('Error:', res.data);
    }
  },

  // Update action
  async update(args) {
    const config = requireConfig();
    const id = args[0];
    if (!id) {
      console.error('Usage: omnifocus update <id> [options]');
      return;
    }
    
    const body = {};
    
    const titleArg = args.find(a => a.startsWith('--title='));
    if (titleArg) body.title = titleArg.split('=')[1];
    
    if (args.includes('--flag')) body.flagged = true;
    if (args.includes('--unflag')) body.flagged = false;
    
    const dueArg = args.find(a => a.startsWith('--due='));
    if (dueArg) body.dueDate = dueArg.split('=')[1];
    
    const noteArg = args.find(a => a.startsWith('--note='));
    if (noteArg) body.note = noteArg.split('=')[1];
    
    const statusArg = args.find(a => a.startsWith('--status='));
    if (statusArg) body.rockyStatus = statusArg.split('=')[1];
    
    const categoryArg = args.find(a => a.startsWith('--category='));
    if (categoryArg) body.category = categoryArg.split('=')[1];
    
    const priorityArg = args.find(a => a.startsWith('--priority='));
    if (priorityArg) body.priority = priorityArg.split('=')[1];
    
    const managedArg = args.find(a => a.startsWith('--managed='));
    if (managedArg) body.managedBy = managedArg.split('=')[1];
    
    if (Object.keys(body).length === 0) {
      console.error('No updates specified.');
      return;
    }
    
    const res = await api(config, 'PATCH', `/api/actions/${id}`, body);
    if (res.status === 200) {
      console.log(`✅ Updated: ${res.data.title}`);
    } else {
      console.error('Error:', res.data);
    }
  },

  // Add log entry
  async log(args) {
    const config = requireConfig();
    const id = args[0];
    const note = args.slice(1).filter(a => !a.startsWith('--')).join(' ');
    
    if (!id || !note) {
      console.error('Usage: omnifocus log <id> "Log message"');
      return;
    }
    
    const authorArg = args.find(a => a.startsWith('--author='));
    const author = authorArg ? authorArg.split('=')[1] : 'rocky';
    
    const res = await api(config, 'POST', `/api/actions/${id}/log`, { author, note });
    if (res.status === 200 || res.status === 201) {
      console.log(`✅ Log added to task`);
    } else {
      console.error('Error:', res.data);
    }
  },

  // Delete action
  async delete(args) {
    const config = requireConfig();
    const id = args[0];
    if (!id) {
      console.error('Usage: omnifocus delete <id>');
      return;
    }
    
    const res = await api(config, 'DELETE', `/api/actions/${id}`);
    if (res.status === 200) {
      console.log(`🗑️  Deleted task`);
    } else {
      console.error('Error:', res.data);
    }
  },

  // List projects
  async projects(args) {
    const config = requireConfig();
    const res = await api(config, 'GET', '/api/projects');
    if (res.status !== 200) {
      console.error('Error:', res.data);
      return;
    }
    
    if (args.includes('--json')) {
      console.log(JSON.stringify(res.data, null, 2));
      return;
    }
    
    console.log('\n📁 Projects:\n');
    for (const p of res.data) {
      const count = p._count?.actions || 0;
      console.log(`  ${p.name} (${count} tasks) - ${p.id.slice(0,8)}`);
    }
  },

  // List tags
  async tags(args) {
    const config = requireConfig();
    const res = await api(config, 'GET', '/api/tags');
    if (res.status !== 200) {
      console.error('Error:', res.data);
      return;
    }
    
    if (args.includes('--json')) {
      console.log(JSON.stringify(res.data, null, 2));
      return;
    }
    
    console.log('\n🏷️  Tags:\n');
    for (const t of res.data) {
      console.log(`  ${t.name} - ${t.id.slice(0,8)}`);
    }
  },

  // Health check
  async health(args) {
    const config = loadConfig();
    const url = config?.apiUrl || args[0] || 'https://api-omnifocus.mycyborg.ai';
    
    try {
      const res = await request('GET', url, '/api/health');
      console.log(res.status === 200 ? '✅ API is healthy' : '❌ API returned error');
      console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
      console.error('❌ Cannot reach API:', e.message);
    }
  },

  // Help
  help() {
    console.log(`
📋 OmniFocus CLI

Usage: omnifocus <command> [options]

Setup:
  configure          Configure API URL and credentials
  config             Show current configuration
  health [url]       Check API health

Task Commands:
  list [filters]     List tasks
    --flagged        Only flagged tasks
    --overdue        Only overdue tasks  
    --today          Due today
    --rocky          Managed by Rocky
    --inbox          Inbox items only
    --status=STATUS  Filter by rocky status
    --category=CAT   Filter by category
    --priority=PRI   Filter by priority
    --limit=N        Limit results
    --json           Output as JSON

  show <id>          Show task details
  
  add "title" [opts] Create a task
    --flag           Flag the task
    --due=DATE       Set due date (YYYY-MM-DD)
    --note="..."     Add a note
    --project=ID     Assign to project
    --rocky          Assign to Rocky
    --status=STATUS  Set Rocky status
    --category=CAT   Set category
    --priority=PRI   Set priority (high/medium/low)

  complete <id>      Mark task complete
  
  update <id> [opts] Update a task
    --title="..."    Change title
    --flag/--unflag  Toggle flag
    --due=DATE       Change due date
    --status=STATUS  Change Rocky status

  log <id> "msg"     Add activity log entry
  delete <id>        Delete a task

Other:
  projects [--json]  List projects
  tags [--json]      List tags
  help               Show this help

Rocky Status Values:
  inbox, todo, in_progress, waiting_on_fred, waiting_external, done, dropped

Categories:
  bills, documents, household, family, errands, health, finance, other

Examples:
  omnifocus configure
  omnifocus list --rocky --status=todo
  omnifocus add "Pay bill" --due=2026-02-15 --category=bills
  omnifocus complete abc123
`);
  }
};

// Main
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';
  const cmdArgs = args.slice(1);
  
  if (commands[cmd]) {
    try {
      await commands[cmd](cmdArgs);
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${cmd}`);
    commands.help();
    process.exit(1);
  }
}

main();
