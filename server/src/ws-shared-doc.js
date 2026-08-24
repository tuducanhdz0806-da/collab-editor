import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as encoding from 'lib0/encoding'
import { WebSocket } from 'ws'

// Mỗi message binary bắt đầu bằng 1 byte cho biết nó thuộc loại nào
export const messageSync = 0       // đồng bộ nội dung document
export const messageAwareness = 1  // con trỏ / tên / màu (tạm thời, không lưu)

export class WSSharedDoc extends Y.Doc {
  constructor(name) {
    super({ gc: true })
    this.name = name
    this.conns = new Map()   // WebSocket -> Set(clientID) mà kết nối đó đang giữ awareness
    this.awareness = new awarenessProtocol.Awareness(this)
    this.awareness.setLocalState(null)

    // (A) Khi awareness đổi (ai đó di con trỏ, join, rời) -> phát cho mọi kết nối
    this.awareness.on('update', ({ added, updated, removed }, origin) => {
      const changed = added.concat(updated, removed)
      // ghi nhớ kết nối nào đang giữ clientID nào (để dọn khi nó rời)
      if (origin != null && this.conns.has(origin)) {
        const ids = this.conns.get(origin)
        added.forEach((id) => ids.add(id))
        removed.forEach((id) => ids.delete(id))
      }
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageAwareness)
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed),
      )
      const buf = encoding.toUint8Array(encoder)
      this.conns.forEach((_, conn) => this.send(conn, buf))
    })

    // (B) Khi nội dung document đổi -> đóng gói update và phát cho mọi kết nối
    this.on('update', (update) => {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageSync)
      syncProtocol.writeUpdate(encoder, update)
      const buf = encoding.toUint8Array(encoder)
      this.conns.forEach((_, conn) => this.send(conn, buf))
    })
  }

  // Gửi buffer cho 1 kết nối; nếu kết nối hỏng thì dọn luôn
  send(conn, buf) {
    if (conn.readyState !== WebSocket.OPEN) return this.closeConn(conn)
    try {
      conn.send(buf, (err) => { if (err) this.closeConn(conn) })
    } catch {
      this.closeConn(conn)
    }
  }

  // Dọn khi 1 kết nối rời: xóa khỏi danh sách + gỡ con trỏ "ma" của nó
  closeConn(conn) {
    const ids = this.conns.get(conn)
    if (ids) {
      this.conns.delete(conn)
      awarenessProtocol.removeAwarenessStates(this.awareness, Array.from(ids), null)
    }
    if (conn.readyState !== WebSocket.CLOSED) {
      try { conn.close() } catch {}
    }
  }
}