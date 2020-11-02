"use strict";
const readline = require("readline");
const pkg = require("../package");
const fs = require("fs");
const os = require("os");
const KILO_TAB_STOP = 8;
const MULTI_BYTE = 2;

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
        this.E = {
            cx: 0,
            rx: 0,
            cy: 0,
            sx: [],
            sy: [],
            xi: 0,
            erow: [],
            render: [],
            rowoff: 0,
            coloff: 0,
            dirty: 0,
            insert: false,
            search: false,
            screenrows: process.stdout.rows - 2, // status bar and message bar
            screencols: process.stdout.columns,
            statusmsg: ""
        };
        if (argv && argv.length > 0) {
            this.E.filename = argv[0];
        }
        this.editorSetStatusMessage("HELP: Ctrl-S = save | Ctrl-Q = quit");
        this.backup = {};
        this.abuf = "";
        this.sbuf = "";
        this.ybuf = "";
        this.prev = "";
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
        process.exit(status || 1);
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
     * insert single char for the row
     * @param {int} at the target position
     * @param {char} c char which will be inserted
     * @todo handle multibyte properly
     * @returns {void}
     */
    editorRowInsertChar(at, c) {
        let pos = at;

        if (this.E.cy === this.E.erow.length) {
            this.editorInsertRow();
        }
        const row = this.E.erow[this.E.cy];

        if (at < 0 || at > row.length) {
            pos = row.length;
        }

        this.E.erow[this.E.cy] = `${row.slice(0, pos)}${c}${row.slice(pos)}`;
        this.editorUpdateRow();
        this.E.dirty++;
    }

    /**
     * delete single char for the row
     * @param {int} at the target position
     * @todo handle multibyte properly
     * @returns {void}
     */
    editorRowDelChar(at) {
        const row = this.E.erow[this.E.cy];

        if (this.E.erow.length <= this.E.cy) {
            return;
        }
        const newRow = `${row.slice(0, at)}${row.slice(at + 1)}`;

        if (newRow.length > 0) {
            this.E.erow[this.E.cy] = newRow;
        } else {
            this.E.erow.splice(this.E.cy, 1);
            if (this.E.erow.length > 0 && this.E.cy > 0) {
                this.E.cy--;
            }
        }
        this.editorUpdateRow();
    }

    /**
     * insert single char
     * @param {char} c char which will be inserted
     * @todo handle multibyte properly
     * @returns {void}
     */
    editorInsertChar(c) {
        this.backup = JSON.stringify(this.E);
        this.editorRowInsertChar(this.E.cx, c);
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
        if (this.E.cy === this.E.erow.length) {
            return;
        }
        this.backup = JSON.stringify(this.E);
        this.editorRowDelChar(this.E.cx);
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
        let rx = 0;
        let j;
        const chars = row.match(/./ug);

        for (j = 0; j < cx; j++) {
            if (chars[j] === "\t") {
                rx += (KILO_TAB_STOP - 1) - (rx % KILO_TAB_STOP);
            }
            if (/%[89ABab]/ug.test(encodeURIComponent(chars[j]))) {
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
        if (this.E.cy < this.E.erow.length) {
            this.E.rx = Kilo.editorRowCxToRx(this.E.erow[this.E.cy], this.E.cx);
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
        const row = (this.E.cy >= this.E.erow.length) ? false : this.E.erow[this.E.cy];

        try {
            if (key.meta) {
                this.E.insert = false;
                this.E.search = false;
                this.E.sx = [];
                this.E.sy = [];
                this.E.si = 0;
                this.sbuf = "";
            } else if (key.ctrl) {
                switch (key.name) {
                    case "q":
                        this.die("BYE", 0);
                        break;
                    case "s":
                        this.editorSave();
                        break;
                    default:
                        break;
                }
            } else {
                if (!this.E.insert && !this.E.search) { // not insert mode
                    if (typeof key.name === "undefined") { // not insert and not alphabet
                        switch (key.sequence) {
                            case "$":
                                if (this.E.cy < this.E.erow.length) {
                                    this.E.cx = this.E.erow[this.E.cy].length;
                                }
                                break;
                            case "^":
                                this.E.cx = 0;
                                break;
                            case "/":
                                this.E.search = true;
                                break;
                            default:
                                break;
                        }
                    } else { // not insert and alphabet
                        switch (key.name) {
                            case "home":
                            case "0":
                                this.E.cx = 0;
                                break;
                            case "end":
                                if (this.E.cy < this.E.erow.length) {
                                    this.E.cx = this.E.erow[this.E.cy].length;
                                }
                                break;
                            case "return":
                                this.editorMoveCursor("down");
                                break;
                            case "backspace":
                                this.editorMoveCursor("left");
                            case "delete":
                            case "x":
                                this.editorDelChar();
                                if (row !== false && row.length === 0) {
                                    this.editorMoveCursor("down");
                                }
                                break;
                            case "escape":
                                this.E.insert = false;
                                break;
                            case "a":
                                this.editorMoveCursor("right");
                            case "insert":
                            case "i":
                                this.E.insert = true;
                                this.editorSetStatusMessage(`(${this.E.cx}:${this.E.cy}) - ${this.E.insert ? "-- INSERT --" : ""}`);
                                this.editorRefreshScreen();
                                break;
                            case "o":
                                if (key.sequence === "O") {
                                    this.editorInsertRow();
                                    this.E.cx = 0;
                                    this.editorUpdateRow();
                                } else {
                                    this.editorMoveCursor("down");
                                    this.editorInsertRow();
                                    this.E.cx = 0;
                                    this.editorUpdateRow();
                                }
                                this.E.insert = true;
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
                            case "g":
                                if (row !== false && this.prev === "g") { // yy yank
                                    this.E.cx = 0;
                                    this.E.cy = 0;
                                } else if (key.sequence === "G") {
                                    this.E.cx = 0;
                                    this.E.cy = this.E.erow.length - 1;
                                }
                                break;
                            case "d":
                                if (row !== false && this.prev === "d") { // dd delete a row
                                    const backup = JSON.stringify(this.E);

                                    this.E.cx = 0;
                                    let times = row.length;

                                    this.ybuf = row;
                                    while (times--) {
                                        this.editorDelChar();
                                    }
                                    this.backup = backup;
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
                                {
                                    if (key.name === "pagedown") {
                                        this.E.cy = this.E.rowoff + this.E.screenrows - 1;
                                        if (this.E.cy > this.E.erow.length) {
                                            this.E.cy = this.E.erow.length;
                                        }
                                    }
                                    let times = this.E.screenrows;

                                    while (times--) {
                                        this.editorMoveCursor(key.name === "pageup" ? "up" : "down");
                                    }
                                }
                                break;
                            case "left":
                            case "right":
                            case "up":
                            case "down":
                            case "h":
                            case "l":
                            case "k":
                            case "j":
                                this.editorMoveCursor(key.name);
                                break;
                            default:
                                break;
                        }
                    }
                    this.prev = key.name;
                } else if (this.E.search && !this.E.insert) { // search mode
                    switch (key.name) {
                        case "backspace":
                        case "delete":
                            this.sbuf = "";
                            break;
                        case "return":
                            this.E.search = false;
                            this.E.sx = [];
                            this.E.sy = [];
                            this.E.si = 0;
                            this.sbuf = "";
                            break;
                        case "right":
                        case "left":
                            if (key.name === "right") {
                                this.E.si++;
                            } else {
                                this.E.si--;
                            }
                            if (this.E.si >= this.E.sx.length) {
                                this.E.si = 0;
                            }
                            if (this.E.si < 0) {
                                this.E.si = this.E.sx.length - 1;
                            }
                        default:
                            if (/^[\ta-z0-9!"#$%&'()*+,./:;<=>?@[\]\\ ^_`{|}~-]$/ui.test(key.sequence)) {
                                this.sbuf += key.sequence;
                                this.E.sx = [];
                                this.E.sy = [];
                                this.E.si = 0;
                                this.E.erow.forEach((r, y) => {
                                    const match = r.match(new RegExp(this.sbuf, "ui"));

                                    if (match) {
                                        this.E.sx.push(match.index);
                                        this.E.sy.push(y);
                                    }
                                });
                            }
                            if (this.E.sx.length > this.E.si) {
                                this.E.cx = this.E.sx[this.E.si];
                                this.E.cy = this.E.sy[this.E.si];
                            }
                    }
                } else { // insert mode
                    switch (key.name) {
                        case "home":
                            this.E.cx = 0;
                            break;
                        case "end":
                            if (this.E.cy < this.E.erow.length) {
                                this.E.cx = this.E.erow[this.E.cy].length;
                            }
                            break;
                        case "return":
                            this.editorInsertRow();
                            this.editorMoveCursor("home");
                            this.editorMoveCursor("down");
                            this.editorUpdateRow();
                            break;
                        case "backspace":
                            this.editorMoveCursor("left");
                        case "delete":
                            this.editorDelChar();
                            if (row !== false && row.length === 0) {
                                this.editorMoveCursor("down");
                            }
                            break;
                        case "pageup":
                            this.E.cy = this.E.rowoff;
                        case "pagedown":
                            {
                                if (key.name === "pagedown") {
                                    this.E.cy = this.E.rowoff + this.E.screenrows - 1;
                                    if (this.E.cy > this.E.erow.length) {
                                        this.E.cy = this.E.erow.length;
                                    }
                                }
                                let times = this.E.screenrows;

                                while (times--) {
                                    this.editorMoveCursor(key.name === "pageup" ? "up" : "down");
                                }
                            }
                            break;
                        case "left":
                        case "right":
                        case "up":
                        case "down":
                            this.editorMoveCursor(key.name);
                            break;
                        default:
                            if (this.E.insert && /^[\ta-z0-9!"#$%&'()*+,./:;<=>?@[\]\\ ^_`{|}~-]$/ui.test(key.sequence)) {
                                this.editorInsertChar(key.sequence);
                            }
                    }
                }
                const search = this.E.search ? `/${this.sbuf} (${this.E.sx.length}) found <-prev:next->)` : "";

                this.editorSetStatusMessage(`(${this.E.cx}:${this.E.cy}) - ${search} - ${this.E.insert ? "-- INSERT --" : ""}`);
            }
            this.editorRefreshScreen();
        } catch (e) {
            this.die(e);
        }
    }

    /**
     * handle key action for cursor movement
     * @param {string} name key.name
     * @returns {void}
     */
    editorMoveCursor(name) {
        let row = (this.E.cy >= this.E.erow.length) ? false : this.E.erow[this.E.cy];

        switch (name) {
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
                if (this.E.cy < this.E.erow.length) {
                    this.E.cy++;
                }
                break;
            default:
                break;
        }
        row = (this.E.cy >= this.E.erow.length) ? false : this.E.erow[this.E.cy];
        const rowlen = row ? row.length : 0;

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
        let len = status.length;
        const rstatus = `${parseInt((this.E.cy + 1) / this.E.erow.length * 100, 10)}% ${this.E.cy + 1}/${this.E.erow.length}`;

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
        for (let y = 0; y < this.E.screenrows; y++) {
            const filerow = y + this.E.rowoff;

            if (filerow >= this.E.erow.length) {
                if (this.E.erow.length === 0 && y === parseInt(this.E.screenrows / 3, 10)) {
                    const welcome = `Kilo editor -- version ${pkg.version}`;
                    let welcomlen = welcome.length;

                    if (welcomlen > this.E.screencols) {
                        welcomlen = this.E.screencols;
                    }
                    let padding = parseInt((this.E.screencols - welcomlen) / 2, 10);

                    if (padding > 0) {
                        this.abuf += "~";
                        padding--;
                    }
                    while (padding-- > 0) {
                        this.abuf += " ";
                    }
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
        }
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
            .replace(/(&{1,2}|[-*+\\|?"<>;:=!])/ug // operator
                , (match, p1) => `\x1b[36m${p1}\x1b[39m`)
            .replace(/([\W])(try|let|const|constructor|require|this|new|undefined)([\W])/ug // keyword
                , (match, p1, p2, p3) => `${p1}\x1b[32m${p2}\x1b[39m${p3}`)
            .replace(/([\W])(break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch)([\W])/ug // reserved
                , (match, p1, p2, p3) => `${p1}\x1b[33m${p2}\x1b[39m${p3}`)
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
            process.stdout.on("resize", () => {
                this.E.screenrows = process.stdout.rows - 2; // status bar and message bar
                this.E.screencols = process.stdout.columns;
            });
        } catch (e) {
            this.die(e);
        }
    }
}
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = Kilo;
}
