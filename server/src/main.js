import http from 'http'
import express from 'express'
import { ObjectId } from 'mongodb'
import { WebSocketServer } from 'ws'
import { setupWSConnection } from './setup-connection.js'
import { initPersistence, docsCollection } from './persistence.js'

async function main() {
  await initPersistence() // kết nối Mongo TRƯỚC khi nhận client

  const app = express()
  app.use(express.json())

  // CORS đơn giản cho môi trường dev (client 5173 gọi sang server 1234)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
    if (req.method === 'OPTIONS') return res.sendStatus(200)
    next()
  })

  // Route kiểm tra server sống
  app.get('/health', (_req, res) => res.send('ok'))

   // Danh sách document (mới nhất trước)
  app.get('/docs', async (_req, res) => {
    const list = await docsCollection().find().sort({ createdAt: -1 }).toArray()
    res.json(list.map((d) => ({ id: d._id.toString(), title: d.title })))
  })

  // Tạo document mới
  app.post('/docs', async (req, res) => {
    const title = (req.body?.title || 'Untitled').toString()
    const result = await docsCollection().insertOne({ title, createdAt: new Date() })
    res.json({ id: result.insertedId.toString(), title })
  })

  // Xóa document
  app.delete('/docs/:id', async (req, res) => {
    await docsCollection().deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ ok: true })
  })

  const server = http.createServer(app)

  // WebSocket dùng chung HTTP server; tự bắt 'upgrade' để sau này chèn auth (Phần 9)
  const wss = new WebSocketServer({ noServer: true })
  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
  })
  wss.on('connection', (ws, req) => setupWSConnection(ws, req))

  server.listen(1234, () => console.log('Server on http://localhost:1234'))
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})