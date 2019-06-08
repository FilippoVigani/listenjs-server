const ClientManager = require('./client_manager')
const WebSocket = require('ws')
const uuid = require('uuid/v1')

class Server{
	constructor(options){
		this.wsServer = new WebSocket.Server(options)

		this.clientManagers = []

		this.wsServer.on('connection', (socket, request) => {
			socket.on('message', eventString => {
				const event = JSON.parse(eventString)
				let clientManager = this.clientManagers.find(cm => cm.clientId === event.clientId)

				if(event.action === Server.Event.HANDSHAKE){
					if (!clientManager){
						clientManager = new ClientManager(uuid())
						this.clientManagers.push(clientManager)
					}

					clientManager.socket = socket
					clientManager.alive = true

					const handshakeAck = {
						action: Server.Event.HANDSHAKE_ACK,
						clientId: clientManager.clientId
					}

					socket.send(JSON.stringify(handshakeAck))
				}

				if (!clientManager){
					console.log("Closing non-handshaken client.")
					socket.close(1000, "No handshake received.")
					return
				}

				if (event.action === Server.Event.SUBSCRIBE){
					const {observerId, path} = event
					clientManager.addObserver(observerId, path)

					const subscribeAck = {
						action: Server.Event.SUBSCRIBE_ACK,
						observerId: observerId,
						path: path
					}

					socket.send(JSON.stringify(subscribeAck))
				}

				if (event.action === Server.Event.UNSUBSCRIBE){
					const {path} = event
					clientManager.removeObservers(path)

					const unsubscribeAck = {
						action: Server.Event.UNSUBSCRIBE_ACK,
						path: path
					}

					socket.send(JSON.stringify(unsubscribeAck))
				}

				if (event.action === Server.Event.HEARTBEAT){
					const {observerId, path} = event
					clientManager.addObserver(observerId, path)

					const unsubscribeAck = {
						action: Server.Event.HEARTBEAT_ACK
					}

					socket.send(JSON.stringify(unsubscribeAck))
				}
			})

			socket.on("close", closed => {
				const clientManager = this.clientManagers.find(cm => cm.socket === socket)
				if (clientManager){
					clientManager.alive = false
				}
			})

			socket.on("error", error => {
				console.log(error)
				const clientManager = this.clientManagers.find(cm => cm.socket === socket)
				if (clientManager){
					clientManager.alive = false
				}
			})
		})
	}

	notify(path, payload){
		const clientManagerToBeNotified = this.clientManagers.filter(
			cm => cm.alive && cm.observers.some(obs => obs.path === path)
		)

		clientManagerToBeNotified.forEach(cm => {
			const update = {
				action: Server.Event.UPDATE,
				path: path,
				body: payload
			}

			cm.socket.send(JSON.stringify(update))
		})

		return clientManagerToBeNotified.length
	}
}

Server.Event = {
	HANDSHAKE: "handshake",
	HANDSHAKE_ACK: "handshake_ack",
	SUBSCRIBE: "subscribe",
	SUBSCRIBE_ACK: "subscribe_ack",
	UNSUBSCRIBE: "unsubscribe",
	UNSUBSCRIBE_ACK: "unsubscribe_ack",
	UPDATE: "update",
	HEARTBEAT: "heartbeat",
	HEARTBEAT_ACK: "heartbeat_ack",
}

module.exports = Server