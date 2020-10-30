#!/bin/env node
const readline = require('readline');
const pkg = require('./package');
const fs = require('fs')
const os = require('os')
let cx = 0;
let cy = 0;
let abuf = '';
let erow = '';
let rowoff = 0;

readline.emitKeypressEvents(process.stdin);
function enableRawMode(){
  if(process.stdin.isTTY){
    process.stdin.setRawMode(true);
  }
}

function disableRawMode(){
  if(process.stdin.isTTY){
    process.stdin.setRawMode(false);
  }
}

function editorOpen(file){
  erow = fs.readFileSync(file, 'utf8').trim().split(os.EOL);
}
function editorScroll() {
  if (cy < rowoff) {
    rowoff = cy;
  }
  if (cy >= rowoff + process.stdout.rows) {
    rowoff = cy - process.stdout.rows + 1;
  }
}

function editorRefreshScreen(){
  editorScroll();
  abuf += "\x1b[?25l";
  abuf += "\x1b[H";
  editorDrawRows();
  const buf = `\x1b[${(cy - rowoff) + 1};${cx + 1}H`;
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
        disableRawMode();
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
      if(cy < erow.length) cy++;
      break;
  }
}

function editorDrawRows() {
  for (let y = 0; y < process.stdout.rows ; y++) {
    let filerow = y + rowoff;
    if (filerow >= erow.length) {
      if (erow.length == 0 && y == parseInt(process.stdout.rows / 3)) {
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
    } else {
      let len = erow[filerow].length;
      if(len > process.stdout.columns) len = process.stdout.columns;
      abuf += erow[filerow];
    }
    abuf += "\x1b[K";
    if (y < process.stdout.rows - 1) {
      abuf += "\r\n";
    }
  }
}

function main(){
  enableRawMode();
  const args = process.argv.slice(2);
  if(args.length > 0){
    editorOpen(args[0]);
  }
  editorRefreshScreen();
  process.stdin.on('keypress', editorReadKey);
}

main();
