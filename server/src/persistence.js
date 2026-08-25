import { MongoClient, Binary } from 'mongodb'
import * as Y from 'yjs'

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)
let updates    // collection lưu các bản update (binary)
let documents  // collection lưu metadata của document

// Gọi 1 lần khi server khởi động
export async function initPersistence() {
  await client.connect()
  const db = client.db('collab_editor')
  updates = db.collection('doc_updates')
  documents = db.collection('documents')
  await updates.createIndex({ docName: 1, clock: 1 })
  console.log('MongoDB connected')
}

// Mongo trả dữ liệu binary dạng BSON Binary -> đổi về Uint8Array cho Yjs
function toBytes(value) {
  if (value instanceof Binary) return new Uint8Array(value.buffer)
  return new Uint8Array(value)
}

// LOAD: đọc mọi update của phòng theo thứ tự, apply để dựng lại Y.Doc
export async function loadDoc(docName, doc) {
  const rows = await updates.find({ docName }).sort({ clock: 1 }).toArray()
  for (const row of rows) Y.applyUpdate(doc, toBytes(row.value))
}

// APPEND: lưu 1 update lẻ mỗi khi document đổi (an toàn khi crash)
export async function storeUpdate(docName, update) {
  const last = await updates.find({ docName }).sort({ clock: -1 }).limit(1).next()
  const clock = last ? last.clock + 1 : 0
  await updates.insertOne({
    docName,
    clock,
    value: new Binary(Buffer.from(update)),
    createdAt: new Date(),
  })
}

// COMPACTION: gộp toàn bộ update thành 1 snapshot, xóa cũ (giữ số lượng gọn)
export async function flushDocument(docName, doc) {
  const snapshot = Buffer.from(Y.encodeStateAsUpdate(doc))
  await updates.deleteMany({ docName })
  await updates.insertOne({
    docName,
    clock: 0,
    value: new Binary(snapshot),
    createdAt: new Date(),
  })
}

// Cho phép main.js dùng collection documents để viết REST API
export function docsCollection() {
  return documents
}