'use strict'
let WebSocketServer = require('ws').Server
const UNSUPPORTED_DATA = 1007
const POLICY_VIOLATION = 1008
const CLOSE_UNSUPPORTED = 1003

var run = module.exports.run = function(server) {
  server.on('connection', (socket) => {
    if(socket.upgradeReq.url !== '/cryptpad_webrtc') { return; }
    socket.on('message', (data) => {
      try {
        let msg = JSON.parse(data)
        if (msg.hasOwnProperty('key')) {
          for (let master of server.clients) {
            if (master.key === msg.key) {
              socket.close(POLICY_VIOLATION, 'The key already exists')
              return
            }
          }
          socket.key = msg.key
          socket.joiningClients = []
        } else if (msg.hasOwnProperty('id')) {
          for (let index in socket.joiningClients) {
            if (index == msg.id) {
              socket.joiningClients[index].send(JSON.stringify({data: msg.data}))
              return
            }
          }
          socket.close(POLICY_VIOLATION, 'Unknown id')
        } else if (msg.hasOwnProperty('join')) {
          for (let master of server.clients) {
            if (master.key === msg.join) {
              socket.master = master
              master.joiningClients.push(socket)
              let id = master.joiningClients.length - 1
              master.send(JSON.stringify({id, data: msg.data}))
              return
            }
          }
          socket.close(POLICY_VIOLATION, 'Unknown key')
        } else if (msg.hasOwnProperty('data') && socket.hasOwnProperty('master')) {
          let id = socket.master.joiningClients.indexOf(socket)
          socket.master.send(JSON.stringify({id, data: msg.data}))
        } else {
          socket.close(UNSUPPORTED_DATA, 'Unsupported message format')
        }
      } catch (event) {
        socket.close(CLOSE_UNSUPPORTED, 'Server accepts only JSON')
      }
    })

    socket.on('close', (event) => {
      if (socket.hasOwnProperty('joiningClients')) {
        for (let client of socket.joiningClients) {
          client.close(POLICY_VIOLATION, 'The peer is no longer available')
        }
      }
    });
  })
}