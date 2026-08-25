import http from 'http'
import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { ObjectId } from 'mongodb'
import { WebSocketServer } from 'ws'
import { setupWSConnection } from './setup-connection.js'
import { initPersistence, docsCollection, usersCollection, deleteDocData } from './persistence.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

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

  // Đăng ký: tạo tài khoản mới với mật khẩu đã hash
  app.post('/auth/register', async (req, res) => {
    const username = (req.body?.username || '').trim()
    const password = req.body?.password || ''
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' })
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'password too short (min 4)' })
    }
    try {
      const passwordHash = await bcrypt.hash(password, 10)
      const result = await usersCollection().insertOne({
        username,
        passwordHash,
        createdAt: new Date(),
      })
      const token = jwt.sign(
        { sub: result.insertedId.toString(), name: username },
        JWT_SECRET,
        { expiresIn: '7d' },
      )
      res.json({ token, username })
    } catch (err) {
      if (err.code === 11000) {
        // vi phạm unique index -> username đã tồn tại
        return res.status(409).json({ error: 'username already exists' })
      }
      throw err
    }
  })

  // Đăng nhập: tra user, so mật khẩu hash, đúng thì cấp JWT
  app.post('/auth/login', async (req, res) => {
    const username = (req.body?.username || '').trim()
    const password = req.body?.password || ''
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' })
    }
    const user = await usersCollection().findOne({ username })
    if (!user) return res.status(401).json({ error: 'invalid credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'invalid credentials' })
    const token = jwt.sign(
      { sub: user._id.toString(), name: username },
      JWT_SECRET,
      { expiresIn: '7d' },
    )
    res.json({ token, username })
  })

  // Middleware: chặn REST nếu không có token hợp lệ
  function auth(req, res, next) {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    try {
      req.user = jwt.verify(token, JWT_SECRET)
      next()
    } catch {
      res.status(401).json({ error: 'unauthorized' })
    }
  }

   // Danh sách document (mới nhất trước)
  app.get('/docs', auth, async (_req, res) => {
    const list = await docsCollection().find().sort({ createdAt: -1 }).toArray()
    res.json(list.map((d) => ({ id: d._id.toString(), title: d.title })))
  })

  // Tạo document mới
  app.post('/docs', auth, async (req, res) => {
    const title = (req.body?.title || 'Untitled').toString()
    const result = await docsCollection().insertOne({ title, createdAt: new Date() })
    res.json({ id: result.insertedId.toString(), title })
  })

  // Xóa document
  app.delete('/docs/:id', auth, async (req, res) => {
    const id = req.params.id
    await docsCollection().deleteOne({ _id: new ObjectId(id) })
    await deleteDocData(id) // xóa luôn nội dung binary trong doc_updates
    res.json({ ok: true })
  })

  const server = http.createServer(app)

  // WebSocket dùng chung HTTP server; tự bắt 'upgrade' để sau này chèn auth (Phần 9)
  const wss = new WebSocketServer({ noServer: true })
  server.on('upgrade', (req, socket, head) => {
    try {
      // Token được client đính vào query string: ws://host/<room>?token=...
      const url = new URL(req.url, 'http://localhost')
      const token = url.searchParams.get('token')
      const user = jwt.verify(token, JWT_SECRET) // sai/thiếu -> ném lỗi
      wss.handleUpgrade(req, socket, head, (ws) => {
        ws.user = user // đính user vào kết nối để dùng sau (phân quyền, tên...)
        wss.emit('connection', ws, req)
      })
    } catch {
      // Từ chối TRƯỚC khi WebSocket được thiết lập
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
    }
  })
  wss.on('connection', (ws, req) => setupWSConnection(ws, req))

  server.listen(1234, () => console.log('Server on http://localhost:1234'))
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})