'use strict'
let io

const setup = function (server) {
	if (io) io.close()
	io = require('socket.io')(server)

	io.use((socket, next) => {
		const path = socket.handshake.query.path
		if (path) {
			return next();
		}
		return next(new Error('No path specified.'));
	})

	io.on('connect', function (socket) {
		const path = socket.handshake.query.path
		console.log(`Someone just connected, listening on path ${path}!`)
		socket.join(path)

		socket.on('disconnect', function () {
			console.log('Someone disconnected!')
		})
	})
}

const notify = function (path, payload){
	io.to(path).emit('update', payload)
}

const notifyDeletion = function (path){
	io.to(path).emit('delete')
}

module.exports = {
	setup: setup,
	notify: notify,
	notifyDeletion: notifyDeletion
}