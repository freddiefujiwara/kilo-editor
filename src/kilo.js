"use strict";
const readline = require("readline");
const pkg = require("../package");
const fs = require("fs");
const os = require("os");
const KILO_TAB_STOP = 8;
const MULTI_BYTE = 2;
const SEARCHABLE_CHARS = /^[\ta-z0-9!"#$%&'()*+,./:;<=>?@[\]\\ ^_`{|}~-]$/ui;
const MODE = { NORMAL: 0, INSERT: 1, SEARCH: 2, COMMAND: 3 };

/**
 * @classdesc This is Kilo class
 * @constructor
 */
class Kilo {

    /**
     * JavaScript port for kilo.c
     * @param {Array} argv process.argv
     * @constructor
     * <ul>
     * <li>initialize all E</li>
     * <li>this.buf = ''</li>
     * <li>set timeout after 5 sec statusmsg will be dismissed</li>
     * </ul>
     */
    constructor(argv) {
        readline.emitKeypressEvents(process.stdin);
        this.E = { // editorConfig
            cx: 0, // cursor position x
            cy: 0, // cursor position y
            rx: 0, // rendered cursor position x
            rowoff: 0, // row offset
            coloff: 0, // column offset
            erow: [], // editing row
            render: [], // rendering row
            screenrows: process.stdout.rows - 2, // screen size(rows) -  status bar and message bar
            screencols: process.stdout.columns, // screen size(columns)
            statusmsg: "", // status message
            dirty: 0 // modified flag
        };
        if (argv && argv.length > 0) {
            this.E.filename = argv[0];
        }
        this.editorSetStatusMessage("HELP): k:up/j:down/l:right/h:left | i:insert | /:search | :w save/ :q quit/ :wq save & quit");
        this.backup = {}; // for undo
        this.mode = MODE.NORMAL; // mode;
        this.sx = [];// searched cursor position x
        this.sy = []; // searched cursor position y
        this.si = 0; // searched index
        this.abuf = ""; // for draw
        this.scbuf = ""; // for search
        this.ybuf = ""; // for yank
        this.prev = ""; // for 2 setp commnd ex) dd yy
    }

    /**
     * exit if some error happened
     * @param {string} e dying message
     * @param {int} status exit status default: 1
     * @returns {void}
     *
     */
    die(e, status) {
        this.abuf = "";
        process.stdout.cursorTo(0, 0);
        process.stdout.clearScreenDown();
        Kilo.disableRawMode();
        console.error(e);
        process.exit(typeof status === "undefined" ? 1 : parseInt(status, 10));
    }

    /**
     * set TTY rowmode
     * @returns {void}
     *
     *
     */
    static enableRawMode() {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
    }

    /**
     * clear TTY rowmode
     * @returns {void}
     *
     *
     */
    static disableRawMode() {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            process.stdin.resume();
        }
    }

    /**
     * open this.E.filename
     * @description
     * <ul>
     * <li>set erow // editor low</li>
     * <li>set render // for rendering low</li>
     * </ul>
     * @throws {Error} - ENOENT: no such file or directory, open this.filename
     * @returns {void}
     *
     */
    editorOpen() {
        this.E.erow = fs.readFileSync(this.E.filename, "utf8").trim().split(os.EOL);
        this.editorUpdateRow();
        this.E.dirty = 0;
    }

    /**
     * save to this.E.filename
     * @returns {void}
     */
    editorSave() {
        const erows = this.E.erow.join(os.EOL);

        try {
            fs.writeFileSync(this.E.filename, erows);
            this.editorSetStatusMessage(`${erows.length} bytes written to disk`);
            this.E.dirty = 0;
        } catch (e) {
            this.editorSetStatusMessage(`${e.name}:${e.message}`);
        }
    }

    /**
     * show status message in 5 secs
     * @param {string} message status message
     * @returns {void}
     */
    editorSetStatusMessage(message) {
        this.E.statusmsg = message;
        setTimeout(() => {
            this.E.statusmsg = "";
        }, 5000);
    }

    /**
     * update render
     * @todo handle multibyte properly
     * @returns {void}
     */
    editorUpdateRow() {
        this.E.render = this.E.erow.map(str => str.replace(/\t/ug, " ".repeat(KILO_TAB_STOP)));
    }

    /**
     * insert single char
     * @param {char} c char which will be inserted
     * @todo handle multibyte properly
     * @returns {void}
     */
    editorInsertChar(c) {
        this.backup = JSON.stringify(this.E);
        if (this.E.cy === this.E.erow.length) {
            this.editorInsertRow();
        }
        let pos = this.E.cx;
        const row = this.E.erow[this.E.cy];

        if (this.E.cx < 0 || this.E.cx > row.length) {
            pos = row.length;
        }

        this.E.erow[this.E.cy] = `${row.slice(0, pos)}${c}${row.slice(pos)}`;
        this.editorUpdateRow();
        this.editorMoveCursor("right");
        this.E.dirty++;
    }

    /**
     * insert one row
     * @param {string} insert string which will be inserted
     * @todo handle multibyte properly
     * @returns {void}
     */
    editorInsertRow(insert) {
        this.backup = JSON.stringify(this.E);
        this.E.erow.splice(this.E.cy, 0, insert || "");
        this.E.dirty++;
    }

    /**
     * delete single char
     * @todo handle multibyte properly
     * @returns {void}
     */
    editorDelChar() {
        if (this.E.erow.length === 0) {
            return;
        }
        if (this.E.erow.length <= this.E.cy) {
            return;
        }
        const row = this.E.erow[this.E.cy];
        const newRow = `${row.slice(0, this.E.cx)}${row.slice(this.E.cx + 1)}`;

        if (newRow.length > 0) {
            this.E.erow[this.E.cy] = newRow;
        } else {
            this.E.erow.splice(this.E.cy, 1);
            if (this.E.erow.length > 0 && this.E.cy > 0) {
                this.E.cy--;
            }
        }
        this.editorUpdateRow();
        this.E.dirty++;
    }

    /**
     * calculate erow cx -> rx
     * @param {string} row target row
     * @param {int} cx  - target cx
     * @description
     * <ul>
     * <li>- treat \t</li>
     * <li>- treat unicode multibyte characters</li>
     * </ul>
     * @returns {int} rx - rx position
     * @todo handle multibyte properly
     */
    static editorRowCxToRx(row, cx) {
        const chars = row.match(/./ug);
        let rx = 0;

        for (let j = 0; j < cx; j++) {
            if (chars[j] === "\t") { // tab
                rx += (KILO_TAB_STOP - 1) - (rx % KILO_TAB_STOP);
            }
            if (/%[89ABab]/ug.test(encodeURIComponent(chars[j]))) { // multibyte
                rx += (MULTI_BYTE - 1) - (rx % MULTI_BYTE);
            }
            rx++;
        }
        return rx;
    }

    /**
     * calculate scrolling offset
     * @description
     * <ul>
     * <li>handle rowoff</li>
     * <li>handle coloff</li>
     * </ul>
     * @returns {void}
     *
     */
    editorScroll() {
        this.E.rx = 0;
        if (this.E.cy < this.E.erow.length) { // calculate rx if cursor is in the file
            this.E.rx = Kilo.editorRowCxToRx(this.E.erow[this.E.cy], this.E.cx);
        }
        if (this.E.cy < this.E.rowoff) { // move cy to the top of the window if cy is off the top of the scrolling window
            this.E.rowoff = this.E.cy;
        }
        if (this.E.cy >= this.E.rowoff + this.E.screenrows) { // move cy to the bottom of the window if cy is off the bottom of the scrolling window
            this.E.rowoff = this.E.cy - this.E.screenrows + 1;
        }
        if (this.E.rx < this.E.coloff) { // move rx to the left of the window if rx is off the left of the scrolling window
            this.E.coloff = this.E.rx;
        }
        if (this.E.rx >= this.E.coloff + this.E.screencols) { // move rx to the right of the window if rx is off the right of the scrolling window
            this.E.coloff = this.E.rx - this.E.screencols + 1;
        }
    }

    /**
     * refresh screen
     * @description
     * <ul>
     * <li>hide cursor</li>
     * <li>draw rows (file contents)</li>
     * <li>draw status bar</li>
     * <li>draw message bar</li>
     * <li>set cursor proper position (rx,cy)</li>
     * <li>show cursor</li>
     * </ul>
     * @returns {void}
     *
     */
    editorRefreshScreen() {
        this.editorScroll();
        this.abuf += "\x1b[?25l"; // hide cursor
        this.abuf += "\x1b[H"; // set ursor 0,0
        this.editorDrawRows();
        this.editorDrawStatusBar();
        this.editorDrawMessageBar();
        this.abuf += `\x1b[${(this.E.cy - this.E.rowoff) + 1};${(this.E.rx - this.E.coloff) + 1}H`; // set cursor position
        this.abuf += "\x1b[?25h"; // show cursor
        process.stdout.write(this.abuf, this.abuf.length);
        this.abuf = "";
    }

    /**
     * handle key action
     * @param {string} str captured str (not used in this class)
     * @param {Object} key captured key information
     * @throws {Error}
     * @returns {void}
     */
    editorReadKey(str, key) {
        try {
            if (key.meta) {
                this.mode = MODE.NORMAL;
            } else {
                let command = "";

                if (this.mode === MODE.NORMAL) {
                    if (typeof key.name === "undefined") { // not insert and not alphabet
                        switch (key.sequence) {
                            case "$":
                                this.editorMoveCursor("end");
                                break;
                            case "^":
                                this.editorMoveCursor("home");
                                break;
                            case "/":
                                this.mode = MODE.SEARCH;
                                this.sx = [];
                                this.sy = [];
                                this.scbuf = "";
                                this.si = 0;
                                command = `/${this.scbuf}`;
                                break;
                            case ":":
                                this.mode = MODE.COMMAND;
                                this.scbuf = "";
                                command = `:${this.scbuf}`;
                                break;
                            default:
                                break;
                        }
                    } else { // not insert and alphabet
                        this.editorMoveCursor(key.name, key.sequence);
                    }
                    this.prev = key.name;
                } else if (this.mode === MODE.INSERT) { // insert mode
                    if (SEARCHABLE_CHARS.test(key.sequence)) {
                        this.editorInsertChar(key.sequence);
                    } else if (key.name === "return") {
                        this.editorInsertRow();
                        this.editorMoveCursor("home");
                        this.editorMoveCursor("down");
                        this.editorUpdateRow();
                    } else {
                        this.editorMoveCursor(key.name, key.sequence);
                    }
                } else if (this.mode === MODE.SEARCH) {
                    switch (key.name) {
                        case "return":
                            this.mode = MODE.NORMAL;
                        case "backspace":
                        case "delete":
                            this.scbuf = "";
                            break;
                        case "right":
                        case "up":
                            this.si = (this.si + 1) % this.sx.length;
                            break;
                        case "left":
                        case "down":
                            this.si--;
                            if (this.si < 0) {
                                this.si = this.sx.length - 1;
                            }
                            break;
                        default:
                            if (SEARCHABLE_CHARS.test(key.sequence)) {
                                this.scbuf += key.sequence;
                                this.sx = [];
                                this.sy = [];
                                this.si = 0;
                                this.E.erow.forEach((r, y) => {
                                    [...r.matchAll(new RegExp(this.scbuf.replace(/[.*+?^${}()|[\]\\]/ug, "\\$&"), "ugi"))].forEach(m => {
                                        this.sx.push(m.index);
                                        this.sy.push(y);
                                    });
                                });
                            }
                    }
                    if (this.sx.length > this.si) {
                        this.E.cx = this.sx[this.si];
                        this.E.cy = this.sy[this.si];
                    }
                    command = `/${this.scbuf} (${this.sx.length}) found <-prev:next->)`;
                } else if (this.mode === MODE.COMMAND) {
                    if (key.name === "return") {
                        switch (this.scbuf) {
                            case "w":
                                this.editorSave();
                                this.editorRefreshScreen();
                                this.scbuf = "";
                                return;
                            case "wq":
                                this.editorSave();
                                this.editorRefreshScreen();
                                this.die("BYE", 0);
                                this.scbuf = "";
                                return;
                            case "q":
                                this.die("BYE", 0);
                                break;
                            default:
                                break;
                        }
                        this.scbuf = "";
                        command = `:${this.scbuf}`;
                    } else if (key.name === "delete" || key.name === "backspace") {
                        if (this.scbuf.length <= 0) {
                            this.mode = MODE.NORMAL;
                            command = "";
                        } else {
                            this.scbuf = this.scbuf.slice(0, -1);
                            command = `:${this.scbuf}`;
                        }
                    } else if (SEARCHABLE_CHARS.test(key.sequence)) {
                        this.scbuf += key.sequence;
                        command = `:${this.scbuf}`;
                    }
                }

                this.editorSetStatusMessage(`${command} (${this.E.cx}:${this.E.cy})  -- ${Object.keys(MODE)[this.mode]} --`);
            }

            this.editorRefreshScreen();
        } catch (e) {
            this.die(e);
        }
    }

    /**
     * resize terminal
     * @returns {void}
     */
    editorResize() {
        this.E.screenrows = process.stdout.rows - 2; // status bar and message bar
        this.E.screencols = process.stdout.columns;
        this.editorRefreshScreen();
    }

    /**
     * handle key action for cursor movement
     * @param {string} name key.name
     * @param {string} sequence key.sequence
     * @returns {void}
     */
    editorMoveCursor(name, sequence) {
        const row = (this.E.cy >= this.E.erow.length) ? false : this.E.erow[this.E.cy];

        switch (name) {
            case "home":
            case "0":
                this.E.cx = 0;
                break;
            case "end":
                if (this.E.cy < this.E.erow.length) {
                    this.E.cx = this.E.erow[this.E.cy].length;
                }
                break;
            case "backspace":
                this.editorMoveCursor("left");
            case "delete":
            case "x":
                this.backup = JSON.stringify(this.E);
                this.editorDelChar();
                if (row !== false && row.length === 0) {
                    this.editorMoveCursor("down");
                }
                break;
            case "a":
                this.editorMoveCursor("right");
            case "insert":
            case "i":
                this.mode = MODE.INSERT;
                this.editorSetStatusMessage(`(${this.E.cx}:${this.E.cy}) - -- INSERT --`);
                this.editorRefreshScreen();
                break;
            case "o":
                if (sequence === "O") {
                    this.editorInsertRow();
                    this.E.cx = 0;
                    this.editorUpdateRow();
                } else {
                    this.editorMoveCursor("down");
                    this.editorInsertRow();
                    this.E.cx = 0;
                    this.editorUpdateRow();
                }
                this.mode = MODE.INSERT;
                break;
            case "u":
                {
                    const backupu = this.E;

                    this.E = JSON.parse(this.backup);
                    this.backup = JSON.stringify(backupu);
                }
                break;
            case "y":
                if (row !== false && this.prev === "y") { // yy yank
                    this.ybuf = row;
                }
                break;
            case "g":
                if (sequence === "G") {
                    this.E.cx = 0;
                    this.E.cy = this.E.erow.length > 0 ? this.E.erow.length - 1 : 0;
                } else if (this.prev === "g") { // gg  to top
                    this.E.cx = 0;
                    this.E.cy = 0;
                }
                break;
            case "d":
                if (row !== false) { // dd delete a row
                    if (this.prev === "d") { // dd delete a row
                        this.backup = JSON.stringify(this.E);
                        this.E.cx = 0;
                        this.ybuf = row;
                        [...Array(row.length)].map(() => this.editorDelChar());
                    } else if (sequence === "D") {
                        this.backup = JSON.stringify(this.E);
                        [...Array(row.length - this.E.cx)].map(() => this.editorDelChar());
                    }
                }
                break;
            case "p":
                this.editorMoveCursor("down");
                this.editorInsertRow(this.ybuf);
                this.editorUpdateRow();
                break;
            case "pageup":
                this.E.cy = this.E.rowoff;
            case "pagedown":
                if (name === "pagedown") {
                    this.E.cy = this.E.rowoff + this.E.screenrows - 1;
                    if (this.E.cy > this.E.erow.length) {
                        this.E.cy = this.E.erow.length;
                    }
                }
                [...Array(this.E.screenrows)].map(() => this.editorMoveCursor(name === "pageup" ? "up" : "down"));
                break;
            case "h":
            case "left":
                if (this.E.cx > 0) {
                    this.E.cx--;
                } else if (this.E.cy > 0) {
                    this.E.cy--;
                    this.E.cx = this.E.erow[this.E.cy].length;
                }
                break;
            case "l":
            case "right":
                if (row && this.E.cx < row.length) {
                    this.E.cx++;
                } else if (row !== false && this.E.cx === row.length) {
                    this.E.cy++;
                    this.E.cx = 0;
                }
                break;
            case "k":
            case "up":
                if (this.E.cy > 0) {
                    this.E.cy--;
                }
                break;
            case "j":
            case "down":
            case "return":
                if (this.E.cy < this.E.erow.length) {
                    this.E.cy++;
                }
                break;
            default:
                break;
        }
        const rowlen = (this.E.cy >= this.E.erow.length) ? 0 : this.E.erow[this.E.cy].length;

        if (this.E.cx > rowlen) {
            this.E.cx = rowlen;
        }
    }

    /**
     * drow status bar
     * @returns {void}
     */
    editorDrawStatusBar() {
        this.abuf += "\x1b[7m"; // invert the colors. (usually black -> white)
        const status = `${this.E.filename ? this.E.filename : "[No Name]"} - ${this.E.erow.length} lines ${this.E.dirty > 0 ? "(modified)" : ""}`;
        const rstatus = `${parseInt((this.E.cy + 1) / this.E.erow.length * 100, 10)}% ${this.E.cy + 1}/${this.E.erow.length}`;
        let len = status.length;

        if (len > this.E.screencols) {
            len = this.E.screencols;
        }
        this.abuf += status.slice(0, len);
        while (len < this.E.screencols) {
            if (this.E.screencols - len === rstatus.length) {
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
     * @returns {void}
     */
    editorDrawMessageBar() {
        this.abuf += "\x1b[K"; // remove all chars after the cursor position
        this.abuf += this.E.statusmsg.length > this.E.screencols ? this.E.statusmsg.slice(0, this.E.screencols) : this.E.statusmsg;
    }

    /**
     * drow file contents
     * @returns {void}
     */
    editorDrawRows() {
        [...Array(this.E.screenrows)].forEach((_, y) => {
            const filerow = y + this.E.rowoff;

            if (filerow >= this.E.erow.length) {
                if (this.E.erow.length === 0 && y === parseInt(this.E.screenrows / 3, 10)) {
                    const welcome = `Kilo editor -- version ${pkg.version}`;
                    let welcomelen = welcome.length;

                    if (welcomelen > this.E.screencols) {
                        welcomelen = this.E.screencols;
                    }
                    let padding = parseInt((this.E.screencols - welcomelen) / 2, 10);

                    if (padding > 0) {
                        this.abuf += "~";
                        padding--;
                    }
                    [...Array(padding)].forEach(() => {
                        this.abuf += " ";
                    });
                    this.abuf += welcome;
                } else {
                    this.abuf += "~";

                }
            } else {
                const row = this.E.render[filerow];
                let len = row.length - this.E.coloff;

                if (len < 0) {
                    len = 0;
                }
                if (len > this.E.screencols) {
                    len = this.E.screencols;
                }

                // syntax high right
                this.abuf += Kilo.editorUpdateSyntax(row.slice(this.E.coloff, this.E.coloff + len));
            }
            this.abuf += "\x1b[K"; // remove all chars after the cursor position
            this.abuf += os.EOL;
        });
    }

    /**
     * syntax highlighting
     * @param {string} row one row
     * @returns {string} - highlighted string
     */
    static editorUpdateSyntax(row) {
        return row
            .replace(/([0-9]+)/ug // number
                , (match, p1) => `\x1b[31m${p1}\x1b[39m`)
            .replace(/(')([^']*)(')/ug // operator
                , (match, p1, p2, p3) => `\x1b[35m${p1}${p2}${p3}\x1b[39m`) // string quote
            .replace(/(")([^"]*)(")/ug // operator
                , (match, p1, p2, p3) => `\x1b[35m${p1}${p2}${p3}\x1b[39m`) // string quote
            .replace(/(&{1,2}|[-*+\\|?<>;:=!])/ug // operator
                , (match, p1) => `\x1b[36m${p1}\x1b[39m`)
            .replace(/\b(typeof|try|let|const|constructor|require|this|new|undefined|static)\b/ug // keyword
                , (match, p1) => `\x1b[32m${p1}\x1b[39m`)
            .replace(/\b(break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|while|in|instanceof|new|return|switch)\b/ug // reserved
                , (match, p1) => `\x1b[33m${p1}\x1b[39m`)
            .replace(/(\/\/.*$)/ug // comment out
                , (match, p1) => `\x1b[36m${p1}\x1b[39m`);
    }

    /**
     * main function
     * @returns {void}
     */
    main() {
        try {
            Kilo.enableRawMode();
            if (typeof this.E.filename !== "undefined") {
                this.editorOpen();
            }
            this.editorRefreshScreen();
            process.stdin.on("keypress", this.editorReadKey.bind(this));
            process.stdout.on("resize", this.editorResize.bind(this));
        } catch (e) {
            this.die(e);
        }
    }
}
if (typeof module !== "undefined") {
    module.exports = Kilo;
}
