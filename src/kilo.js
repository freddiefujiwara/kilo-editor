const readline = require('readline');
const pkg = require('../package');
const fs = require('fs');
const os = require('os');
const KILO_TAB_STOP = 8;
const MULTI_BYTE = 2;
/**
 * @classdesc This is Kilo class
 * @constructor
 */
class Kilo {
  /**
   * @constructor
   * @desc
   * <ul>
   * <li>initialize all E</li>
   * <li>this.buf = ''</li>
   * <li>set timeout after 5 sec statusmsg will be dismissed</li>
   * </ul>
   */
  constructor(argv) {
    readline.emitKeypressEvents(process.stdin);
    this.E = {
      cx: 0,
      rx: 0,
      cy: 0,
      erow: [],
      render: [],
      rowoff: 0,
      coloff: 0,
      dirty: 0,
      insert: false,
      screenrows: process.stdout.rows - 2,
      screencols: process.stdout.columns,
      filename: argv && argv.length > 0 ? argv[0] : undefined,
      statusmsg: ""
    };
    this.editorSetStatusMessage("HELP: Ctrl-S = save | Ctrl-Q = quit");
    this.abuf = '';
  }

  /**
   * exit if some error happened
   * @param {string} e - dying message
   * @param {int} status - exit status default: 1
   *
   */
  die(e,status){
    this.abuf = '';
    process.stdout.cursorTo(0,0);
    process.stdout.clearScreenDown();
    this.disableRawMode();
    console.error(e);
    process.exit(status || 1);
  }

  /**
   * set TTY rowmode
   *
   */
  enableRawMode() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
  }

  /**
   * clear TTY rowmode
   *
   */
  disableRawMode() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.resume();
    }
  }

  /**
   * open this.E.filename
   *
   * @desc
   * <ul>
   * <li>set erow // editor low</li>
   * <li>set render // for rendering low</li>
   * </ul>
   * @throws {Error} - ENOENT: no such file or directory, open this.filename
   *
   */
  editorOpen() {
    this.E.erow = fs.readFileSync(this.E.filename, 'utf8').trim().split(os.EOL);
    this.editorUpdateRow();
    this.E.dirty = 0;
  }

  /**
   * save to this.E.filename
   */
  editorSave() {
    const erows = this.E.erow.join(os.EOL);
    try{
      fs.writeFileSync(this.E.filename,erows);
      this.editorSetStatusMessage(`${erows.length} bytes written to disk`)
      this.E.dirty = 0;
    } catch (e) {
      this.editorSetStatusMessage(`${e.name}:${e.message}`);
    }
  }

  /**
   * show status message in 5 secs
   */
  editorSetStatusMessage(message){
    this.E.statusmsg = message;
    setTimeout(() => this.E.statusmsg = "", 5000);
  }

  /**
   * update render
   * @todo handle multibyte properly
   */
  editorUpdateRow() {
    this.E.render = this.E.erow.map((str) => str.replace(/\t/g," ".repeat(KILO_TAB_STOP)));
  }

  /**
   * insert single char for the row
   * @param {int} at - the target position
   * @param {char} c - char which will be inserted
   * @todo handle multibyte properly
   */
  editorRowInsertChar(at,c){
    if(this.E.cy == this.E.erow.length){
      this.editorInsertRow();
    }
    const row = this.E.erow[this.E.cy];
    this.E.erow[this.E.cy] = `${row.slice(0,at)}${c}${row.slice(at)}`;
    this.editorUpdateRow();
    this.E.dirty++;
  }

  /**
   * delete single char for the row
   * @param {int} at - the target position
   * @todo handle multibyte properly
   */
  editorRowDelChar(at){
    if(this.E.erow.length == 0) return;
    if(this.E.cy == this.E.erow.length) return;
    const row = this.E.erow[this.E.cy];
    const newRow = `${row.slice(0,at)}${row.slice(at+1)}`;
    if(newRow.length > 0){
      this.E.erow[this.E.cy] = newRow;
    } else {
      this.E.erow.splice(this.E.cy, 1)
      if(this.E.erow.length > 0 && this.E.cy > 0) this.E.cy--;
    }
    this.editorUpdateRow();
    this.E.dirty++;
  }

  /**
   * insert single char
   * @param {char} c - char which will be inserted
   * @todo handle multibyte properly
   */
  editorInsertChar(c){
    this.editorRowInsertChar(this.E.cx,c);
  }

  /**
   * insert one row
   * @param {char} c - char which will be inserted
   * @todo handle multibyte properly
   */
  editorInsertRow(){
    this.E.erow.splice(this.E.cy,0,"");
  }

  /**
   * delete single char
   * @todo handle multibyte properly
   */
  editorDelChar(c){
    this.editorRowDelChar(this.E.cx);
  }

  /**
   * calculate erow cx -> rx
   *
   * @desc
   * <ul>
   * <li>- treat \t</li>
   * <li>- treat unicode multibyte characters</li>
   * </ul>
   * @returns {int} rx - rx position
   * @todo handle multibyte properly
   */
  editorRowCxToRx(row,  cx) {
    let rx = 0;
    let  j;
    const chars = row.match(/./ug);
    for (j = 0; j < cx; j++) {
      if (chars[j] == '\t')
        rx += (KILO_TAB_STOP - 1) - (rx % KILO_TAB_STOP);
      if (/%[89ABab]/g.test(encodeURIComponent(chars[j])))
        rx += (MULTI_BYTE - 1) - (rx % MULTI_BYTE);
      rx++;
    }
    return rx;
  }

  /**
   * calculate scrolling offset
   *
   * @desc
   * <ul>
   * <li>handle rowoff</li>
   * <li>handle coloff</li>
   * </ul>
   *
   */
  editorScroll() {
    this.E.rx = 0;
    if (this.E.cy < this.E.erow.length) {
      this.E.rx = this.editorRowCxToRx(this.E.erow[this.E.cy], this.E.cx);
    }
    if (this.E.cy < this.E.rowoff) {
      this.E.rowoff = this.E.cy;
    }
    if (this.E.cy >= this.E.rowoff + this.E.screenrows) {
      this.E.rowoff = this.E.cy - this.E.screenrows + 1;
    }
    if (this.E.rx < this.E.coloff) {
      this.E.coloff = this.E.rx;
    }
    if (this.E.rx >= this.E.coloff + this.E.screencols) {
      this.E.coloff = this.E.rx - this.E.screencols + 1;
    }
  }

  /**
   * refresh screen
   *
   * @desc
   * <ul>
   * <li>hide cursor</li>
   * <li>draw rows (file contents)</li>
   * <li>draw status bar</li>
   * <li>draw message bar</li>
   * <li>set cursor proper position (rx,cy)</li>
   * <li>show cursor</li>
   * </ul>
   *
   */
  editorRefreshScreen() {
    this.editorScroll();
    this.abuf += "\x1b[?25l"; // hide cursor
    this.abuf += "\x1b[H";    // set ursor 0,0
    this.editorDrawRows();
    this.editorDrawStatusBar();
    this.editorDrawMessageBar();
    this.abuf += `\x1b[${(this.E.cy - this.E.rowoff) + 1};${(this.E.rx - this.E.coloff) + 1}H`; // set cursor position
    this.abuf += "\x1b[?25h"; // show cursor
    process.stdout.write(this.abuf, this.abuf.length);
    this.abuf = '';
  }

  /**
   * handle key action
   * @param {string} str - captured str (not used in this class)
   * @param {Object} key - captured key information
   * @throws {Error}
   */
  editorReadKey(str, key) {
    try{
      this.E.statusmsg = key.name;
      switch (key.name) {
        case 'q':
          if (key.ctrl) {
            this.die("BYE",0);
          }
          break;
        case 's':
          if (key.ctrl) {
            this.editorSave();
          }
          break;
        case 'home':
          this.E.cx = 0;
          break;
        case 'end':
          if (this.E.cy < this.E.erow.length)
            this.E.cx = this.E.erow[this.E.cy].length;
          break;
        case 'return':
          if(!this.E.insert){
            this.editorMoveCursor('down');
          } else {
            this.editorInsertRow();
            this.E.cx = 0;
            this.E.cy++;
            this.editorUpdateRow();
          }
          break;
        case 'o':
          if(!this.E.insert){
            if(key.sequence == "O"){
              this.editorInsertRow();
              this.E.cx = 0;
              this.E.cy++;
              this.editorUpdateRow();
              this.E.insert = true;
            }
          } else {
            this.editorInsertChar(key.sequence);
          }
          break;
        case 'backspace':
          this.editorMoveCursor('left');
        case 'x':
          if(this.E.insert){
            this.editorInsertChar(key.sequence);
            break;
          }
        case 'delete':
          this.editorDelChar();
          break;
        case 'pageup':
          this.E.cy = this.E.rowoff;
        case 'pagedown':
          {
            if (key.name == 'pagedown') {
              this.E.cy = this.E.rowoff + this.E.screenrows - 1;
              if (this.E.cy > this.E.erow.length) this.E.cy = this.E.erow.length;
            }
            let times = this.E.screenrows;
            while (times--) this.editorMoveCursor(key.name == 'pageup' ? 'up' : 'down');
          }
          break;
        case 'i':
          if(this.E.insert){
            this.editorInsertChar(key.sequence);
            break;
          }
        case 'insert':
          this.E.insert = true
          break;
        case 'h':
        case 'l':
        case 'k':
        case 'j':
          if(this.E.insert){
            this.editorInsertChar(key.sequence);
            break;
          }
        case 'left':
        case 'right':
        case 'up':
        case 'down':
          this.editorMoveCursor(key.name);
          break;
        case 'escape':
          this.E.insert = false;
          break;
        case 'f1':
        case 'f2':
        case 'f3':
        case 'f4':
        case 'f5':
        case 'f6':
        case 'f7':
        case 'f8':
        case 'f9':
        case 'f10':
        case 'f11':
        case 'f12':
          break;
        default:
          this.editorSetStatusMessage(`${JSON.stringify(key)}`);
          if(this.E.insert)
            this.editorInsertChar(key.sequence);
      }
      this.editorRefreshScreen();
    } catch(e) {
      this.die(e);
    }
  }

  /**
   * handle key action for cursor movement
   * @param {string} name - key.name
   */
  editorMoveCursor(name) {
    let row = (this.E.cy >= this.E.erow.length) ? undefined : this.E.erow[this.E.cy];
    switch (name) {
      case 'h':
      case 'left':
        if (this.E.cx > 0) {
          this.E.cx--;
        } else if (this.E.cy > 0) {
          this.E.cy--;
          this.E.cx = this.E.erow[this.E.cy].length;
        }
        break;
      case 'l':
      case 'right':
        if (row && this.E.cx < row.length) {
          this.E.cx++;
        } else if (row !== undefined && this.E.cx == row.length) {
          this.E.cy++;
          this.E.cx = 0;
        }
        break;
      case 'k':
      case 'up':
        if (this.E.cy > 0) this.E.cy--;
        break;
      case 'j':
      case 'down':
        if (this.E.cy < this.E.erow.length) this.E.cy++;
        break;
    }
    row = (this.E.cy >= this.E.erow.length) ? undefined : this.E.erow[this.E.cy];
    const rowlen = row ? row.length : 0;
    if (this.E.cx > rowlen) {
      this.E.cx = rowlen;
    }
  }

  /**
   * drow status bar
   */
  editorDrawStatusBar() {
    this.abuf += "\x1b[7m"; // invert the colors. (usually black -> white)
    const status = `${this.E.filename ? this.E.filename : "[No Name]"} - ${this.E.erow.length} lines ${this.E.dirty > 0 ? "(modified)" : ""} - ${this.E.insert ? "INSERT" : "NOT INSERT"}`;
    let len = status.length;
    const rstatus = `${this.E.cy + 1}/${this.E.erow.length}`;
    if (len > this.E.screencols) len = this.E.screencols;
    this.abuf += status.substring(0, len);
    while (len < this.E.screencols) {
      if (this.E.screencols - len == rstatus.length) {
        this.abuf += rstatus;
        break;
      } else {
        this.abuf += " ";
        len++;
      }
    }
    this.abuf += "\x1b[m"; // revert the colors. (usually white -> black)
    this.abuf += os.EOL;
  }

  /**
   * drow message bar
   */
  editorDrawMessageBar() {
    this.abuf += "\x1b[K"; //remove all chars after the cursor position
    this.abuf += this.E.statusmsg.length > this.E.screencols ? this.E.statusmsg.substring(0, this.E.screencols) : this.E.statusmsg;
  }

  /**
   * drow file contents
   */
  editorDrawRows() {
    for (let y = 0; y < this.E.screenrows; y++) {
      let filerow = y + this.E.rowoff;
      if (filerow >= this.E.erow.length) {
        if (this.E.erow.length == 0 && y == parseInt(this.E.screenrows / 3)) {
          const welcome = `Kilo editor -- version ${pkg.version}`;
          let welcomlen = welcome.length;
          if (welcomlen > this.E.screencols) welcomlen = this.E.screencols;
          let padding = parseInt((this.E.screencols - welcomlen) / 2);
          if (padding > 0) {
            this.abuf += "~";
            padding--;
          }
          while (padding-- > 0) this.abuf += " ";
          this.abuf += welcome;
        } else {
          this.abuf += "~";
        }
      } else {
        let len = this.E.render[filerow].length - this.E.coloff;
        if (len < 0) len = 0;
        if (len > this.E.screencols) len = this.E.screencols;
        this.abuf += this.E.render[filerow].substring(this.E.coloff, this.E.coloff + len);
      }
      this.abuf += "\x1b[K"; //remove all chars after the cursor position
      this.abuf += os.EOL;
    }
  }

  /**
   * main function
   */
  main() {
    try{
      this.enableRawMode();
      if (this.E.filename !== undefined) {
        this.editorOpen();
      }
      this.editorRefreshScreen();
      process.stdin.on('keypress', this.editorReadKey.bind(this));
    } catch(e) {
      this.die(e);
    }
  }
}
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Kilo;
} else {
  window.Kilo = Kilo;
}
