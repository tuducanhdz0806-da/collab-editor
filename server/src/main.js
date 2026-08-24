import http from 'http'
import express from 'express'
import { WebSocketServer } from 'ws'

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

const server = http.createServer(app)

// WebSocket dùng chung HTTP server; tự bắt 'upgrade' để sau này chèn auth (Phần 9)
const wss = new WebSocketServer({ noServer: true })
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
})
wss.on('connection', (ws) => {
  console.log('client connected (chưa xử lý sync — Phần 6)')
  ws.on('close', () => console.log('client disconnected'))
})

server.listen(1234, () => console.log('Server on http://localhost:1234'))