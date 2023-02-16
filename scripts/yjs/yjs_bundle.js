// @ts-ignore
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CodemirrorBinding } from 'y-codemirror'



export function connect(editor, cryptor) {
  const host = window.location.hostname
  const ydoc = new Y.Doc()
  const isLocalhost = (host === "localhost")
  const protocol = isLocalhost ? "ws" : "wss"
  const path = isLocalhost ? ":1234" : "/y-websocket"
  const provider = new WebsocketProvider(
    protocol + "://" + host + path,
    cryptor.chanId, // roomname
    ydoc,
    { cryptor }
  )
  const ytext = ydoc.getText('codemirror')
  const binding = new CodemirrorBinding(ytext, editor, provider.awareness)

  return {ydoc, provider, binding}
}
