#!/bin/env node
const readline = require('readline');
const pkg = require('./package');

readline.emitKeypressEvents(process.stdin);
function enableRawMode(){
  if(process.stdin.isTTY){
    process.stdin.setRawMode(true);
  }
}

function editorRefreshScreen(){
  process.stdout.write("\x1b[?25l", 6);
  process.stdout.write("\x1b[H", 3);
  editorDrawRows();
  let cx = 0;
  let cy = 0;
  const buf = `\x1b[${cy+1};${cx+1}H`;
  process.stdout.write(buf, buf.length);
  process.stdout.write("\x1b[?25h", 6);
}

function editorReadKey(str, key) {
  editorRefreshScreen();
  if (key.ctrl && key.name === 'q') {
    process.stdout.write("\x1b[2J", 4);
    process.stdout.write("\x1b[H", 3);
    process.exit();
  }
}

function editorDrawRows() {
  for (let y = 0; y < process.stdout.rows ; y++) {
    if (y == parseInt(process.stdout.rows / 3)) {
      const welcome = `Kilo editor -- version ${pkg.version}`;
      let welcomlen = welcome.length;
      if (welcomlen > process.stdout.columns) welcomlen = process.stdout.columns;
      let padding = parseInt((process.stdout.columns - welcomlen) / 2);
      if (padding > 0) {
        process.stdout.write("~", 1);
        padding--;
      }
      while (padding-- > 0)process.stdout.write(" ", 1);
      process.stdout.write(welcome,welcomlen);
    } else {
      process.stdout.write("~", 1);
    }
    process.stdout.write("\x1b[K", 3);
    if (y < process.stdout.rows - 1) {
      process.stdout.write("\r\n", 2);
    }
  }
}

function main(){
  enableRawMode();
  editorRefreshScreen();
  process.stdin.on('keypress', editorReadKey);
}

main();
