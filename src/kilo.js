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
   * @property 
   * <ul>
   * <li>initialize all E</li>
   * <li>this.buf = ''</li>
   * <li>initialize all E</li>
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
      screenrows: process.stdout.rows - 2,
      screencols: process.stdout.columns,
      filename: argv && argv.length > 0 ? argv[0] : undefined,
      statusmsg: "HELP: Ctrl-Q = quit"
    };
    setTimeout(() => this.E.statusmsg = "", 5000);
    this.abuf = '';
  }

  /**
   * exit if some error happened
   * @params {Error} e - thrown error
   *
   */
  die(e){
    this.abuf = '';
    process.stdout.write("\x1b[2J", 4);
    process.stdout.write("\x1b[H", 3);
    this.disableRawMode();
    console.error(e);
    process.exit(1);
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
   * @property 
   * <ul>
   * <li>set erow // editor low</li>
   * <li>set render // for rendering low</li>
   * </ul>
   * @throws {Error: ENOENT}
   *
   */
  editorOpen() {
    this.E.erow = fs.readFileSync(this.E.filename, 'utf8').trim().split(os.EOL);
    this.E.render = this.E.erow.map((str) => str.replace(/\t/g," ".repeat(KILO_TAB_STOP)));
  }

  /**
   * calculate erow cx -> rx
   * 
   * @property 
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
   * @property 
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
   * @property 
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
    this.abuf += "\x1b[?25l";
    this.abuf += "\x1b[H";
    this.editorDrawRows();
    this.editorDrawStatusBar();
    this.editorDrawMessageBar();
    this.abuf += `\x1b[${(this.E.cy - this.E.rowoff) + 1};${(this.E.rx - this.E.coloff) + 1}H`; //cursor
    this.abuf += "\x1b[?25h";
    process.stdout.write(this.abuf, this.abuf.length);
    this.abuf = '';
  }

  /**
   * handle key action
   * @params {string} str
   * @params {Object} key
   */
  editorReadKey(str, key) {
    switch (key.name) {
      case 'q':
        if (key.ctrl) {
          this.abuf = '';
          process.stdout.write("\x1b[2J", 4);
          process.stdout.write("\x1b[H", 3);
          this.disableRawMode();
          process.exit();
        }
        break;
      case 'home':
        this.E.cx = 0;
        break;
      case 'end':
        {
          if (this.E.cy < this.E.erow.length) this.E.cx = this.E.erow[this.E.cy].length;
        }
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
      case 'h':
      case 'left':
      case 'l':
      case 'right':
      case 'k':
      case 'up':
      case 'j':
      case 'down':
        this.editorMoveCursor(key.name);
    }
    this.editorRefreshScreen();
  }

  /**
   * handle key action for cursor movement
   * @params {string} key.name
   */
  editorMoveCursor(key) {
    let row = (this.E.cy >= this.E.erow.length) ? undefined : this.E.erow[this.E.cy];
    switch (key) {
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
    this.abuf += "\x1b[7m";
    const status = `${this.E.filename ? this.E.filename : "[No Name]"} - ${this.E.erow.length} lines`;
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
    this.abuf += "\x1b[m";
    this.abuf += os.EOL;
  }

  /**
   * drow message bar
   */
  editorDrawMessageBar() {
    this.abuf += "\x1b[K";
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
      this.abuf += "\x1b[K";
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
