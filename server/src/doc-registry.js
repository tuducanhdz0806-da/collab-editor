import { WSSharedDoc } from './ws-shared-doc.js'
import { loadDoc, storeUpdate, flushDocument } from './persistence.js'

// name (id phòng) -> Promise<WSSharedDoc>. Lưu Promise thay vì doc trực tiếp
// để tránh race condition khi 2 người vào cùng lúc (giải thích bên dưới).
const docs = new Map()

export function getYDoc(name) {
  let docPromise = docs.get(name)
  if (!docPromise) {
    docPromise = createDoc(name)
    docs.set(name, docPromise)
  }
  return docPromise // LƯU Ý: giờ trả về Promise -> nơi gọi phải await
}

async function createDoc(name) {
  const doc = new WSSharedDoc(name)

  // (1) Nạp nội dung cũ TRƯỚC khi đăng ký listener lưu
  await loadDoc(name, doc)

  // (2) Mỗi khi document đổi: append update + hẹn giờ nén
  let timer = null
  doc.on('update', (update) => {
    storeUpdate(name, update).catch(console.error)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => flushDocument(name, doc).catch(console.error), 10000)
  })

  return doc
}

export async function closeYDocIfEmpty(name, doc) {
  if (doc.conns.size === 0) {
    await flushDocument(name, doc) // nén chắc lần cuối trước khi rời RAM
    doc.destroy()
    docs.delete(name)
  }
}