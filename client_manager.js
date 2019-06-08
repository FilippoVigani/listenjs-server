const Observer = require('./observer')

class ClientManager {
	constructor(clientId) {
		this.clientId = clientId
		this.observers = []
		this.alive = false
		this.lastMessageTime = null
		this.socket = null
	}

	addObserver(observerId, path){
		this.observers.push(new Observer(observerId, path))
	}

	removeObservers(path){
		this.observers = this.observers.filter(obs => obs.path !== path)
	}
}

module.exports = ClientManager