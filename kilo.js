#!/bin/env node
const readline = require('readline');
const pkg = require('./package');
let cx = 0;
let cy = 0;
let abuf = '';

readline.emitKeypressEvents(process.stdin);
function enableRawMode(){
  if(process.stdin.isTTY){
    process.stdin.setRawMode(true);
  }
}

function editorRefreshScreen(){
  abuf += "\x1b[?25l";
  abuf += "\x1b[H";
  editorDrawRows();
  const buf = `\x1b[${cy+1};${cx+1}H`;
  abuf += buf;
  abuf += "\x1b[?25h";
  abuf += "\x1b[?25h";
  process.stdout.write(abuf, abuf.length);
  abuf = '';
}

function editorReadKey(str, key) {
  switch(key.name){
    case 'q':
      if (key.ctrl){
        abuf = '';
        process.stdout.write("\x1b[2J",4);
        process.stdout.write("\x1b[H",3);
        process.exit();
      }
      break;
    case 'home':
      cx = 0;
      break;
    case 'end':
      cx = process.stdout.columns - 1;
      break;
    case 'pageup':
    case 'pagedown':
      let times = process.stdout.rows;
      while(times--) editorMoveCursor(key.name == 'pageup' ? 'up' : 'down');
      break;
    case 'h':
    case 'right':
    case 'l':
    case 'left':
    case 'k':
    case 'up':
    case 'j':
    case 'down':
      editorMoveCursor(key.name);
  }
  editorRefreshScreen();
}

function editorMoveCursor(key) {
  switch (key) {
    case 'h':
    case 'right':
      if(cx > 0) cx--;
      break;
    case 'l':
    case 'left':
      if(cx < process.stdout.columns - 1) cx++;
      break;
    case 'k':
    case 'up':
      if(cy > 0) cy--;
      break;
    case 'j':
    case 'down':
      if(cy < process.stdout.rows - 1) cy++;
      break;
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
        abuf += "~";
        padding--;
      }
      while (padding-- > 0)abuf += " ";
      abuf += welcome;
    } else {
      abuf += "~";
    }
    abuf += "\x1b[K";
    if (y < process.stdout.rows - 1) {
      abuf += "\r\n";
    }
  }
}

function main(){
  enableRawMode();
  editorRefreshScreen();
  process.stdin.on('keypress', editorReadKey);
}

main();
