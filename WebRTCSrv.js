'use strict'
let WebSocketServer = require('ws').Server
const PORT = 8000
const UNSUPPORTED_DATA = 1007
const POLICY_VIOLATION = 1008
const CLOSE_UNSUPPORTED = 1003

var run = module.exports.run = function(storage, server) {
  server.on('connection', (socket) => {
    socket.on('message', (data) => {
      try {
        let msg = JSON.parse(data)
        console.log(msg);
        if (msg.hasOwnProperty('key')) {
          for (let master of server.clients) {
            if (master.key === msg.key) {
              socket.close(POLICY_VIOLATION, 'The key already exists')
              console.log('ERROR key exists');
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
              console.log('joined');
              socket.master = master
              master.joiningClients.push(socket)
              let id = master.joiningClients.length - 1
              console.log(id);
              master.send(JSON.stringify({id, data: msg.data}))
              return
            }
          }
          console.log('ERROR unknown key');
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
      console.log('someone has closed');
      // If not master
      if (socket.hasOwnProperty('master')) {
        let masterClients = socket.master.joiningClients
        for (let client of masterClients) {
          if(client.id === socket.id) {
            console.log('close client '+client.key)
            client.close(POLICY_VIOLATION, 'The peer is no longer available')
            //masterClients.splice(masterClients.indexOf(client),1);
          }
        }
      }
      else if (socket.hasOwnProperty('joiningClients')) {
        let firstClient
        let masterClients = socket.joiningClients
        for (let client of masterClients) {
          firstClient = client
          break;
        }
        firstClient.close(POLICY_VIOLATION, 'The master is no longer available')
        //masterClients.splice(masterClients.indexOf(firstClient),1);
        firstClient.joiningClients = masterClients
        console.log('change master from '+socket.key+' to '+firstClient.key)
        socket = firstClient
      }
    })
  })
}