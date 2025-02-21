/// <reference path="./cli.d.js" />
// @ts-check
/**
 * Command Line Interpreter.
 *
 * https://github.com/chzager/cli
 *
 * @copyright (c) 2025 Christoph Zager
 * @license MIT
 */
class CommandLineInterpreter
{
	/**
	 * The basic built-in commands for every CLI.
	 * @type {Record<string, CommandLineInterpreter_CommandCallback>}
	 */
	static builtInCommands = {
		/** Clears everything from the CLI. */
		"clear": (cli, arg1) =>
		{
			if (arg1 === "--?")
			{
				cli.writeLn("Usage: clear")
					.writeLn("Clear all output.");
			}
			else
			{
				cli.body.replaceChildren();
			}
		},
		/** Prints a list of all available commands (including the internal ones) to the CLI. */
		"help": (cli, arg1) =>
		{
			if (arg1 === "--?")
			{
				cli.writeLn("Usage: help")
					.writeLn("Display a list of all available commands.");
			}
			else
			{
				cli.writeLn("These are the available commands:");
				for (let command of Array.from(cli.commands.keys()).sort())
				{
					cli.writeLn(" ".repeat(2) + command);
				}
				cli.writeLn("Type `<command> --?` for help on a specific command.");
			}
		},
		/** Prints the input history. */
		"history": (cli, arg1) =>
		{
			if (arg1 === "--?")
			{
				cli.writeLn("Usage: history [OPTION]")
					.writeLn("Display or manipulate the list of all that has been entered.")
					.writeLn("Optional arguments to manipulate the history:")
					.writeLn("    --clean  Remove duplicate entries and invalid commands")
					.writeLn("    --clear  Clear the entire history");
			}
			else
			{
				if (arg1 === "--clear")
				{
					cli.history = [];
					cli.memorize("history", cli.history);
				}
				else if (arg1 === "--clean")
				{
					let builtInCommandNames = Object.keys(CommandLineInterpreter.builtInCommands);
					let validCommands = Array.from(cli.commands.keys()).filter((s) => !builtInCommandNames.includes(s));
					cli.history = Array.from(new Set(cli.history)).filter((s) =>
					{
						let command = /^\S+/.exec(s)?.[0] ?? "";
						return validCommands.includes(command);
					});
					cli.memorize("history", cli.history);
					cli.writeLn("** The history has been cleaned. **");
				}
				else if (!!arg1)
				{
					cli.writeLn(`Unknown argument: ${arg1}`);
					return;
				}
				if (cli.history.length > 0)
				{
					for (let item of cli.history)
					{
						cli.writeLn(item);
					}
				}
				else
				{
					cli.writeLn("** The history is empty. **");
				}
			}
		},
		/** Prints all stored variables. */
		"printvars": (cli, arg1) =>
		{
			if (arg1 === "--?")
			{
				cli.writeLn("Usage: printvars")
					.writeLn("Display all stored variables.");
			}
			else
			{
				if (cli.variables.size > 0)
				{
					let varEntries = Array.from(cli.variables.entries());
					for (let [varName, varValue] of varEntries.sort((a, b) => a[0].localeCompare(b[0])))
					{
						cli.writeLn(`${varName}=${varValue}`);
					}
				}
				else
				{
					cli.writeLn("** There are no variables defined. **");
				}
			}
		}
	};

	/**
	 * ID of the current CLI instance. This is used for appliance of CSS styles
	 * and storing data in the browser's local storage.
	 * @type {string}
	 */
	id;

	/**
	 * This CLI's HTML element.
	 * @type {HTMLDivElement}
	 */
	body;

	/**
	 * Available commands in this CLI.
	 * @type {Map<string, Function>}
	 */
	commands;

	/**
	 * Options of this CLI.
	 * @type {CommandLineInterpreter_Options}
	 */
	options;

	/**
	 * The input history. This is also stored in the `localStorage`.
	 * @type {Array<string>}
	 */
	history;

	/**
	 * Variables that are defined with a value in this CLI.
	 * @type {Map<string, string>}
	 */
	variables;

	/**
	 * @param {Record<string, CommandLineInterpreter_CommandCallback>} commands Custom commands to be available in this CLI.
	 * @param {HTMLElement} [target] HTML element on the document where the CLI element shall be displayed.
	 * @param {CommandLineInterpreter_InitOptions} [options] Options for this CLI.
	 */
	constructor(commands, target, options)
	{
		const keyHandler = (/** @type {KeyboardEvent} */ event) =>
		{
			let inputEle = /** @type {HTMLElement} */ (event.target);
			switch (event.key)
			{
				case "PageUp":
					this.body.scrollBy(0, 0 - (this.body.clientHeight - 10));
					break;
				case "PageDown":
					this.body.scrollBy(0, (this.body.clientHeight - 10));
					break;
				case "ArrowUp":
					if (historyPosition > 0)
					{
						historyPosition -= 1;
						inputEle.innerText = this.history[historyPosition];
						setTimeout(() =>
						{
							let range = document.createRange();
							let selection = window.getSelection();
							if (!!selection)
							{
								range.setStart(inputEle.childNodes[0], inputEle.innerText.length);
								range.setEnd(inputEle.childNodes[0], inputEle.innerText.length);
								selection.removeAllRanges();
								selection.addRange(range);
							}
						}, 1);
					};
					break;
				case "ArrowDown":
					if (historyPosition < this.history.length)
					{
						historyPosition += 1;
						inputEle.innerText = (historyPosition === this.history.length) ? "" : this.history[historyPosition];
					};
					break;
				case "Enter":
				case "NumpadEnter":
					let inputString = inputEle.innerText;
					let async = false;
					let inputValues = /(\S+)(.*)/.exec(inputString.trim());
					if (!!inputValues)
					{
						historyPosition = (this.history[this.history.length - 1] !== inputString) ? this.history.push(inputString) : this.history.length;
						this.memorize("history", this.history);
						let variableAssignment = /^([a-z]\w*)=(.*)/i.exec(inputString);
						if (variableAssignment)
						{
							let variableName = variableAssignment[1].trim();
							let variableValue = variableAssignment[2].trim();
							if (!!variableValue)
							{
								this.variables.set(variableName, variableValue);
							}
							else
							{
								this.variables.delete(variableName);
							}
							this.memorize("variables", Object.fromEntries(this.variables.entries()));
						}
						else
						{
							let command = inputValues[1];
							let commandFunction = this.commands.get(command);
							let argumentsString = (inputValues[2] ?? "").trim();
							for (let [varName, varValue] of this.variables.entries())
							{
								argumentsString = argumentsString.replace(new RegExp("\\$\\" + varName + "\\b", "gi"), varValue);
							}
							let commandArguments = [];
							for (let argMatch of argumentsString.matchAll(/"([^"]*)"|'([^']*)'|\S+/g))
							{
								commandArguments.push(argMatch[1] || argMatch[2] || argMatch[0]);
							}
							if (typeof commandFunction === "function")
							{
								try
								{
									let cmdResult = commandFunction(this, ...commandArguments);
									if (cmdResult instanceof Promise)
									{
										async = true;
										cmdResult.then(() => this.receiveInput(this.options.prompt, keyHandler));
									}
								}
								catch (error)
								{
									console.error(error);
								}
							}
							else
							{
								this.writeLn(`Unknown command: ${command}`);
							}
						}
					}
					if (async === false)
					{
						this.receiveInput(this.options.prompt, keyHandler);
					}
			}
		};
		this.options = Object.assign({
			prompt: "\nCLI> "
		}, options);
		this.id = options?.id || this.constructor.name;
		this.history = [];
		this.variables = new Map();
		if (localStorage)
		{
			let storedData = JSON.parse(localStorage.getItem(this.id) || "{}");
			this.history = storedData?.history ?? [];
			for (let [varName, varValue] of Object.entries(storedData?.variables ?? {}))
			{
				this.variables.set(varName, varValue);
			}
		};
		let historyPosition = this.history.length;
		this.commands = new Map();
		for (let commandProvider of [CommandLineInterpreter.builtInCommands, commands])
		{
			for (let [command, func] of Object.entries(commandProvider))
			{
				if (typeof func === "function")
				{
					this.commands.set(command, func);
				}
			}
		}
		// @ts-ignore - Missing deprecated property 'align'.
		this.body = CommandLineInterpreter.createElement("div");
		this.body.id = this.constructor.name;
		this.body.onclick = () =>
		{
			if (window.getSelection()?.toString() === "")
			{
				let inputEle = this.body.querySelector(".input");
				if (inputEle instanceof HTMLElement)
				{
					inputEle.focus();
				}
			}
		};
		if (!(target instanceof HTMLElement))
		{
			target = document.body;
		}
		target.appendChild(this.body);
		/** @type {HTMLStyleElement} */
		// @ts-ignore - Missing properties.
		let styleElement = CommandLineInterpreter.createElement("style");
		document.head.appendChild(styleElement);
		// @ts-ignore - Possible 'null'.
		styleElement.sheet.insertRule(`#${this.constructor.name} * {
				background-color: transparent;
				color: inherit;
				font-family: inherit;
				font-size: inherit;
				padding: 0;
				margin: 0;
				border: none;
				outline: none;
				white-space: pre;
			}`);
		if (!!options?.motd)
		{
			this.writeLn(options.motd);
		}
		this.receiveInput(this.options.prompt, keyHandler);
	}

	/**
	 * Internal generic user input receiver.
	 *
	 * You should use either {@linkcode readLn()} or {@linkcode readKey()}.
	 * @param {string} prompt The prompt to be printed before the input.
	 * @param {(ev: KeyboardEvent) => any} keyHandler Event handler for keyboard events.
	 * @protected
	 */
	receiveInput (prompt, keyHandler)
	{
		this.write(prompt);
		let inputEle = CommandLineInterpreter.createElement(`span.input[contenteditable="true"][spellcheck="false"][autocorrect="off"][autocapitalize="none"]`);
		inputEle.onkeydown = (/** @type {KeyboardEvent} */ event) =>
		{
			event.stopImmediatePropagation();
			switch (event.key)
			{
				case "Escape":
					inputEle.innerText = "";
					break;
				case "Enter":
				case "NumpadEnter":
					event.preventDefault();
					inputEle.replaceWith(CommandLineInterpreter.createElement("span", inputEle.innerText + "\n"));
					break;
			}
			keyHandler(event);
		};
		setTimeout(() =>
		{ // Isolate from any event.
			this.body.appendChild(inputEle);
			this.body.scrollTo(0, this.body.scrollHeight);
			inputEle.focus();
		}, 1);
	}

	/**
	 * Stores data in the browser's `localStorage`.
	 * @param {string} key Key (identifier) of the data to be stored.
	 * @param {any} data Data to be stored.
	 * @private
	 */
	memorize (key, data)
	{
		if (localStorage)
		{
			let storedData = JSON.parse(localStorage.getItem(this.id) || "{}");
			storedData[key] = data;
			localStorage.setItem(this.id, JSON.stringify(storedData));
		}
	};

	/**
	 * Writes the given text to the CLI. Usually you should rather use `writeLn()` which adds a new line at the end.
	 * @param {string} text Text to be written.
	 */
	write (text)
	{
		const __format = (/** @type {string} */ text) =>
		{
			let tags = /\*|_|`|https?:\/\//;
			let chunks = [];
			let tag = tags.exec(text);
			let safeCounter = 0;
			while (!!tag)
			{
				let fmtChar = tag[0];
				if (["*", "_", "`"].includes(fmtChar))
				{
					let tagRex = new RegExp("(^|\\s)\\" + fmtChar + "([^\\" + fmtChar + "\\s](.*?[^\\" + fmtChar + "\\s])*?)\\" + fmtChar + "(\\W|$)");
					let htmlTag = "span";
					switch (fmtChar)
					{
						case "*":
							htmlTag = "em";
							break;
						case "_":
							htmlTag = "i";
							break;
						case "`":
							htmlTag = "code";
							break;
					}
					let tagContent = tagRex.exec(text);
					if (!!tagContent)
					{
						let tagIndex = text.indexOf(tagContent[2]);
						chunks.push(text.substring(0, tagIndex - 1));
						chunks.push(CommandLineInterpreter.createElement(htmlTag, tagContent[2]));
						text = text.substring(tagIndex + tagContent[2].length + 1);
					}
					else
					{
						chunks.push(text.substring(0, tag.index + 1));
						text = text.substring(tag.index + 1);
					}
				}
				else if (tag[0].startsWith("http"))
				{
					let url = /https?:\/\/(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/i.exec(text);
					if (!!url)
					{
						let tagIndex = text.indexOf(url[0]);
						chunks.push(text.substring(0, tagIndex));
						chunks.push(CommandLineInterpreter.createElement(`a[href="${url[0]}"][target="_blank"]`, url[0]));
						text = text.substring(tagIndex + url[0].length);
					}
				}
				tag = tags.exec(text);
				safeCounter += 1;
				if (safeCounter > 1e4)
				{
					tag = null;
				}
			}
			chunks.push(text);
			return chunks;
		};
		for (let chunk of __format(text))
		{
			if (chunk instanceof HTMLElement)
			{
				this.body.appendChild(chunk);
			}
			else if (!!chunk)
			{
				this.body.appendChild(CommandLineInterpreter.createElement("span", chunk));
			}
		}
		this.body.scrollTo(0, this.body.scrollHeight);
		return this;
	};

	/**
	 * Just like `write()`, but adds a new line. You should prefer this over `write()`.
	 * @param {string} text Text to be written.
	 */
	writeLn (text)
	{
		return this.write(text + "\n");
	}

	/**
	 * Requires the user to press a single key.
	 * @param {string} keys Set of keys from which one is awaited (e.g. `"yn"` to expect either "Y" or "N" to be pressed). You can use ranges here (e.g. `"1-9"` for any key between "1" and "9").
	 * @param {string} [prompt] The prompt to be printed before the input.
	 * @returns {Promise<string>} Returns the key that the user has pressed.
	 */
	readKey (keys, prompt)
	{
		return new Promise((resolve) =>
		{
			let keysRex = new RegExp("^[" + keys + "]$", "i");
			this.receiveInput(prompt || keys.split("").join("/").toUpperCase() + "? ",
				(/** @type {KeyboardEvent} */ event) =>
				{
					event.preventDefault();
					let inputEle = /** @type {HTMLElement} */ (event.target);
					if ((keysRex.test(event.key)) || (event.key === "Escape"))
					{
						let inputKey = (event.key === "Escape") ? "" : event.key ?? "";
						inputEle.replaceWith(CommandLineInterpreter.createElement("span", inputKey + "\n"));
						resolve(inputKey.toUpperCase());
					}
				});
		});
	}

	/**
	 * Reads any user input from the CLI but does not show the input on screen.
	 * The user must commit his input with _[Enter]_.
	 * @param {string} [prompt] The prompt to be printed before the input. Default is `"> "`.
	 * @returns {Promise<string>} Returns the secret that the user has entered.
	 */
	readSecret (prompt)
	{
		return new Promise((resolve) =>
		{
			let secret = "";
			this.receiveInput(prompt || "> ",
				(/** @type {KeyboardEvent} */ event) =>
				{
					switch (event.key)
					{
						case "Enter":
						case "NumpadEnter":
							resolve(secret);
							break;
						case "Backspace":
							secret = secret.substring(0, secret.length - 1);
							break;
						default:
							if (event.key.length === 1)
							{
								event.preventDefault();
								secret += event.key;
							}
					}
				});
		});
	}

	/**
	 * Reads any user input from the CLI. The user must commit his input with _[Enter]_.
	 * @param {string} [prompt] The prompt to be printed before the input. Default is `"> "`.
	 * @returns {Promise<string>} Returns the text that the user has entered.
	 */
	readLn (prompt)
	{
		return new Promise((resolve) =>
		{
			this.receiveInput(prompt || "> ",
				(/** @type {KeyboardEvent} */ event) =>
				{
					switch (event.key)
					{
						case "Enter":
						case "NumpadEnter":
							resolve( /** @type {HTMLElement} */(event.target).innerText.trim());
					}
				});
		});
	}

	/**
	 * Creates a new HTML elemement.
	 * @param {string} tag The tag of the desired HTML element. This may include css classes and attributes.
	 * @param {...string|HTMLElement} children Content (or child elements) to be created on/in the HTML element.
	 * @returns Returns the newly created HTML element.
	 */
	static createElement (tag, ...children)
	{
		let element = document.createElement(/^[a-z0-1]+/.exec(tag)?.[0] || "div");
		// Set attributes:
		for (let attributeMatch of tag.matchAll(/\[(.+?)=["'](.+?)["']\]/g))
		{
			element.setAttribute(attributeMatch[1], attributeMatch[2]);
		}
		// Add css classes:
		for (let cssClass of tag.replaceAll(/\[.+\]/g, "").matchAll(/\.([^.[\s]+)/g))
		{
			element.classList.add(cssClass[1]);
		}
		// Add children:
		for (let child of children)
		{
			if (child instanceof HTMLElement)
			{
				element.appendChild(child);
			}
			else
			{
				element.innerText = child;
			}
		}
		return element;
	};
}
