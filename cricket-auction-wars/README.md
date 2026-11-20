# Cricket Auction Wars

A MERN + Socket.IO IPL-style auction simulator starter project.

## Features
- JWT registration and login
- Create/join private auction rooms with room codes
- Four team slots per room
- Live bidding over Socket.IO
- Server-side bid validation and auction timer
- Sold / unsold player settlement and budget tracking
- Squad view and deterministic team evaluation
- Optional AI explanation endpoint (OpenAI-compatible API)

## Requirements
- Node.js 18+
- MongoDB Atlas or local MongoDB

## Setup

### 1. Server
```bash
cd server
npm install
cp .env.example .env
```
On Windows PowerShell:
```powershell
Copy-Item .env.example .env
```
Edit `.env` and set `MONGO_URI` and a long random `JWT_SECRET`.

Import sample players:
```bash
npm run seed
```
Start the API:
```bash
npm run dev
```
Server runs at `http://localhost:5000`.

### 2. Client
Open another terminal:
```bash
cd client
npm install
cp .env.example .env
```
On Windows PowerShell:
```powershell
Copy-Item .env.example .env
```
Start:
```bash
npm run dev
```
Open `http://localhost:5173`.

## Multiplayer test
Use four separate browser profiles/devices. Register four accounts. One user creates a room and shares the six-character code. Other users join. The host starts the auction. All connected room members see bids and sales live.

## Important MVP notes
- Room capacity is four human teams.
- Budget is ₹100 crore per team.
- Prices and bids are stored in crore units (e.g. `2.5` means ₹2.5 crore).
- Auction timer is 15 seconds and resets after each valid bid.
- The host is also one of the four participants.
- This is a portfolio MVP, not a production-hardened wagering or financial product.
- Add rate limiting, stronger validation, audit logs, reconnect recovery, automated tests and deployment secrets before public production use.
- Only use player data and images you have permission to use. The seed list is fictional/sample data to avoid implying official IPL affiliation.

## AI analysis (optional)
Set `OPENAI_API_KEY` and `OPENAI_MODEL` in server `.env` to enable AI-written explanations. The score itself is calculated deterministically by the backend; AI does not decide the winner.
