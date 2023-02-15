// @ts-ignore
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CodemirrorBinding } from 'y-codemirror'
import * as ApiConfig from '../../config/config.js'



export function connect(editor, cryptor) {
  const host = new URL(ApiConfig.httpUnsafeOrigin).hostname
  console.log("🌐" +  host)
  const ydoc = new Y.Doc()
  const protocol = host === "localhost" ? "ws" : "wss"
  const provider = new WebsocketProvider(
    protocol + "://" + host + "/y-websocket",
    cryptor.chanId, // roomname
    ydoc,
    { cryptor }
  )
  const ytext = ydoc.getText('codemirror')
  const binding = new CodemirrorBinding(ytext, editor, provider.awareness)

  return {ydoc, provider, binding}
}
