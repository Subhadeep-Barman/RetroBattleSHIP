# BattleBoard — Next.js Client

This directory contains the **Next.js** frontend for the BattleBoard project. The client renders the game board, handles user interactions and communicates with the server via Socket.io.

---

## Quick start

### Install

```bash
cd client
npm install
```

### Run (dev)

```bash
npm run dev
```

This runs the Next.js dev server on `http://localhost:3000`.

### Build & Start (production)

```bash
npm run build
npm run start
```

---

## Configuration & Socket connection

- The client connects to the socket server at `http://<host>:8900` by default (see `client/lib/socket.js`).
- If your server runs on a different address or port, update `client/lib/socket.js` or run the client from a host that can reach your server.

---

## Scripts

- `npm run dev` — start development server
- `npm run build` — build production assets
- `npm run start` — start Next.js in production mode

---

## Notes

- Make sure the Node server (`node server.js`) is running and reachable before starting the client so socket connections can succeed.
- Browser console logs include helpful socket connection messages printed from `client/lib/socket.js`.

---

If you want, I can also add environment-variable support for the socket URL or a `README` badge and quick demo screenshots.