#!/bin/env node
const readline = require('readline');

readline.emitKeypressEvents(process.stdin);
function enableRawMode(){
  process.stdin.setRawMode(true);
}

function editorRefreshScreen(){
  process.stdout.write("\x1b[2J", 4);
  process.stdout.write("\x1b[H", 3);
}

function editorReadKey(str, key) {
  if (key.ctrl && key.name === 'q') {
    process.exit();
  }
};

function main(){
  enableRawMode();
  editorRefreshScreen();
  process.stdin.on('keypress', editorReadKey);
}

main();
