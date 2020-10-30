const Kilo = require('../src/kilo');

describe('Kilo', () => {
  it(' constructor() : can create new instance', () => {
    const k = new Kilo();
    expect(k).not.toBeNull();
    expect(k).toBeInstanceOf(Kilo);
  });
  it(' editorOpen(file) : can read all strings from file', () => {
    const k = new Kilo();
    expect(k.editorOpen).toBeInstanceOf(Function);
    k.editorOpen('LICENSE');
    expect(k.E.erow.length).toBe(21);
    // no such file or directory
    const t = () => {
      let qi = new Kilo();
      qi.editorOpen('__tests__/testData.csv');
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
  it(' editorRefreshScreen() : can refresh the screen', () => {
    const k = new Kilo();
    expect(k.editorRefreshScreen).toBeInstanceOf(Function);
  });
  it(' editorDrawRows() : can draw lines', () => {
    const k = new Kilo();
    expect(k.editorDrawRows).toBeInstanceOf(Function);
  });
});
