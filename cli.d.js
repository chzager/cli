/**
 * @typedef CommandLineInterpreter_InitOptions
 * Initialization options for the `CommandLineInterpreter`.
 * @property {string} [id] If your web page uses more than one CLI, you may specify unique IDs here.
 * @property {string} [motd] "Message of the day". This text is printed when the CLI is initialized.
 * @property {string} [prompt] String to be used as the prompt. Default is `"\nCLI>"` which includes a new line before the prompt.
 *
 * @typedef CommandLineInterpreter_Options
 * Options of the current `CommandLineInterpreter` instance.
 * @property {string} prompt String to be used as the prompt. Default is `"\nCLI>"` which includes a new line before the prompt.
 *
 * @callback CommandLineInterpreter_CommandCallback
 * Callback type for functions ("commands") of the `CommandLineInterpreter`.
 * @param {CommandLineInterpreter} cli The `CommandLineInterpreter` that is calling this.
 * @param {...string} args Arguments given by the user in the command line.
 * @returns {void|Promise<void>}
 *
 */
