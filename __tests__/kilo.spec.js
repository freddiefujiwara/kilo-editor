const Kilo = require('../src/kilo');

describe('Kilo', () => {
  it(' constructor() : can create new instance', () => {
    const k = new Kilo();
    expect(k).not.toBeNull();
    expect(k).toBeInstanceOf(Kilo);
    expect(k.E.cx).toEqual(0);
    expect(k.E.cy).toEqual(0);
    expect(k.E.erow).toEqual('');
    expect(k.E.rowoff).toEqual(0);
    expect(k.E.erow.length).toEqual(0);
    expect(k.E.screenrows).not.toEqual(0);
    expect(k.E.screencols).not.toEqual(0);
  });
  it(' editorOpen() : can read all strings from file', () => {
    const k = new Kilo(['LICENSE']);
    expect(k.editorOpen).toBeInstanceOf(Function);
    k.editorOpen();
    expect(k.E.erow.length).toEqual(21);
    // no such file or directory
    const t = () => {
      let qi = new Kilo('__tests__/testData.csv');
      qi.editorOpen();
    };
    expect(t).toThrow(/no such file or directory/);
  });
  it(' enableRawMode() : can set tty from normal to raw mode', () => {
    const k = new Kilo();
    expect(k.enableRawMode).toBeInstanceOf(Function);
  });
  it(' disableRawMode() : can set tty from raw to normal mode', () => {
    const k = new Kilo();
    expect(k.disableRawMode).toBeInstanceOf(Function);
  });
  it(' editorScroll() : can culculate scroll', () => {
    const k = new Kilo();
    expect(k.editorScroll).toBeInstanceOf(Function);
  });
  it(' editorReadKey(str,key) : can switch regarding each input', () => {
    const k = new Kilo(['LICENSE']);
    k.E.screenrows = 40;
    k.E.screencols = 40;
    k.editorOpen();
    k.editorRefreshScreen = () => {};
    expect(k.editorReadKey).toBeInstanceOf(Function);
    // vertical cursor move
    k.editorReadKey('',{name:'down'});
    expect(k.E.cy).toEqual(1);
    k.editorReadKey('',{name:'pagedown'});
    expect(k.E.cy).toEqual(21);
    k.editorReadKey('',{name:'down'});
    expect(k.E.cy).toEqual(21);
    k.editorReadKey('',{name:'up'});
    expect(k.E.cy).toEqual(20);
    k.editorReadKey('',{name:'pageup'});
    expect(k.E.cy).toEqual(0);
    // horizontal cursor move
    k.editorReadKey('',{name:'left'});
    expect(k.E.cx).toEqual(1);
    k.editorReadKey('',{name:'end'});
    expect(k.E.cx).toEqual(39);
    k.editorReadKey('',{name:'left'});
    expect(k.E.cx).toEqual(39);
    k.editorReadKey('',{name:'right'});
    expect(k.E.cx).toEqual(38);
    k.editorReadKey('',{name:'home'});
    expect(k.E.cx).toEqual(0);
  });
  it(' editorRefreshScreen() : can refresh the screen', () => {
    const k = new Kilo();
    expect(k.editorRefreshScreen).toBeInstanceOf(Function);
  });
  it(' editorDrawRows() : can draw lines', () => {
    const k = new Kilo(['LICENSE']);
    expect(k.editorDrawRows).toBeInstanceOf(Function);
  });
});
