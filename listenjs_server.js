'use strict'
const Server = require('./server')

let server = null

const setup = function (options) {
	if (server){
		server.close()
	}
	server = new Server(options)
}

const notify = function (path, payload){
	if (!server) {
		throw new Error("Server not initialized. Please run setup before notifying clients.")
	}
	server.notify(path, payload)
}

module.exports = {
	setup: setup,
	notify: notify
}