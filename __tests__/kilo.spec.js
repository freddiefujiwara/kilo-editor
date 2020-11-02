"use strict";
const Kilo = require("../src/kilo");

describe("Kilo", () => {
    const variables = {};

    it(" constructor() : can create new instance", () => {
        const k = new Kilo();

        expect(k).not.toBeNull();
        expect(k).toBeInstanceOf(Kilo);
        expect(k.E.cx).toEqual(0);
        expect(k.E.cy).toEqual(0);
        expect(k.E.erow).toEqual([]);
        expect(k.E.rowoff).toEqual(0);
        expect(k.E.erow.length).toEqual(0);
        expect(k.E.screenrows).not.toEqual(0);
        expect(k.E.screencols).not.toEqual(0);
    });
    it(" editorOpen() : can read all strings from file", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.editorOpen).toBeInstanceOf(Function);
        k.editorOpen();
        expect(k.E.erow.length).toEqual(21);

        // no such file or directory
        expect(() => {
            const qi = new Kilo("__tests__/testData.csv");

            qi.editorOpen();
        }).toThrow(/no such file or directory/u);
    });
    it(" editorSave() : can save properly", () => {
        const k = new Kilo(["LICENSE"]);
        expect(k.editorSave).toBeInstanceOf(Function);
        k.editorOpen();
        k.editorSave();
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
        const k = new Kilo();

        expect(k.editorScroll).toBeInstanceOf(Function);
    });
    it(" editorReadKey(str,key) : can switch regarding each input", () => {
        const k = new Kilo(["LICENSE"]);

        k.E.screenrows = 10;
        k.E.screencols = 10;
        k.editorOpen();
        k.editorRefreshScreen = () => {};
        expect(k.editorReadKey).toBeInstanceOf(Function);

        // vertical cursor move
        k.editorReadKey("", { name: "down" });
        k.editorScroll();
        expect(k.E.cy).toEqual(1);

        k.editorReadKey("", { name: "pagedown" });
        k.editorScroll();
        expect(k.E.cy).toEqual(19);
        expect(k.E.rowoff).toEqual(10);

        k.editorReadKey("", { name: "down" });
        k.editorScroll();
        expect(k.E.cy).toEqual(20);
        expect(k.E.rowoff).toEqual(11);

        k.editorReadKey("", { name: "pagedown" });
        k.editorScroll();
        expect(k.E.cy).toEqual(21);
        expect(k.E.rowoff).toEqual(12);

        k.editorReadKey("", { name: "up" });
        k.editorScroll();
        expect(k.E.cy).toEqual(20);
        expect(k.E.rowoff).toEqual(12);

        k.editorReadKey("", { name: "pageup" });
        k.editorScroll();
        expect(k.E.cy).toEqual(2);
        expect(k.E.rowoff).toEqual(2);

        k.editorReadKey("", { name: "pageup" });
        k.editorScroll();
        expect(k.E.cy).toEqual(0);
        expect(k.E.rowoff).toEqual(0);

        // horizontal cursor move
        k.editorReadKey("", { name: "right" });
        k.editorScroll();
        expect(k.E.cx).toEqual(1);
        expect(k.E.coloff).toEqual(0);

        k.editorReadKey("", { name: "end" });
        k.editorScroll();
        expect(k.E.cx).toEqual(11);
        expect(k.E.coloff).toEqual(2);

        k.editorReadKey("", { name: "left" });
        k.editorScroll();
        expect(k.E.cx).toEqual(10);
        expect(k.E.coloff).toEqual(2);

        k.editorReadKey("", { name: "right" });
        k.editorScroll();
        expect(k.E.cx).toEqual(11);
        expect(k.E.coloff).toEqual(2);

        k.editorReadKey("", { name: "right" });
        k.editorScroll();
        expect(k.E.cy).toEqual(1);
        expect(k.E.cx).toEqual(0);
        expect(k.E.coloff).toEqual(0);

        k.editorReadKey("", { name: "left" });
        k.editorScroll();
        expect(k.E.cy).toEqual(0);
        expect(k.E.cx).toEqual(11);
        expect(k.E.coloff).toEqual(2);

        k.editorReadKey("", { name: "home" });
        k.editorScroll();
        expect(k.E.cy).toEqual(0);
        expect(k.E.cx).toEqual(0);
        expect(k.E.coloff).toEqual(0);

        k.editorReadKey("", { name: "down" });
        k.editorScroll();
        k.editorReadKey("", { name: "down" });
        k.editorScroll();
        k.editorReadKey("", { name: "end" });
        k.editorScroll();
        k.editorReadKey("", { name: "up" });
        k.editorScroll();
        expect(k.E.cy).toEqual(1);
        expect(k.E.cx).toEqual(0);
        expect(k.E.coloff).toEqual(0);
    });
    it(" editorRefreshScreen() : can refresh the screen", () => {
        const k = new Kilo();

        expect(k.editorRefreshScreen).toBeInstanceOf(Function);
        k.editorRefreshScreen();
    });
    it(" editorDrawStatusBar() : can draw lines", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.editorDrawStatusBar).toBeInstanceOf(Function);
        expect(k.abuf.length).toBe(0);
        k.editorDrawStatusBar();
        expect(k.abuf.length).not.toBe(0);
    });
    it(" editorDrawMessageBar() : can draw lines", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.editorDrawMessageBar).toBeInstanceOf(Function);
        expect(k.abuf.length).toBe(0);
        k.editorDrawMessageBar();
        expect(k.abuf.length).not.toBe(0);
    });
    it(" editorDrawRows() : can draw lines", () => {
        let k = new Kilo(["LICENSE"]);

        k.E.screenrows = 100;
        k.E.screencols = 100;
        expect(k.editorDrawRows).toBeInstanceOf(Function);
        expect(k.abuf.length).toBe(0);
        k.editorDrawRows();
        expect(k.abuf.length).not.toBe(0);

        k = new Kilo(["LICENSE"]);
        k.E.screenrows = 10;
        k.E.screencols = 10;
        expect(k.abuf.length).toBe(0);
        k.editorDrawRows();
        expect(k.abuf.length).not.toBe(0);

        k = new Kilo([]);
        k.E.screenrows = 100;
        k.E.screencols = 100;
        expect(k.abuf.length).toBe(0);
        k.editorDrawRows();
        expect(k.abuf.length).not.toBe(0);
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
        const k = new Kilo(["LICENSE"]);

        k.editorMoveCursor("up");

        expect(k.editorMoveCursor).toBeInstanceOf(Function);
    });
    it(" die() : can exit with proper status code", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.die).toBeInstanceOf(Function);
        k.die();

    });
    it(" editorDelChar() : can delete char", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.editorDelChar).toBeInstanceOf(Function);
        k.editorDelChar();

    });
    it(" editorInsertRow(insert) : can insert row", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.editorInsertRow).toBeInstanceOf(Function);
        k.editorInsertRow();

    });
    it(" editorInsertChar(c) : can insert c", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.editorInsertChar).toBeInstanceOf(Function);
        k.editorInsertChar("");

    });
    it(" editorRowDelChar(at) : can delete char at 'at'", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.editorRowDelChar).toBeInstanceOf(Function);
        k.editorRowDelChar(0);

    });
    it(" editorRowInsertChar(at,c) : can insert char at 'at'", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.editorRowInsertChar).toBeInstanceOf(Function);
        k.editorRowInsertChar(0, "");

    });
    it(" main : can run properly", () => {
        const k = new Kilo(["LICENSE"]);

        expect(k.main).toBeInstanceOf(Function);
        k.main();
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

        console.error = str => {};
        process.exit = status => {};
        process.stdout.cursorTo = (x, y) => {};
        process.stdout.clearScreenDown = () => {};
        process.stdin.isTTY = true;
        process.stdin.setRawMode = b => {};
        process.stdin.resume = () => {};
        process.stdout.write = (buf, len) => {};
        process.stdout.on = func => {};
        process.stdin.on = func => {};
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
    });
});
