# Ghi chú Proof-of-Concept — Collaborative Editing

## Đồng bộ 2 tab
- Độ trễ khi gõ tab này hiện ở tab kia: [gần như tức thì / có giật? mô tả]
- Con trỏ + tên người khác: [hiện đúng không? có lệch vị trí không?]

## Test offline → online
- Gõ khi offline rồi bật lại mạng: [mất chữ không? kết quả merge trông thế nào?]
- Khi hai tab gõ cùng vị trí lúc lệch nhau, sau merge thứ tự chữ ra sao:
  [ví dụ: chữ của tab online đứng trước / xen kẽ / ... — ghi đúng cái bạn thấy]

## Hành vi lạ / bug gặp phải
- [ghi mọi thứ kỳ cục: nội dung nhân đôi, con trỏ kẹt lại, badge sai trạng thái...]

## Rút ra
- Vì sao CRDT/Yjs xử lý được tình huống offline mà "khóa document" không làm được:
  [viết 2-3 câu bằng lời của mình]

## Bẫy khi test offline
- Hai tab cùng trình duyệt vẫn đồng bộ tức thì DÙ đã set Offline, vì y-websocket
  dùng BroadcastChannel (kênh nội bộ trình duyệt) + chung IndexedDB — nút Offline
  của DevTools chỉ chặn mạng, không chặn hai kênh này.
- Để test offline thật: dùng cửa sổ thường + cửa sổ ẩn danh (storage tách biệt),
  hoặc hai trình duyệt khác nhau.
- Rút ra: "offline-first" ở đây có 2 tầng — cùng máy thì BroadcastChannel lo,
  khác máy thì cần server + merge khi reconnect.