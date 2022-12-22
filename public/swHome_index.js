const socket = io();

socket.emit('games:mode_update', {
	mode : 'sw'
});
