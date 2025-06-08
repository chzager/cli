/**
 * These are the commands that are availible in the CLI.
 * @type {Record<string,CommandLineInterpreterCommandCallback>}
 */
const cmds = {
	"formatting": (cli, ...args) =>
	{
		switch (args?.[0])
		{
			case undefined:
			case "--?":
				cli.writeLn("Usage: formatting <feature>")
					.writeLn("Learn about Command Line Interpreter's capabilities for displaying formatted and colored text.")
					.writeLn([
						"\t\tstyles\tStyling text",
						"\t\tcolors\tPrinting colorized text",
						"\t\tdisable\tDisable rich text formatting in output"
					].join("\n"));
			case "styles":
				cli.writeLn("Output text can be styled **bold**, _italic_ and as `code` using Markdown syntax.")
					.writeLn("To bold text, add two asterisks or underscores before and after a word or phrase: `**bold**` or `__bold__`")
					.writeLn("To italicize text, add one asterisk or underscore before and after a word or phrase: `*italic*` or `_italic_`")
					.writeLn("To denote a word or phrase as code, enclose it in backticks: ``code...````");
				break;
			case "colors":
				cli.writeLn("To set the color of the output text, use the escape-sequence `\\x1b[XXm` in your string, where \"XX\" is the value of the desired color:")
					.writeLn([
						"\t\t30\t\x1b[30mBlack",
						"\t\t31\t\x1b[31mRed",
						"\t\t32\t\x1b[32mGreen",
						"\t\t33\t\x1b[33mYellow",
						"\t\t34\t\x1b[34mBlue",
						"\t\t35\t\x1b[35mMagenta",
						"\t\t36\t\x1b[36mCyan",
						"\t\t37\t\x1b[37mWhite",
						"\t\t0\t\x1b[0mDefault"
					].join("\n"));
				break;
			case "disable":
				cli.writeLn("To disable richt text formatting in the output, use the option `richtextEnabled: false` for your CLI instance.");
				break;
			default:
				cli.writeLn(`formatting: Invalid argument: ${args[0]}`);
		}
	},
	"tryout": (cli, ...args) =>
	{
		switch (args?.[0])
		{
			case undefined:
			case "--?":
				cli.writeLn("Usage: tryout <functionality>")
					.writeLn("Try out the various functionalities of Command Line Interpreter.")
					.writeLn([
						"\t\tasync\tAsynchronous command execution",
						"\t\treadkey\tRequest the pressing of a single key",
						"\t\treadln\tRequest any user input",
						"\t\treadsecret\tRequest a secret user input"
					].join("\n"));
				break;
			case "async":
				return new Promise((resolve) =>
				{
					let ivId = setInterval(() =>
					{
						cli.write(".");
					}, 1000);
					cli.writeLn("This simulates the execution of an asynchronous command, where the command function does not return immediately but instead provides a `Promise` that resolves once all it's operations are complete.")
						.write("Pretending to wait for something to finish...");
					setTimeout(() =>
					{
						cli.writeLn("\nDone.");
						clearInterval(ivId);
						resolve();
					}, 7500);
				});
			case "readkey":
				return new Promise((resolve) =>
				{
					cli.writeLn("This exemplifies the `readKey()` feature, a function that awaits a single key out of a defined set to be pressed.")
						.writeLn("In this example, you can press [c] to continue or [Esc] to cancel.")
						.readKey(["C", "Escape"], "Please press [c] or [esc]> ")
						.then((key) =>
						{
							cli.writeLn(`You chose to ${(key === "C") ? "continue" : "cancel"}.`);
							resolve();
						}
						);
				});
			case "readln":
				return new Promise((resolve) =>
				{
					cli.writeLn("This exemplifies the `readLn()` function to read any user input. It has to be committed by the [Enter] key.")
						.readLn("Please tell me something: ")
						.then((data) =>
						{
							cli.writeLn(`So you said "${data}".`);
							resolve();
						}
						);
				});
			case "readsecret":
				return new Promise((resolve) =>
				{
					cli.writeLn("This exemplifies the `readSecret()` function to read a secret user input. A secret user input is not showing on screen. It has to be committed by the [Enter] key.")
						.readSecret("Tell me a secret: ")
						.then((secret) =>
						{
							cli.writeLn(`Your ${secret.length}-character secret is save with me.`);
							resolve();
						}
						);
				});
			default:
				cli.writeLn(`tryout: Invalid argument: ${args[0]}`);
		}
	},
	"theme": (cli, ...args) =>
	{
		const THEMES = ["default", "light", "white", "black", "ubuntu"];
		const THEME_URL_ROOT = "https://cdn.jsdelivr.net/gh/chzager/cli/themes/";
		switch (args?.[0])
		{
			case undefined:
			case "--?":
				cli.writeLn("Usage: theme <theme>")
					.writeLn("Take a look at Command Line Interpreter in these predefined themes:")
					.writeLn(THEMES.map((s) => "\t\t" + s).join("\n"));
				break;
			default:
				if (THEMES.includes(args[0]))
				{
					for (let styleElement of document.head.querySelectorAll(`link[rel="stylesheet"][href^="${THEME_URL_ROOT}"]`))
					{
						styleElement.remove();
					}
					document.head.append(CommandLineInterpreter.createElement(`link[rel="stylesheet"][href="${THEME_URL_ROOT}${args[0]}.css"]`));
					setTimeout(() =>
					{
						cli.body.scrollTop = cli.body.scrollHeight;
					}, 250);
				}
				else
				{
					cli.writeLn(`theme: Invalid argument: ${args[0]}`);
				}
		}
	}
};

/**
 * Initialization options for the CLI.
 * @type {CommandLineInterpreterInitOptions}
 */
const opts = {
	motd: "Welcome to _Command Line Interpreter!_\n" +
		"https://github.com/chzager/cli\n" +
		"Type `help` for a list of available commands.",
	theme: /\btheme=(\w+)/.exec(window.location.search)?.[1]
};

// Create a new instance of CommandLineInterpreter
// and append it on the document body.
var cli = new CommandLineInterpreter(cmds, null, opts);
