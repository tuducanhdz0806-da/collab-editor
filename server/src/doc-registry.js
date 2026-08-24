import { WSSharedDoc } from './ws-shared-doc.js'

// name (id phòng) -> phòng đang mở trên RAM
const docs = new Map()

export function getYDoc(name) {
  let doc = docs.get(name)
  if (!doc) {
    doc = new WSSharedDoc(name)
    docs.set(name, doc)
    // Phần 7 sẽ nạp nội dung cũ từ MongoDB tại đây
  }
  return doc
}

export function closeYDocIfEmpty(name, doc) {
  if (doc.conns.size === 0) {
    doc.destroy()
    docs.delete(name)
    // Phần 7 sẽ lưu nội dung xuống MongoDB trước khi xóa khỏi RAM
  }
}