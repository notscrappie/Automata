/**
 * This function will check the options provided to validate the connection.
 * @param {object} options - The options object.
 */
function checkConnectionOptions(options) {
	const { guildId, voiceChannel, textChannel } = options;
	if (!guildId) throw new TypeError('The \'guildId\' parameter was not passed or is undefined.');
	if (!voiceChannel) throw new TypeError('The \'voiceChannel\' parameter was not passed or is undefined.');
	if (!textChannel) throw new TypeError('The \'textChannel\' parameter was not passed or is undefined.');
	if (typeof guildId !== 'string') throw new TypeError('The \'guildId\' parameter is not a string.');
	if (typeof voiceChannel !== 'string') throw new TypeError('The \'voiceChannel\' parameter is not a string.');
	if (typeof textChannel !== 'string') throw new TypeError('The \'textChannel\' parameter is not a string.');
}

module.exports = { checkConnectionOptions };