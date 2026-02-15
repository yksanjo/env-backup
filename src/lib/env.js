const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { expandPath, getTimestamp } = require('../utils/helpers');
const logger = require('../utils/logger');

class EnvBackup {
  constructor() {
    this.snapshotDir = expandPath('~/.env-backup');
    this.excludeVars = ['HOME', 'USER', 'PATH', 'PWD', 'SHELL', 'TERM', 'TERM_PROGRAM', 'SSH_AUTH_SOCK', 'DISPLAY', 'LANG', 'LC_ALL', 'TZ', '_'];
  }

  async init() {
    await fs.ensureDir(this.snapshotDir);
  }

  captureEnvVars() {
    const env = process.env;
    const captured = {};
    for (const [key, value] of Object.entries(env)) {
      if (!this.excludeVars.includes(key)) {
        captured[key] = value;
      }
    }
    return captured;
  }

  async getShellHistory() {
    const history = { bash: [], zsh: [], fish: [] };
    const home = os.homedir();
    
    const bashHistoryPath = path.join(home, '.bash_history');
    if (fs.existsSync(bashHistoryPath)) {
      try {
        const content = fs.readFileSync(bashHistoryPath, 'utf8');
        history.bash = content.split('\n').filter(l => l && !l.startsWith('#'));
      } catch (e) {}
    }
    
    const zshHistoryPath = path.join(home, '.zsh_history');
    if (fs.existsSync(zshHistoryPath)) {
      try {
        const content = fs.readFileSync(zshHistoryPath, 'utf8');
        history.zsh = content.split('\n').filter(l => l && !l.startsWith('#'));
      } catch (e) {}
    }
    
    return history;
  }

  async getShellConfig() {
    const configs = {};
    const home = os.homedir();
    const configFiles = ['.bashrc', '.bash_profile', '.zshrc', '.zprofile', '.profile'];
    
    for (const configFile of configFiles) {
      const configPath = path.join(home, configFile);
      if (fs.existsSync(configPath)) {
        try {
          configs[configFile] = fs.readFileSync(configPath, 'utf8');
        } catch (e) {}
      }
    }
    return configs;
  }

  async captureState() {
    return {
      envVars: this.captureEnvVars(),
      shellHistory: await this.getShellHistory(),
      shellConfig: await this.getShellConfig(),
      capturedAt: new Date().toISOString()
    };
  }

  async saveSnapshot(name) {
    await this.init();
    
    const timestamp = getTimestamp();
    const snapshotName = name ? `${timestamp}_${name}` : timestamp;
    const snapshotPath = path.join(this.snapshotDir, snapshotName);
    
    await fs.ensureDir(snapshotPath);
    
    logger.progress('Capturing environment state...');
    const state = await this.captureState();
    
    await fs.writeJson(path.join(snapshotPath, 'state.json'), state, { spaces: 2 });
    
    logger.success(`Saved ${Object.keys(state.envVars).length} environment variables`);
    return { name: snapshotName, path: snapshotPath, state };
  }

  async loadSnapshot(name) {
    const snapshotPath = path.join(this.snapshotDir, name);
    if (!await fs.pathExists(snapshotPath)) {
      throw new Error(`Snapshot "${name}" not found`);
    }
    return await fs.readJson(path.join(snapshotPath, 'state.json'));
  }

  applyEnvVars(envVars) {
    for (const [key, value] of Object.entries(envVars)) {
      process.env[key] = value;
    }
    logger.success(`Applied ${Object.keys(envVars).length} environment variables`);
  }

  async listSnapshots() {
    await this.init();
    
    const entries = await fs.readdir(this.snapshotDir, { withFileTypes: true });
    const snapshots = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const statePath = path.join(this.snapshotDir, entry.name, 'state.json');
        if (await fs.pathExists(statePath)) {
          const state = await fs.readJson(statePath);
          const stats = await fs.stat(path.join(this.snapshotDir, entry.name));
          snapshots.push({
            name: entry.name,
            createdAt: state.capturedAt,
            envVars: Object.keys(state.envVars).length,
            size: stats.size
          });
        }
      }
    }
    
    snapshots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return snapshots;
  }

  async restoreSnapshot(name) {
    const state = await this.loadSnapshot(name);
    this.applyEnvVars(state.envVars);
    logger.success('Environment variables restored!');
  }

  async deleteSnapshot(name) {
    const snapshotPath = path.join(this.snapshotDir, name);
    if (!await fs.pathExists(snapshotPath)) {
      throw new Error(`Snapshot "${name}" not found`);
    }
    await fs.remove(snapshotPath);
    logger.success(`Deleted snapshot: ${name}`);
  }
}

module.exports = EnvBackup;
