import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import { getYDoc, closeYDocIfEmpty } from './doc-registry.js'
import { messageSync, messageAwareness } from './ws-shared-doc.js'

export async function setupWSConnection(conn, req) {
  conn.binaryType = 'arraybuffer'

  const room = decodeURIComponent((req.url || '/').slice(1).split('?')[0]) || 'default'
  const doc = await getYDoc(room)
  doc.conns.set(conn, new Set())

  conn.on('message', (message) => messageListener(conn, doc, new Uint8Array(message)))

  conn.on('close', () => {
    doc.closeConn(conn)
    closeYDocIfEmpty(room, doc)
  })

  // --- BẮT TAY ĐỒNG BỘ ---
  // (1) Server chủ động gửi SyncStep1: "tôi đang có tới đâu"
  {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeSyncStep1(encoder, doc)
    doc.send(conn, encoding.toUint8Array(encoder))
  }
  // (2) Gửi trạng thái awareness (con trỏ) hiện có cho người mới vào
  const states = doc.awareness.getStates()
  if (states.size > 0) {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageAwareness)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(states.keys())),
    )
    doc.send(conn, encoding.toUint8Array(encoder))
  }
}

// Đọc message đến, phân loại theo byte đầu, xử lý và phản hồi nếu cần
function messageListener(conn, doc, message) {
  const encoder = encoding.createEncoder()
  const decoder = decoding.createDecoder(message)
  const messageType = decoding.readVarUint(decoder)

  switch (messageType) {
    case messageSync:
      encoding.writeVarUint(encoder, messageSync)
      // readSyncMessage tự đọc và GHI phản hồi (vd SyncStep2) vào encoder
      syncProtocol.readSyncMessage(decoder, encoder, doc, conn)
      // chỉ gửi lại nếu có nội dung (encoder dài hơn 1 byte type ban đầu)
      if (encoding.length(encoder) > 1) {
        doc.send(conn, encoding.toUint8Array(encoder))
      }
      break

    case messageAwareness:
      awarenessProtocol.applyAwarenessUpdate(
        doc.awareness,
        decoding.readVarUint8Array(decoder),
        conn, // origin = kết nối này -> handler awareness biết ai gửi
      )
      break
  }
}