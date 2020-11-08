[![Node.js CI](https://github.com/freddiefujiwara/kilojs/workflows/Node.js%20CI/badge.svg)](https://github.com/freddiefujiwara/kilojs/actions) [![npm version](https://badge.fury.io/js/kilo-editor.svg)](https://badge.fury.io/js/kilo-editor) [![GitHub issues](https://img.shields.io/github/issues/freddiefujiwara/kilo-editor)](https://github.com/freddiefujiwara/kilo-editor/issues)[![GitHub forks](https://img.shields.io/github/forks/freddiefujiwara/kilo-editor)](https://github.com/freddiefujiwara/kilo-editor/network)[![GitHub stars](https://img.shields.io/github/stars/freddiefujiwara/kilo-editor)](https://github.com/freddiefujiwara/kilo-editor/stargazers)[![GitHub license](https://img.shields.io/github/license/freddiefujiwara/kilo-editor)](https://github.com/freddiefujiwara/kilo-editor/blob/main/LICENSE)

# kilo-editor
JavaScript port for [kilo](https://github.com/snaptoken/kilo-src)

<img src="/publish/images/kilo-editor-demo.gif?raw=true" width="640px">


# How to install
```bash
$ npm -g i kilo-editor
```

# How to use
 Basic kilo-editor command cheat sheet
kilo-editor is an easy vim-like text editor, but learning how to use it effectively can be a challenge.

## Movement.
### h j k l
Basic movement keys. 
- h: left
- j:down
- k: up
- l: right

### 0 ^ $
Jump to the first column/first non-blank character/end of a line, like home or end. If you want to move to the other end of a row, you can move faster than you can with words.

### G
Jump directly to the end of the file

### gg
Jump directly to the top of the file

## Edit.
In kilo-editor, you spend most of your time in "normal" mode and only switch to "insert" mode when you need to add or change text.

### i a
Enters insert mode (insert with cursor/add after cursor/); press the Esc key to exit insert mode and return to normal mode.

### o O
Open a line break (below the current line/above the current line).

### dd
Delete a line. You can quickly rearrange the rows by deleting them, moving them to a new location, and pasting them with a "p".

### yy
Copy the line. "y" means "naughty".

### p 
Paste the last deleted or copied material before or after the cursor.

### u 
means undo

## Search.
Press "/" to enter search mode
Go to the first word found.
You can use <- or -> to move to the next search result

## command
As with the vim, use ":" to enter command mode
- :w -> save
- :q -> quit w/o save
- :wq -> quit w/ save 

# How to test
```bash
$ npm t
```

# support environment
## os
- [ubuntu-latest](https://github.com/actions/virtual-environments#available-environments)
- [windows-latest](https://github.com/actions/virtual-environments#available-environments)
- [macos-latest](https://github.com/actions/virtual-environments#available-environments)
## node version
- 12.x
- 14.x

# for developer
## test information
[Coverage report](https://freddiefujiwara.com/kilo-editor/coverage/lcov-report/)

## class document
[Kilo class](https://freddiefujiwara.com/kilo-editor/out/Kilo.html)
