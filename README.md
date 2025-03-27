# A command line interpreter (aka console, terminal) for your web applications

The CLI (as for "command line interpreter") adds an element to your web application's GUI for text-based user interaction via a set of commands. It is lightweight, fully customizable and the integration of your own commands is a cakewalk.

![FileSize](https://img.badgesize.io/chzager/cli/main/cli.min.js?label=File%20size)
![Standalone](https://img.shields.io/badge/Standalone-yes-33cc33)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

**Table of Contents**

- [Installation](#installation)
- [Usage](#usage)

## Installation

No installation required. Just link the source (i.e. from JsDelivr):

```html
<script src="https://cdn.jsdelivr.net/gh/chzager/cli/cli.min.js"></script>
```

The type definitions are avaliable at https://chzager.github.io/cli/cli.d.ts.

## Usage

Usage doesn't get any easier: Define your commands and instantiate a `CommandLineInterpreter` object.

```javascript
const myCommands = {
	"hello": (cli) => {
		cli.writeLn("Hello, world!");
	},
};
new CommandLineInterpreter(myCommands);
```

Let's get more interactive:

```javascript
const myCommands = {
	"hello": (cli) => {
		return new Promise((resolve) => {
			cli.readLn("What's your name? ").then((name) => {
				cli.writeLn(`Hello, ${name}!`);
				resolve();
			});
		});
	},
};
```
