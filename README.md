# BattleBoard

**BattleBoard** is a realtime, multiplayer Battleship-style game for two players. Players place ships on a grid, take turns firing shots to sink the opponent’s fleet, and can chat during the match. The project includes a Node.js server (game logic + socket server) and a Next.js React client for the browser UI.


## 🚀 Features

- Real-time multiplayer gameplay using **Socket.io**
- Lobby and rooms to create/join matches
- Turn-based combat with server-side game rules and validation
- In-game text chat between players
- Simple, component-based React UI (Next.js)
- Deterministic and testable server-side game logic (in `app/`)

---

## 🧰 Tech stack

- Server: Node.js, Express, Socket.io
- Client: Next.js (React), Socket.io-client
- Game logic: `app/game.js`, `app/gameStatus.js`, `app/player.js`, `app/ship.js`

---

## 🔧 Getting started

### Prerequisites

- Node.js (16+ recommended)
- npm or yarn

### Install

1. Install server dependencies (from project root):

   ```bash
   npm install
   ```

2. Install client dependencies:

   ```bash
   cd client
   npm install
   ```

### Run (development)

1. Start the server (runs on port **8900** by default):

   ```bash
   node server.js
   ```

2. Start the client dev server:

   ```bash
   cd client
   npm run dev
   ```

Open the client at `http://localhost:3000` and ensure the server is running on port `8900`.

### Build & run (production)

1. Build the client:

   ```bash
   cd client
   npm run build
   ```

2. Start the client in production mode (optional):

   ```bash
   npm run start
   ```

3. Start the server as above. The client connects to the socket server at `http://<host>:8900` by default.

> Tip: If your server runs on a different host/port, change the socket URL in `client/lib/socket.js`.

---

## 📁 Project structure

- `server.js` — server entry (serves static files and runs Socket.io)
- `app/` — game logic and domain models (`game.js`, `player.js`, `ship.js`, …)
- `client/` — Next.js client app (pages, components, styles)
- `public/`, `css/`, `js/` — static files

---

## 🛠 Development notes

- Default server port: **8900** (see `server.js`)
- Client socket connects to `http://<window.location.hostname>:8900` by default (see `client/lib/socket.js`)
- There are no automated tests included; contributions that add tests are welcome.

---

## 🤝 Contributing

1. Fork and create a feature branch.
2. Make your changes and add tests where appropriate.
3. Open a pull request with a clear description.

---

## ❓ Troubleshooting

- If the client can’t connect to the socket server, ensure `server.js` is running and reachable on port **8900**.
- Check both server and browser console logs for connection errors.

---

## 📄 License

See the `LICENSE` file in the repository.

---

If you'd like, I can also add a short demo GIF or update `package.json` scripts to make local development even easier. Let me know what you prefer!