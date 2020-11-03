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
        variables.k.editorSave();
        expect(variables.k.E.statusmsg).toMatch(/\d+ bytes written to disk/u);

        variables.k = new Kilo(["__test__/testData.csv"]);
        variables.k.editorSave();
        expect(variables.k.E.statusmsg).toEqual("Error:ENOENT: no such file or directory, open '__test__/testData.csv'");
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
        variables.k.E.screenrows = 10;
        variables.k.E.screencols = 10;
        variables.k.editorOpen();
        //variables.k.editorRefreshScreen = () => {};
        expect(variables.k.editorReadKey).toBeInstanceOf(Function);

        // vertical cursor move
        variables.k.editorReadKey("", { name: "down" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(1);

        variables.k.editorReadKey("", { name: "pagedown" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(19);
        expect(variables.k.E.rowoff).toEqual(10);

        variables.k.editorReadKey("", { name: "down" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(20);
        expect(variables.k.E.rowoff).toEqual(11);

        variables.k.editorReadKey("", { name: "pagedown" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(21);
        expect(variables.k.E.rowoff).toEqual(12);

        variables.k.editorReadKey("", { name: "up" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(20);
        expect(variables.k.E.rowoff).toEqual(12);

        variables.k.editorReadKey("", { name: "pageup" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(2);
        expect(variables.k.E.rowoff).toEqual(2);

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

        variables.k.editorReadKey("", { name: "right" });
        variables.k.editorScroll();
        expect(variables.k.E.cx).toEqual(11);
        expect(variables.k.E.coloff).toEqual(2);

        variables.k.editorReadKey("", { name: "right" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(1);
        expect(variables.k.E.cx).toEqual(0);
        expect(variables.k.E.coloff).toEqual(0);

        variables.k.editorReadKey("", { name: "left" });
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
        variables.k.editorReadKey("", { name: "up" });
        variables.k.editorScroll();
        expect(variables.k.E.cy).toEqual(1);
        expect(variables.k.E.cx).toEqual(0);
        expect(variables.k.E.coloff).toEqual(0);
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
        expect(process.stdin.setRawMode).toHaveBeenCalledTimes(3);
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
        expect(process.stdin.setRawMode).toHaveBeenCalledTimes(4);
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
    });
    afterEach(() => {
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
        process.stdout.rows = 20;
        process.stdout.columns = 20;
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
