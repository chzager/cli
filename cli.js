/// <reference path="./cli.d.js" />
// @ts-check
/**
 * Command Line Interpreter.
 *
 * https://github.com/chzager/cli
 * @copyright (c) 2025 Christoph Zager
 * @license MIT
 */
class CommandLineInterpreter
{
	/**
	 * The basic build-in commands for every CLI.
	 * @type {Record<string,CommandLineInterpreter_CommandCallback>}
	 */
	static buildInCommands = {
		/** Clears everything from the CLI. */
		"clear": (cli, arg1) =>
		{
			if (arg1 === "--?")
			{
				cli.writeLn("Usage: clear")
					.writeLn("Clears all output.");
			}
			else
			{
				cli.body.replaceChildren();
			}
		},
		/** Prints a list of all avalibale commands (including the internal ones) to the CLI. */
		"help": (cli, arg1) =>
		{
			if (arg1 === "--?")
			{
				cli.writeLn("Usage: help")
					.writeLn("Prints a list of all available commands.");
			}
			else
			{
				cli.writeLn("These are the available commands:");
				for (let command of Array.from(cli.commands.keys()).sort())
				{
					cli.writeLn(" ".repeat(2) + command);
				}
				cli.writeLn("type `<command> --?` for help on a specific command.");
			}
		},
		/** Prints the input history. */
		"history": (cli, arg1) =>
		{
			if (arg1 === "--?")
			{
				cli.writeLn("Usage: history [OPTIONS]")
					.writeLn("Prints a list of all that has been entered.")
					.writeLn("Options:")
					.writeLn("  --clean  Removes duplicate entries and invalid commands from the history.")
					.writeLn("  --clear  Clears the entire history.");
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
					let buildInCommandNames = Object.keys(CommandLineInterpreter.buildInCommands);
					let validCommands = Array.from(cli.commands.keys()).filter((s) => !buildInCommandNames.includes(s));
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
					cli.writeLn("Unknown argument: " + arg1);
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
					.writeLn("Prints all stored variables.");
			}
			else
			{
				if (cli.variables.size > 0)
				{
					let varEntries = Array.from(cli.variables.entries());
					for (let [varName, varValue] of varEntries.sort((a, b) => a[0].localeCompare(b[0])))
					{
						cli.writeLn(varName + "=" + varValue);
					}
				}
				else
				{
					cli.writeLn("** There are no variables defined. **");
				}
			}
		}
	};

	// DOC
	id;

	/**
	 * This CLI's HTML element.
	 * @type {HTMLDivElement}
	 */
	body;

	/**
	 * Available commands in this CLI.
	 * @type {Map<string,Function>}
	 */
	commands;

	/**
	 * The input history. This is also stored in the `localStorage`.
	 * @type {Array<string>}
	 */
	history;

	/**
	 * Variables that are defined with a value in this CLI.
	 * @type {Map<string,string>}
	 */
	variables;

	/**
	 * @param {Record<string,CommandLineInterpreter_CommandCallback>} commands Custom commands to be available in this CLI.
	 * @param {HTMLElement} [target] HTML element on the document where the CLI element shall be displayed.
	 */
	constructor(commands, target)
	{
		const __read = () =>
		{
			this.write("\nCLI> ");
			let inputEle = CommandLineInterpreter.createElement("span.input[contenteditable='true'][spellcheck='false'][autocorrect='off'][autocapitalize='none']");
			inputEle.onkeydown = (/** @type {KeyboardEvent} */ event) =>
			{
				event.stopImmediatePropagation();
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
						inputEle.remove();
						this.writeLn(inputString);
						let inputValues = /(\S+)(.*)/.exec(inputString);
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
											cmdResult.then(() => __read());
										}
									}
									catch (error)
									{
										console.error(error);
									}
								}
								else
								{
									this.writeLn("Unknown command: " + command);
								}
							}
							if (async === false)
							{
								__read();
							}
						}
					// By intention no `break` here.
					case "Escape":
						inputEle.innerText = "";
				}
			};
			setTimeout(() =>
			{ // Isolate from any event.
				this.body.appendChild(inputEle);
				this.body.scrollTo(0, this.body.scrollHeight);
				inputEle.focus();
			}, 1);
		};
		if (!(target instanceof HTMLElement))
		{
			target = document.body;
		}
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
		for (let commandProvider of [CommandLineInterpreter.buildInCommands, commands])
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
		target.appendChild(this.body);
		__read();
	}

	/**
	 * Stores data in the browser's `localStorage`.
	 * @param {string} key Key (identifier) of the data to be sroted.
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
		this.body.appendChild(CommandLineInterpreter.createElement("span", text));
		this.body.scrollTo(0, this.body.scrollHeight);
		return this;
	};

	/**
	 * Just like `write()`, but adds a new line. Jou should prefere this over `write()`.
	 * @param {string} text Text to be written.
	 */
	writeLn (text)
	{
		return this.write(text + "\n");
	}

	/**
	 * Reads any user input from the CLI. The user must commit his input with _[Enter]_.
	 * @param {string} [prompt] The prompt to be printed before the input. Default is "`> `".
	 * @returns {Promise<string>} Returns the text that the user has entered.
	 */
	readLn (prompt)
	{
		return new Promise((resolve) =>
		{
			this.write(prompt ?? "> ");
			let inputEle = CommandLineInterpreter.createElement("span.input[contenteditable='true'][spellcheck='false'][autocorrect='off'][autocapitalize='none']");
			inputEle.onkeydown = (/** @type {KeyboardEvent} */ event) =>
			{
				event.stopImmediatePropagation();
				let inputEle = /** @type {HTMLElement} */ (event.target);
				switch (event.key)
				{
					case "Enter":
					case "NumpadEnter":
					case "Escape":
						let inputString = (event.key === "Escape") ? "" : inputEle.innerText ?? "";
						inputEle.remove();
						this.writeLn(inputString);
						resolve(inputString);
				}
			};
			setTimeout(() =>
			{ // Isolate from any event.
				this.body.appendChild(inputEle);
				this.body.scrollTo(0, this.body.scrollHeight);
				inputEle.focus();
			}, 1);
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
