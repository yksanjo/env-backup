const chalk = require('chalk');

const symbols = { success: '✓', error: '✗', info: '›', warning: '⚠', progress: '◐' };
const colors = { success: chalk.green, error: chalk.red, info: chalk.blue, warning: chalk.yellow, progress: chalk.cyan, muted: chalk.gray, bold: chalk.bold };

function success(m) { console.log(`${colors.success(symbols.success)} ${m}`); }
function error(m) { console.error(`${colors.error(symbols.error)} ${m}`); }
function info(m) { console.log(`${colors.info(symbols.info)} ${m}`); }
function warning(m) { console.log(`${colors.warning(symbols.warning)} ${m}`); }
function progress(m) { console.log(`${colors.progress(symbols.progress)} ${m}`); }
function header(m) { console.log(`\n${colors.bold(m)}\n`); }
function dim(m) { console.log(colors.muted(m)); }

module.exports = { success, error, info, warning, progress, header, dim, colors, symbols };
