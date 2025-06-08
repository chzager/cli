/**
 * @typedef CommandLineInterpreterInitOptions
 * Initialization options for the `CommandLineInterpreter`.
 * @property {string} [id] If your web page uses more than one CLI, you may specify unique IDs here.
 * @property {string} [motd] "Message of the day". This text is printed when the CLI is initialized.
 * @property {string} [prompt] String to be used as the prompt. Default is `"\nCLI> "` which includes
 *  a new line before the prompt.
 * @property {boolean} [richtextEnabled] Enable or disable formatting the text on the CLI. Default is `true`.
 * @property {string} [startup] Commands or variable assignments to be executed at startup (after the
 *  MOTD is printed but before the first input prompt). Multiple commands/assignments are separated
 *  by semi-colon (`;`) or line break (`\n`).
 * @property {number} [tabWidth] Minimum whitespaces between tab-separated (`\t`) values in output. Default is `2`.
 * @property {"default"|"light"|"white"|"black"|"ubuntu"|"custom"} [theme] The theme applied to the CLI instance. To use a custom
 *  theme, select "custom". Please note that you must manually add your custom theme's CSS file to the document.
 *
 * @callback CommandLineInterpreterCommandCallback
 * Callback type for functions ("commands") of the `CommandLineInterpreter`.
 * @param {CommandLineInterpreter} cli The calling `CommandLineInterpreter`.
 * @param {...string} args Arguments given by the user in the command line.
 * @returns {any|Promise<any>} Any value or a `Promise` for asynchronous methods.
 *
 */
