/**
 * Command Line Interpreter – a console GUI element for text-based user interaction within web applications.
 * @version 1.0.2
 * @copyright (c) 2025 Christoph Zager
 * @license MIT
 * @link https://github.com/chzager/cli
 */
interface CommandLineInterpreter {
	/**
	 * ID of the current CLI instance. This is used for appliance of CSS styles and storing
	 * data in the browser's local storage.
	 */
	id: string;

	/** This CLI's HTML element. */
	body: HTMLDivElement;

	/** Available commands in this CLI. */
	commands: Map<string, CommandLineInterpreterCommandCallback>;

	/** String to be used as command prompt. */
	prompt: string;

	/** Options of this CLI. */
	options: {
		/** Enable or disable formatting the output text on the CLI. */
		richtextEnabled: boolean;
		/** Minimum whitespace string for tab-separated (`\t`) values in output. Default is two. */
		tabWidth: number;
	};

	/** The input history. This is also stored in the `localStorage`. */
	history: string[];

	/**
	 * Evaluate a string expression of commands or variable assignments. Multiple
	 * commands/assignments are separated by semi-colon (`;`) or line break (`\n`).
	 * @param expr Expression to evaluate.
	 * @returns A `Promise` that resolves once all commands have been fully processed.
	 */
	eval(expr: string): Promise<void>;

	/**
	 * Stores data in the browser's `localStorage`.
	 * @param key Key (identifier) of the data to be stored.
	 * @param data Data to be stored.
	 */
	memorize(key: string, data: any): void;

	/**
	 * Checks if a named argument is present in the arguments.
	 * @param args Arguments.
	 * @param name Name of the argument to be checked. Named arguments always begin with one or two hyphens.
	 */
	namedArgumentExists(args: string[], ...name: string[]): boolean;

	/**
	 * Retrieves the value of a named argument, which is the item following the named argument
	 * in the arguments list.
	 * @param args Arguments.
	 * @param name Name of the argument whose value is to be retrieved. Named arguments always begin with one or two hyphens.
	 * @returns The named argument's value, or `undefined` if the named argument does not exists.
	 */
	getNamedArgumentValue(args: string[], ...name: string[]): string | undefined;

	/**
	 * Writes the given text to the CLI on screen. Usually you should rather use
	 * {@linkcode writeLn()} which adds a new line at the end of the text.
	 * @param text Text to be written.
	 */
	write(text: string): CommandLineInterpreter;

	/**
	 * Just like {@linkcode write()}, but adds a new line at the end of the text. You should
	 * prefer this over `write()`.
	 * @param text Text to be written.
	 */
	writeLn(text: string): CommandLineInterpreter;

	/**
	 * Internal generic user input receiver.
	 *
	 * You should use either {@linkcode readLn()} or {@linkcode readKey()}.
	 * @param prompt The prompt to be printed before the input.
	 * @param keyHandler Event handler for keyboard events.
	 * @protected
	 */
	receiveInput(prompt?: string, keyHandler?: (ev: KeyboardEvent) => any): void;

	/**
	 * Require the user to press a single key.
	 * @param keys Set of acceptable keys. This may include special keys such as "Enter" or "Escape". See [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values).
	 * @param prompt The prompt to be printed before the input.
	 * @returns A `Promise` that resolves to the pressed key. Does not resolve for keys outside the defined set.
	 */
	readKey(keys: string[], prompt?: string): void;

	/**
	 * Read any user input from the CLI. The user must commit his input with [Enter].
	 * @param prompt The prompt to be printed before the input. Default is `"> "`.
	 * @returns A `Promise` that resolves to the entered text.
	 */
	readLn(prompt?: string): string;

	/**
	 * Read any user input from the CLI but does not show the input on screen. The user must
	 * commit his input with [Enter].
	 * @param prompt The prompt to be printed before the input. Default is `"> "`.
	 * @returns A `Promise` that resolves to the entered secret as a plain string.
	 */
	readSecret(prompt?: string): string;
}
declare var CommandLineInterpreter: {
	/**
	 * @param commands Custom commands to be available in this CLI.
	 * @param target HTML element on the document where the CLI element shall be displayed.
	 * @param options Options for this CLI.
	 */
	new (commands: Record<string, CommandLineInterpreterCommandCallback>, target?: HTMLElement, options?: CommandLineInterpreterInitOptions): CommandLineInterpreter;
	prototype: CommandLineInterpreter;
};

/** Initialization options for the `CommandLineInterpreter`. */
interface CommandLineInterpreterInitOptions {
	/** If your web page uses more than one CLI, you may specify unique IDs here. */
	id?: string;

	/** "Message of the day". This text is printed when the CLI is initialized. */
	motd?: string;

	/**
	 * String to be used as the prompt. Default is `"\nCLI> "` which includes a new line
	 * before the prompt.
	 */
	prompt?: string;

	/** Enable or disable formatting the text on the CLI. Default is `true`. */
	richtextEnabled?: boolean;

	/**
	 * Commands or variable assignments to be executed at startup (after the MOTD is printed
	 * but before the first input prompt). Multiple commands/assignments are separated by
	 * semi-colon (`;`) or line break (`\n`).
	 */
	startup?: string;

	/** Minimum whitespaces between tab-separated (`\t`) values in output. Default is `2`. */
	tabWidth?: number;

	/**
	 * The theme applied to the CLI instance. To use a custom theme, select "custom". Please
	 * note that you must manually add your custom theme's CSS file to the document.
	 */
	theme?: "default" | "light" | "white" | "ubuntu" | "custom";
}

/**
 * Callback type for functions ("commands") of the `CommandLineInterpreter`.
 * @param cli The calling `CommandLineInterpreter`.
 * @param args Arguments given by the user in the command line.
 * @returns Any value or a `Promise` for asynchronous methods.
 */
type CommandLineInterpreterCommandCallback = (cli: CommandLineInterpreter, ...args: string[]) => any | Promise<any>;
