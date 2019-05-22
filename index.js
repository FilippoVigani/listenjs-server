'use strict'
let io

const setup = function (server) {
	if (io) io.close()
	io = require('socket.io')(server)

	io.on('connect', function (socket) {
		console.log(`Someone just connected!`)
		console.log(socket.handshake)

		socket.on('disconnect', function () {
			console.log('Someone disconnected!')
		})
	})
}

const notify = function (path, payload){
	io.of(path).emit('update', payload)
}

module.exports = {
	setup: setup,
	notify: notify
}