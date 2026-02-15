#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const EnvBackup = require('./lib/env');
const logger = require('./utils/logger');
const { formatSize } = require('./utils/helpers');

const program = new Command();
const env = new EnvBackup();

async function main() {
  program
    .name('env-backup')
    .description('Save and restore environment variables')
    .version('1.0.0');

  program
    .command('save')
    .description('Save environment variables')
    .argument('[name]', 'Snapshot name')
    .action(async (name) => {
      try {
        logger.header('Saving Environment Backup');
        const result = await env.saveSnapshot(name);
        logger.success(`Snapshot saved: ${result.name}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  program
    .command('restore')
    .description('Restore environment variables')
    .argument('<name>', 'Snapshot name')
    .action(async (name) => {
      try {
        logger.header('Restoring Environment');
        await env.restoreSnapshot(name);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  program
    .command('list')
    .description('List saved snapshots')
    .action(async () => {
      try {
        const snapshots = await env.listSnapshots();
        if (snapshots.length === 0) {
          logger.info('No snapshots found');
          return;
        }
        logger.header('Environment Backups');
        console.log(chalk.bold('  Name') + ' '.repeat(45) + chalk.bold('Vars') + ' '.repeat(10) + chalk.bold('Size'));
        console.log(chalk.gray('─'.repeat(80)));
        for (const s of snapshots) {
          console.log(`  ${s.name}${' '.repeat(55 - s.name.length)}${s.envVars}${' '.repeat(15)}${formatSize(s.size)}`);
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  program
    .command('delete')
    .description('Delete a snapshot')
    .argument('<name>', 'Snapshot name')
    .action(async (name) => {
      try {
        await env.deleteSnapshot(name);
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  if (process.argv.length === 2) {
    program.parse(['node', 'env-backup', '--help']);
  } else {
    program.parse(process.argv);
  }
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error.message);
  process.exit(1);
});
