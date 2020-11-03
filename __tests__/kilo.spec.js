"use strict";
const Kilo = require("../src/kilo");

describe("Kilo", () => {
    const variables = {};

    it(" constructor() : can create new instance", () => {
        expect(variables.k).not.toBeNull();
        expect(variables.k).toBeInstanceOf(Kilo);
        expect(variables.k.E.cx).toEqual(0);
        expect(variables.k.E.cy).toEqual(0);
        expect(variables.k.E.erow).toEqual([]);
        expect(variables.k.E.rowoff).toEqual(0);
        expect(variables.k.E.erow.length).toEqual(0);
        expect(variables.k.E.screenrows).not.toEqual(0);
        expect(variables.k.E.screencols).not.toEqual(0);
    });
    it(" editorOpen() : can read all strings from file", () => {
        expect(variables.k.editorOpen).toBeInstanceOf(Function);
        variables.k.editorOpen();
        expect(variables.k.E.erow.length).toEqual(21);

        // no such file or directory
        expect(() => {
            const qi = new Kilo(["__tests__/testData.csv"]);

            qi.editorOpen();
        }).toThrow(/no such file or directory/u);
    });
    it(" editorSave() : can save properly", () => {
        expect(variables.k.editorSave).toBeInstanceOf(Function);
        variables.k.editorOpen();
        variables.k.E.dirty = 1;
        variables.k.editorSave();
        expect(variables.k.E.statusmsg).toMatch(/\d+ bytes written to disk/u);
        expect(variables.k.E.dirty).toEqual(0);

        variables.k = new Kilo(["__test__/testData.csv"]);
        variables.k.E.dirty = 1;
        variables.k.editorSave();
        expect(variables.k.E.statusmsg).toEqual("Error:ENOENT: no such file or directory, open '__test__/testData.csv'");
        expect(variables.k.E.dirty).toEqual(1);
    });
    it(" enableRawMode() : can set tty from normal to raw mode", () => {
        expect(Kilo.enableRawMode).toBeInstanceOf(Function);
        Kilo.enableRawMode();
    });
    it(" disableRawMode() : can set tty from raw to normal mode", () => {
        expect(Kilo.disableRawMode).toBeInstanceOf(Function);
        Kilo.disableRawMode();
    });
    it(" editorScroll() : can culculate scroll", () => {
        expect(variables.k.editorScroll).toBeInstanceOf(Function);
    });
    it(" editorReadKey(str,key) : can switch regarding each input", () => {
        variables.k.editorOpen();

        expect(variables.k.editorReadKey).toBeInstanceOf(Function);

        // vertical cursor move
        variables.k.editorReadKey("", { name: "down" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(1);

        variables.k.editorReadKey("", { name: "pagedown" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(15);
        expect(variables.k.E.rowoff).toEqual(8);

        variables.k.editorReadKey("", { name: "j" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(16);
        expect(variables.k.E.rowoff).toEqual(9);

        variables.k.editorReadKey("", { name: "pagedown" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(21);
        expect(variables.k.E.rowoff).toEqual(14);

        variables.k.editorReadKey("", { name: "up" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(20);
        expect(variables.k.E.rowoff).toEqual(14);

        variables.k.editorReadKey("", { name: "pageup" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(6);
        expect(variables.k.E.rowoff).toEqual(6);

        variables.k.editorReadKey("", { name: "pageup" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(0);
        expect(variables.k.E.rowoff).toEqual(0);

        // horizontal cursor move
        variables.k.editorReadKey("", { name: "right" });
        variables.k.editorScroll();
        expect(variables.k.E.cx).toEqual(1);
        expect(variables.k.E.coloff).toEqual(0);

        variables.k.editorReadKey("", { name: "end" });
        variables.k.editorScroll();
        expect(variables.k.E.cx).toEqual(11);
        expect(variables.k.E.coloff).toEqual(2);

        variables.k.editorReadKey("", { name: "left" });
        variables.k.editorScroll();
        expect(variables.k.E.cx).toEqual(10);
        expect(variables.k.E.coloff).toEqual(2);

        variables.k.editorReadKey("", { name: "l" });
        variables.k.editorScroll();
        expect(variables.k.E.cx).toEqual(11);
        expect(variables.k.E.coloff).toEqual(2);

        variables.k.editorReadKey("", { name: "right" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(1);
        expect(variables.k.E.cx).toEqual(0);
        expect(variables.k.E.coloff).toEqual(0);

        variables.k.editorReadKey("", { name: "h" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(0);
        expect(variables.k.E.cx).toEqual(11);
        expect(variables.k.E.coloff).toEqual(2);

        variables.k.editorReadKey("", { name: "home" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(0);
        expect(variables.k.E.cx).toEqual(0);
        expect(variables.k.E.coloff).toEqual(0);

        variables.k.editorReadKey("", { name: "down" });
        variables.k.editorScroll();
        variables.k.editorReadKey("", { name: "down" });
        variables.k.editorScroll();
        variables.k.editorReadKey("", { name: "end" });
        variables.k.editorScroll();
        variables.k.editorReadKey("", { name: "k" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(1);
        expect(variables.k.E.cx).toEqual(0);
        expect(variables.k.E.coloff).toEqual(0);

        // for meta
        variables.k.editorReadKey("", { meta: true });
        expect(variables.k.insert).toBeFalsy();
        expect(variables.k.search).toBeFalsy();
        expect(variables.k.sx.length).toEqual(0);
        expect(variables.k.sy.length).toEqual(0);
        expect(variables.k.si).toEqual(0);
        expect(variables.k.sbuf).toEqual("");

        // for ctrl
        // ctrl + q -> die("BYE",0);
        variables.k.editorReadKey("", { ctrl: true, name: "q" });
        expect(variables.k.abuf).toEqual("");
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
        expect(process.stdout.cursorTo).toHaveBeenCalledTimes(1);
        expect(process.stdout.cursorTo).toHaveBeenLastCalledWith(0, 0);
        expect(process.stdout.clearScreenDown).toHaveBeenCalledTimes(1);
        expect(process.stdout.clearScreenDown).toHaveBeenLastCalledWith();
        expect(process.stdin.setRawMode).toHaveBeenCalledTimes(1);
        expect(process.stdin.setRawMode).toHaveBeenLastCalledWith(false);
        expect(process.exit).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenLastCalledWith(0);
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenLastCalledWith("BYE");

        // ctrl + s -> editorSave
        variables.k.editorReadKey("", { ctrl: true, name: "s" });
        expect(variables.k.E.statusmsg).toMatch(/\d+ bytes written to disk/u);
        expect(variables.k.E.dirty).toEqual(0);

        // for empty files
        variables.k = new Kilo();
        [
            { name: "up" },
            { name: "k" },
            { name: "down" },
            { name: "return" },
            { name: "j" },
            { name: "right" },
            { name: "l" },
            { name: "left" },
            { name: "h" },
            { name: "home" },
            { sequence: "^" },
            { name: "end" },
            { sequence: "$" },
            { name: "g", sequence: "g" },
            { name: "g", sequence: "G" }
        ].forEach(key => {
            expect(variables.k.E.cy).toEqual(0);
            expect(variables.k.E.cx).toEqual(0);
            expect(variables.k.E.rowoff).toEqual(0);
            expect(variables.k.E.coloff).toEqual(0);
            expect(variables.k.E.dirty).toEqual(0);
            expect(variables.k.abuf).toEqual("");
            expect(variables.k.ybuf).toEqual("");
            expect(variables.k.sbuf).toEqual("");
            expect(variables.k.prev).toEqual("");
        });
    });
    it(" editorRefreshScreen() : can refresh the screen", () => {
        expect(variables.k.editorRefreshScreen).toBeInstanceOf(Function);
        variables.k.editorRefreshScreen();
    });
    it(" editorDrawStatusBar() : can draw lines", () => {
        expect(variables.k.editorDrawStatusBar).toBeInstanceOf(Function);
        expect(variables.k.abuf.length).toBe(0);
        variables.k.editorDrawStatusBar();
        expect(variables.k.abuf.length).not.toBe(0);
    });
    it(" editorSetStatusMessage : can set statusmsg properly", () => {
        expect(variables.k.editorSetStatusMessage).toBeInstanceOf(Function);
        variables.k.editorSetStatusMessage("BYE");
        expect(variables.k.E.statusmsg).toBe("BYE");
        jest.runAllTimers();
        expect(variables.k.E.statusmsg).toBe("");
    });
    it(" editorDrawMessageBar() : can draw lines", () => {
        expect(variables.k.editorDrawMessageBar).toBeInstanceOf(Function);
        expect(variables.k.abuf.length).toBe(0);
        variables.k.editorDrawMessageBar();
        expect(variables.k.abuf.length).not.toBe(0);
    });
    it(" editorDrawRows() : can draw lines", () => {
        variables.k.E.screenrows = 100;
        variables.k.E.screencols = 100;
        expect(variables.k.editorDrawRows).toBeInstanceOf(Function);
        expect(variables.k.abuf.length).toBe(0);
        variables.k.editorDrawRows();
        expect(variables.k.abuf.length).not.toBe(0);

        variables.k = new Kilo(["LICENSE"]);
        variables.k.E.screenrows = 10;
        variables.k.E.screencols = 10;
        expect(variables.k.abuf.length).toBe(0);
        variables.k.editorDrawRows();
        expect(variables.k.abuf.length).not.toBe(0);

        variables.k = new Kilo([]);
        variables.k.E.screenrows = 100;
        variables.k.E.screencols = 100;
        expect(variables.k.abuf.length).toBe(0);
        variables.k.editorDrawRows();
        expect(variables.k.abuf.length).not.toBe(0);
    });
    it(" editorRowCxToRx() : can convert cx -> rx", () => {
        expect(Kilo.editorRowCxToRx).toBeInstanceOf(Function);
        expect(Kilo.editorRowCxToRx("", 0)).toEqual(0);
        expect(Kilo.editorRowCxToRx("\ta\t", 0)).toEqual(0);
        expect(Kilo.editorRowCxToRx("\ta\t", 1)).toEqual(8);
        expect(Kilo.editorRowCxToRx("\ta\t", 2)).toEqual(9);
        expect(Kilo.editorRowCxToRx("\ta\t", 3)).toEqual(16);
        expect(Kilo.editorRowCxToRx(decodeURIComponent("%E3%82%AE%E3%83%83%E3%83%88%E3%83%8F%E3%83%96"), 0)).toEqual(0); // url encoded "GitHub" in Japanese
        expect(Kilo.editorRowCxToRx(decodeURIComponent("%E3%82%AE%E3%83%83%E3%83%88%E3%83%8F%E3%83%96"), 1)).toEqual(2);
    });
    it(" editorUpdateSyntax() : can markup and colored properly", () => {
        expect(Kilo.editorUpdateSyntax).toBeInstanceOf(Function);
        expect(Kilo.editorUpdateSyntax("test")).toEqual("test");
    });
    it(" editorMoveCursor() : can calculate proper cursor position", () => {
        variables.k.editorMoveCursor("up");

        expect(variables.k.editorMoveCursor).toBeInstanceOf(Function);
    });
    it(" die() : can exit with proper status code", () => {
        expect(variables.k.die).toBeInstanceOf(Function);

        // w/o status
        variables.k.die();
        expect(variables.k.abuf).toEqual("");
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
        expect(process.stdout.cursorTo).toHaveBeenCalledTimes(1);
        expect(process.stdout.cursorTo).toHaveBeenLastCalledWith(0, 0);
        expect(process.stdout.clearScreenDown).toHaveBeenCalledTimes(1);
        expect(process.stdout.clearScreenDown).toHaveBeenLastCalledWith();
        expect(process.stdin.setRawMode).toHaveBeenCalledTimes(1);
        expect(process.stdin.setRawMode).toHaveBeenLastCalledWith(false);
        expect(process.exit).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenLastCalledWith(1);

        // w/ status
        variables.k.die({}, 0);
        expect(variables.k.abuf).toEqual("");
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
        expect(process.stdout.cursorTo).toHaveBeenCalledTimes(2);
        expect(process.stdout.cursorTo).toHaveBeenLastCalledWith(0, 0);
        expect(process.stdout.clearScreenDown).toHaveBeenCalledTimes(2);
        expect(process.stdout.clearScreenDown).toHaveBeenLastCalledWith();
        expect(process.stdin.setRawMode).toHaveBeenCalledTimes(2);
        expect(process.stdin.setRawMode).toHaveBeenLastCalledWith(false);
        expect(process.exit).toHaveBeenCalledTimes(2);
        expect(process.exit).toHaveBeenLastCalledWith(0);

    });
    it(" editorDelChar() : can delete char", () => {
        expect(variables.k.editorDelChar).toBeInstanceOf(Function);
        variables.k.editorDelChar();

    });
    it(" editorInsertRow(insert) : can insert row", () => {
        expect(variables.k.editorInsertRow).toBeInstanceOf(Function);
        variables.k.editorInsertRow();

    });
    it(" editorInsertChar(c) : can insert c", () => {
        expect(variables.k.editorInsertChar).toBeInstanceOf(Function);
        variables.k.editorInsertChar("");

    });
    it(" editorRowDelChar(at) : can delete char at 'at'", () => {
        expect(variables.k.editorRowDelChar).toBeInstanceOf(Function);
        variables.k.editorRowDelChar(0);

    });
    it(" editorRowInsertChar(at,c) : can insert char at 'at'", () => {
        expect(variables.k.editorRowInsertChar).toBeInstanceOf(Function);
        variables.k.editorOpen();

        // position 0
        variables.k.editorRowInsertChar(0, " ");
        expect(variables.k.E.erow[0]).toEqual(" MIT License");
        expect(variables.k.E.dirty).toEqual(1);

        // position 3
        variables.k.editorRowInsertChar(3, " ");
        expect(variables.k.E.erow[0]).toEqual(" MI T License");
        expect(variables.k.E.dirty).toEqual(2);

        // negative invalid position
        variables.k.editorRowInsertChar(-1, " ");
        expect(variables.k.E.erow[0]).toEqual(" MI T License ");
        expect(variables.k.E.dirty).toEqual(3);

        // positive invalid position
        variables.k.editorRowInsertChar(999, " ");
        expect(variables.k.E.erow[0]).toEqual(" MI T License  ");
        expect(variables.k.E.dirty).toEqual(4);

        // go to last
        variables.k.editorReadKey("g", { name: "g", sequence: "G" });
        variables.k.editorRowInsertChar(0, " ");
        expect(variables.k.E.erow[20]).toEqual(" SOFTWARE.");
        expect(variables.k.E.dirty).toEqual(5);

        // exceed to last
        variables.k.E.cy++;
        variables.k.editorRowInsertChar(0, " ");
        expect(variables.k.E.erow.length).toEqual(22);
        expect(variables.k.E.erow[20]).toEqual(" SOFTWARE."); // no change
        expect(variables.k.E.erow[21]).toEqual(" "); // insert proper row
        expect(variables.k.E.dirty).toEqual(7); // 5 + 2(insert row + insert char)

    });
    it(" main : can run properly", () => {
        expect(variables.k.main).toBeInstanceOf(Function);
        variables.k.main();
    });
    beforeEach(() => {
        jest.useFakeTimers();
        variables.k = new Kilo(["LICENSE"]);

        console.error = jest.fn();
        process.exit = jest.fn();
        process.stdout.cursorTo = jest.fn();
        process.stdout.clearScreenDown = jest.fn();
        process.stdin.isTTY = true;
        process.stdin.setRawMode = jest.fn();
        process.stdin.resume = jest.fn();
        process.stdout.write = jest.fn();
        process.stdout.on = jest.fn();
        process.stdin.on = jest.fn();
        process.stdout.rows = 10;
        process.stdout.columns = 10;
    });
    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        delete variables.k;
    });
    beforeAll(() => {
        variables.error = console.error;
        variables.exit = process.exit;
        variables.cursorTo = process.stdout.cursorTo;
        variables.clearScreenDown = process.stdout.clearScreenDown;
        variables.isTTY = process.stdin.isTTY;
        variables.setRawMode = process.stdin.setRawMode;
        variables.resume = process.stdin.resume;
        variables.write = process.stdout.write;
        variables.outon = process.stdout.on;
        variables.inon = process.stdin.on;
        variables.rows = process.stdout.rows;
        variables.columns = process.stdout.columns;
    });
    afterAll(() => {
        console.error = variables.error;
        process.exit = variables.exit;
        process.stdout.cursorTo = variables.cursorTo;
        process.stdout.clearScreenDown = variables.clearScreenDown;
        process.stdin.isTTY = variables.isTTY;
        process.stdin.setRawMode = variables.setRawMode;
        process.stdin.resume = variables.resume;
        process.stdout.write = variables.write;
        process.stdout.on = variables.outon;
        process.stdin.on = variables.inon;
        process.stdout.rows = variables.rows;
        process.stdout.columns = variables.columns;
    });
});
