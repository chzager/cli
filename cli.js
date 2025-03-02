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
		/** Clear the entire output of the current session. */
		"clear": (cli, ...args) =>
		{
			switch (args?.[0])
			{
				case "--?":
					cli.writeLn("Usage: clear")
						.writeLn("Clear all output.");
					break;
				case undefined:
					cli.body.replaceChildren();
					break;
				default:
					cli.writeLn(`clear: Invalid argument: ${args[0]}`);
			}
		},
		/** Display a list of all available commands (including the built-in). */
		"help": (cli, ...args) =>
		{
			switch (args?.[0])
			{
				case "--?":
					cli.writeLn("Usage: help")
						.writeLn("Display a list of all available commands.");
					break;
				case undefined:
					cli.writeLn("These are the available commands:");
					for (let command of Array.from(cli.commands.keys()).sort())
					{
						cli.writeLn(`  ${command}`);
					}
					cli.writeLn("\nType `<command> --?` for help on a specific command.");
					break;
				default:
					cli.writeLn(`help: Invalid argument: ${args[0]}`);
			}
		},
		/** Display or manipulate the input history. */
		"history": (cli, ...args) =>
		{
			switch (args?.[0])
			{
				case "--?":
					cli.writeLn("Usage: history [option]")
						.writeLn("Display or manipulate the list of all that has been entered.")
						.writeLn("Optional arguments to manipulate the history:")
						.writeLn("    --clean  Remove duplicate entries and invalid commands")
						.writeLn("    --clear  Clear the entire history");
					break;
				case "--clear":
					cli.history = [];
					cli.memorize("history", cli.history);
					break;
				case "--clean":
					let builtInCommandNames = Object.keys(CommandLineInterpreter.builtInCommands);
					let validCommands = Array.from(cli.commands.keys()).filter((s) => !builtInCommandNames.includes(s));
					cli.history = Array.from(new Set(cli.history)).filter((s) =>
					{
						let command = /^\S+/.exec(s)?.[0] ?? "";
						return validCommands.includes(command);
					});
					cli.memorize("history", cli.history);
					cli.writeLn("** The history has been cleaned. **");
					break;
				case undefined:
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
					break;
				default:
					cli.writeLn(`history: Invalid argument: ${args[0]}`);
			}
		},
		/** Display all stored variables. */
		"printvars": (cli, ...args) =>
		{
			switch (args?.[0])
			{
				case "--?":
					cli.writeLn("Usage: printvars")
						.writeLn("Display all stored variables.");
					break;
				case undefined:
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
					break;
				default:
					cli.writeLn(`printvars: Invalid argument: ${args[0]}`);
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
			let inputEle = /** @type {HTMLElement} */(event.target);
			switch (event.key)
			{
				case "PageUp":
					this.body.scrollBy(0, 0 - (this.body.clientHeight - 10));
					break;
				case "PageDown":
					this.body.scrollBy(0, (this.body.clientHeight - 10));
					break;
				case "ArrowUp":
					if ((historyPosition > 0) && (this.history.length > 0))
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
						}, 10);
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
					let inputString = inputEle.innerText;
					inputEle.replaceWith(CommandLineInterpreter.createElement("span", inputString + "\n"));
					if (/\w/.test(inputString))
					{
						historyPosition = (this.history[this.history.length - 1] !== inputString) ? this.history.push(inputString.trim()) : this.history.length;
						this.memorize("history", this.history);
					}
					this.eval(inputString.trim())
						.finally(() =>
						{
							this.receiveInput(this.options.prompt, keyHandler);
						});
			}
		};
		this.options = Object.assign({
			prompt: "\nCLI> ",
			richText: true
		}, options);
		this.id = options?.id || this.constructor.name;
		this.history = [];
		this.variables = new Map();
		if (localStorage)
		{
			let storedData = JSON.parse(localStorage.getItem(this.id) || "{}");
			this.history = storedData?.history ?? [];
			Object.entries(storedData?.variables ?? {}).map(([n, v]) => this.variables.set(n, v));
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
		document.head.appendChild(CommandLineInterpreter.createElement(
			"style",
			`#${this.constructor.name} * {${[
				"background-color: transparent;",
				"color: inherit;",
				"font-family: inherit;",
				"font-size: inherit;",
				"padding: 0;",
				"margin: 0;",
				"border: none;",
				"outline: none;",
				"white-space: pre-wrap;"].join("")}}`
		));
		// @ts-ignore missing deprecated property 'align'.
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
		if (!!options?.motd)
		{
			this.writeLn(options.motd);
		}
		this.eval(options?.startup ?? "")
			.then(() =>
			{
				this.receiveInput(this.options.prompt, keyHandler);
			});
	}

	/**
	 * Evaluate a string expression of commands or variable assignments.
	 * Multiple commands/assignments are separated by semi-colon (`;`) or line break (`\n`).
	 * @param {string} expr Expression to evaluate.
	 * @returns A `Promise` that is fulfilled once all commands have been fully processed.
	 */
	eval (expr)
	{
		return /** @type {Promise<void>} */(new Promise((resolve) =>
		{
			const __handleError = (/** @type {Error} */ error) =>
			{
				this.writeLn(`\x1b[31m${error}`);
				console.error(error);
			};
			const __eval = (/** @type {string} */ string) =>
			{
				return /** @type {Promise<void>} */(new Promise((__continue) =>
				{
					let immediateContinue = true;
					let variableAssignment = /^\s*(\S+)\s*=(.*)/.exec(string);
					if (variableAssignment)
					{
						if (/\W/.test(variableAssignment[1]))
						{
							this.writeLn(`Invalid token: ${/\W/.exec(variableAssignment[1])?.[0]}`);
						}
						else
						{
							let variableName = variableAssignment[1];
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
					}
					else
					{
						let inputValues = /(\S+)(.*)/.exec(string);
						if (!!inputValues)
						{
							let cmd = inputValues[1];
							let commandFunction = this.commands.get(cmd);
							if (typeof commandFunction === "function")
							{
								let args = [];
								for (let argMatch of (inputValues[2] ?? "").matchAll(/"([^"]*)"|\S+/g))
								{
									args.push(argMatch[1] || argMatch[2] || argMatch[0]);
								}
								args = args.map((arg) =>
								{
									if (arg.startsWith("-") === false)
									{
										for (let [varName, varValue] of this.variables.entries())
										{
											arg = arg.replace(new RegExp("\\$" + varName + "\\b", "gi"), varValue);
										}
									}
									return arg;
								});
								try
								{
									let cmdResult = commandFunction(this, ...args);
									if (cmdResult instanceof Promise)
									{
										immediateContinue = false;
										cmdResult
											.catch(__handleError)
											.finally(__continue);
									}
								}
								catch (error)
								{
									__handleError(error);
								}
							}
							else
							{
								this.writeLn(`Unknown command: ${cmd}`);
							}
						}
					}
					if (immediateContinue)
					{
						__continue();
					}
				}));
			};
			const __loop = () =>
			{
				let chunk = chunks.shift();
				if (!!chunk)
				{
					__eval(chunk)
						.finally(__loop);
				}
				else
				{
					resolve();
				}
			};
			let chunks = expr.split(/\s*[;\n]+\s*/).filter((s) => !!s.trim());
			__loop();
		}));
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
			keyHandler(event);
		};
		setTimeout(() =>
		{ // Isolate from any event.
			this.body.appendChild(inputEle);
			this.body.scrollTo(0, this.body.scrollHeight);
			inputEle.focus();
		}, 10);
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
	 * Writes the given text to the CLI on screen. Usually you should rather
	 *  use {@linkcode writeLn()} which adds a new line at the end of the text.
	 * @param {string} text Text to be written.
	 */
	write (text)
	{
		const __colorize = (/** @type {string} */ text) =>
		{
			let colorRex = /\x1b\[((3[0-7]|0)m)/g;
			let colorTags = Array.from(text.matchAll(colorRex)).map((m) => Object.assign({ colorKey: m[2], index: m.index }));
			if (colorTags.length > 0)
			{
				let chunks = [];
				if (colorTags[0].index > 0)
				{
					colorTags.unshift({ colorKey: "0", index: 0 });
				}
				colorTags.map((t, i) => Object.assign(t, { length: colorTags[i + 1]?.index ?? text.length }));
				for (let colorTag of colorTags)
				{
					let subText = text.substring(colorTag.index, colorTag.length).replace(colorRex, "");
					if (colorTag.colorKey === "0")
					{
						chunks.push(...__format(subText));
					}
					else
					{
						let color = "--cli-color-foreground";
						switch (colorTag.colorKey)
						{
							case "30":
								color = "--cli-color-black";
								break;
							case "31":
								color = "--cli-color-red";
								break;
							case "32":
								color = "--cli-color-green";
								break;
							case "33":
								color = "--cli-color-yellow";
								break;
							case "34":
								color = "--cli-color-blue";
								break;
							case "35":
								color = "--cli-color-magenta";
								break;
							case "36":
								color = "--cli-color-cyan";
								break;
							case "37":
								color = "--cli-color-white";
								break;
						}
						chunks.push(CommandLineInterpreter.createElement(`span[style="color:var(${color}"]`, ...__format(subText)));
					}
				}
				return chunks;
			}
			else
			{
				return __format(text);
			}
		};
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
		if (this.options.richText)
		{
			for (let chunk of __colorize(text))
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
		}
		else
		{
			this.body.appendChild(CommandLineInterpreter.createElement("span", text.replace(/\x1b\[\d+m/g, "")));
		}
		this.body.scrollTo(0, this.body.scrollHeight);
		return this;
	};

	/**
	 * Just like {@linkcode write()}, but adds a new line at the end of the text.
	 *  You should prefer this over `write()`.
	 * @param {string} text Text to be written.
	 */
	writeLn (text)
	{
		return this.write(text + "\n");
	}

	/**
	 * Require the user to press a single key.
	 * @param {Array<string>} keys Set of acceptable keys. This may include special
	 *  keys such as "Enter" or "Escape". See [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).
	 * @param {string} [prompt] The prompt to be printed before the input.
	 * @returns {Promise<string>} A `Promise` that resolves to the pressed key.
	 *  Does not resolve for keys outside the defined set.
	 */
	readKey (keys, prompt)
	{
		return new Promise((resolve) =>
		{
			let lKeys = [...keys.map((k) => k.toLowerCase())];
			this.receiveInput(prompt || keys.join("/").toUpperCase() + "? ",
				(/** @type {KeyboardEvent} */ event) =>
				{
					if (/^f\d/i.test(event.key) === false)
					{
						event.preventDefault();
						if (lKeys.includes(event.key.toLowerCase()))
						{
							let inputKey = event.key;
							let inputEle = /** @type {HTMLElement} */(event.target);
							inputEle.replaceWith(CommandLineInterpreter.createElement("span", inputKey + "\n"));
							resolve(inputKey.toUpperCase());
						}
					}
				});
		});
	}

	/**
	 * Read any user input from the CLI. The user must commit his input with [Enter].
	 * @param {string} [prompt] The prompt to be printed before the input. Default is `"> "`.
	 * @returns {Promise<string>} A `Promise` that resolves to the entered text.
	 */
	readLn (prompt)
	{
		return new Promise((resolve) =>
		{
			this.receiveInput(prompt || "> ",
				(/** @type {KeyboardEvent} */ event) =>
				{
					let inputEle = /** @type {HTMLElement} */ (event.target);
					switch (event.key)
					{
						case "Escape":
							inputEle.innerText = "";
							break;
						case "Enter":
							inputEle.replaceWith(CommandLineInterpreter.createElement("span", inputEle.innerText + "\n"));
							resolve(inputEle.innerText);
					}
				});
		});
	}

	/**
	 * Read any user input from the CLI but does not show the input on screen.
	 * The user must commit his input with _[Enter]_.
	 * @param {string} [prompt] The prompt to be printed before the input. Default is `"> "`.
	 * @returns {Promise<string>} A `Promise` that resolves to the entered secret as a plain string.
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
							let inputEle = /** @type {HTMLElement} */ (event.target);
							inputEle.replaceWith(CommandLineInterpreter.createElement("span", "\n"));
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
	 * Create a new HTML elemement.
	 * @param {string} tag The tag of the desired HTML element. This may include css classes and attributes.
	 * @param {...string|HTMLElement} children Content (or child elements) to be created on/in the HTML element.
	 * @returns The newly created HTML element.
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
