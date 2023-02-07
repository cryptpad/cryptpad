// @ts-ignore
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CodemirrorBinding } from 'y-codemirror'


export function connect(editor, serverName, cryptor) {
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider(
    serverName,
    cryptor.chanId, // roomname
    ydoc,
    { cryptor }
  )
  const ytext = ydoc.getText('codemirror')
  new CodemirrorBinding(ytext, editor, provider.awareness)
  return
}
