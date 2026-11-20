
import React, { useEffect, useState } from "react";
import {
  Routes, Route, Navigate, useNavigate, useParams, Link
} from "react-router-dom";
import { io } from "socket.io-client";
import {
  Trophy, Users, Gavel, LogOut, Plus, DoorOpen,
  Wallet, Timer, Activity
} from "lucide-react";
import api from "./api";

function getCategory(player) {
  if (!player) return "";

  const overseas =
    String(player.nationality || "").toLowerCase() !== "india";

  const role = String(player.role || "").toLowerCase();

  let roleName = "Batter";

  if (role.includes("all") || role.includes("round")) {
    roleName = "All-rounder";
  } else if (role.includes("bowl")) {
    roleName = "Bowler";
  }

  return `${overseas ? "Overseas" : "Indian"} ${roleName}`;
}

function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "", email: "", password: ""
  });
  const [error, setError] = useState("");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      localStorage.setItem("caw_token", data.token);
      localStorage.setItem("caw_user", JSON.stringify(data.user));
      onAuth(data.user);
      nav("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not authenticate");
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="brand-mark"><Gavel /></div>
        <p className="eyebrow">BUILD YOUR SQUAD. BEAT YOUR RIVALS.</p>
        <h1>Cricket Auction <span>Wars</span></h1>
        <p className="muted">Your auction. Your strategy. Your championship.</p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <input
              placeholder="Your name"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            minLength="8"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <button className="primary full">
            {mode === "login" ? "Enter the arena" : "Create account"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <button
          className="text-button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already registered? Sign in"}
        </button>
      </div>
    </main>
  );
}

function Shell({ user, onLogout, children }) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-icon"><Gavel size={18} /></span>
          CRICKET <b>AUCTION WARS</b>
        </Link>
        <div className="user-area">
          <span>{user.name}</span>
          <button className="icon-btn" onClick={onLogout} title="Log out">
            <LogOut size={17} />
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

function Dashboard() {
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  async function create() {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/rooms", { teamName });
      nav(`/room/${data.code}`);
    } catch (e) {
      setError(e.response?.data?.message || "Could not create room");
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(`/rooms/${joinCode}/join`, { teamName });
      nav(`/room/${data.code}`);
    } catch (e) {
      setError(e.response?.data?.message || "Could not join room");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="content">
      <section className="hero">
        <div>
          <p className="eyebrow">THE AUCTION ARENA IS OPEN</p>
          <h1>Pick your players.<br /><span>Build a legacy.</span></h1>
          <p className="muted">
            Assemble your dream T20 squad, outbid your rivals
            and prove your auction strategy.
          </p>
        </div>
        <div className="hero-icon"><Trophy size={90} /></div>
      </section>

      <section className="stats">
        <div className="stat">
          <Users />
          <div><b>4 Teams</b><small>Per private room</small></div>
        </div>
        <div className="stat">
          <Wallet />
          <div><b>₹100 Cr</b><small>Starting purse</small></div>
        </div>
        <div className="stat">
          <Timer />
          <div><b>30 Seconds</b><small>Per bid timer</small></div>
        </div>
      </section>

      <div className="action-grid">
        <section className="panel">
          <div className="panel-icon"><Plus /></div>
          <h2>Create an auction room</h2>
          <p className="muted">Host a private auction and invite three rivals.</p>
          <label>Your team name</label>
          <input
            placeholder="e.g. Mumbai Mavericks"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
          />
          <button
            className="primary full"
            disabled={busy || !teamName.trim()}
            onClick={create}
          >
            Create room <Plus size={16} />
          </button>
        </section>

        <section className="panel">
          <div className="panel-icon secondary"><DoorOpen /></div>
          <h2>Join a room</h2>
          <p className="muted">Enter your friends' invite code.</p>
          <label>Room code</label>
          <input
            placeholder="6-character code"
            maxLength="6"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
          />
          <label>Your team name</label>
          <input
            placeholder="e.g. Royal Strikers"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
          />
          <button
            className="outline full"
            disabled={busy || joinCode.length !== 6 || !teamName.trim()}
            onClick={join}
          >
            Join auction <DoorOpen size={16} />
          </button>
        </section>
      </div>

      {error && <p className="error">{error}</p>}
      <p className="footnote">
        Six player categories • Four participants • Real-time bidding
      </p>
    </main>
  );
}

function RoomPage({ user }) {
  const { code } = useParams();
  const nav = useNavigate();

  const [room, setRoom] = useState(null);
  const [bid, setBid] = useState("");
  const [message, setMessage] = useState("");
  const [remaining, setRemaining] = useState(30);
  const [socket, setSocket] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [analysis, setAnalysis] = useState("");

  const me = room?.members?.find(
    m => String(m.user?._id || m.user) === String(user.id)
  );

  const isHost = room && String(room.host) === String(user.id);
  const current = room?.currentPlayer;

  async function load() {
    try {
      const { data } = await api.get(`/rooms/${code}`);
      setRoom(data);
    } catch (e) {
      setMessage(e.response?.data?.message || "Could not load room");
    }
  }

  useEffect(() => {
    load();

    const s = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        auth: { token: localStorage.getItem("caw_token") }
      }
    );

    s.emit("room:join", { code });
    s.on("auction:state", setRoom);
    s.on("auction:error", setMessage);
    setSocket(s);

    return () => s.disconnect();
  }, [code]);

  useEffect(() => {
    if (!room?.endsAt || room.status !== "live") {
      setRemaining(0);
      return;
    }

    const tick = () => {
      setRemaining(Math.max(
        0,
        Math.ceil((new Date(room.endsAt).getTime() - Date.now()) / 1000)
      ));
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [room?.endsAt, room?.status, room?.phase]);

  async function start() {
    try {
      await api.post(`/rooms/${code}/start`);
      setMessage("");
    } catch (e) {
      setMessage(e.response?.data?.message || "Could not start");
    }
  }

  function placeBid() {
    if (!socket) return;

    socket.emit("auction:bid", {
      code,
      amount: Number(bid)
    }, ack => {
      setMessage(ack.ok ? "Bid placed!" : ack.message);
      if (ack.ok) setBid("");
    });
  }

  async function results() {
    try {
      const { data } = await api.get(`/ai-analysis/${code}`);
      setRankings(data.rankings);
      setAnalysis(data.explanation);
    } catch (e) {
      setMessage(e.response?.data?.message || "Results unavailable");
    }
  }

  const soldCount = room?.soldPlayers?.length || 0;
  const unsoldCount = room?.unsoldPlayers?.length || 0;
  const category = getCategory(current);

  return (
    <main className="content room-content">
      <button className="back" onClick={() => nav("/")}>← Dashboard</button>

      <section className="room-heading">
        <div>
          <p className="eyebrow">PRIVATE AUCTION ROOM</p>
          <h1>Room <span>{code}</span></h1>
          <p className="muted">Invite three other participants.</p>
        </div>
        <div className={`status ${room?.status || ""}`}>
          {room?.status || "Loading"}
        </div>
      </section>

      <section className="panel lobby">
        <div className="panel-head">
          <h2><Users size={19} /> The four franchises</h2>
          <span>{room?.members?.length || 0}/4 joined</span>
        </div>

        <div className="member-grid">
          {[0, 1, 2, 3].map(i => {
            const m = room?.members?.[i];
            return (
              <div className="member" key={i}>
                <div className="avatar">
                  {m ? (m.teamName || "T").slice(0, 1).toUpperCase() : "+"}
                </div>
                <b>{m?.teamName || "Waiting for player"}</b>
                <small>{m?.user?.name || (m ? "Participant" : "Invite a rival")}</small>
                {m && <small>₹{Number(m.budget).toFixed(2)} Cr left</small>}
              </div>
            );
          })}
        </div>

        {isHost && room?.status === "waiting" && (
          <button
            className="primary"
            disabled={room.members.length !== 4}
            onClick={start}
          >
            Start auction <Gavel size={16} />
          </button>
        )}
      </section>

      {room?.status === "live" && (
        <section className="auction-layout">
          <div className="panel player-panel">

            {room.phase === "result" && (
              <div className="auction-transition">
                <p className="eyebrow">AUCTION RESULT</p>

                <h1 className={
                  room.lastResult === "SOLD"
                    ? "sold-announcement"
                    : "unsold-announcement"
                }>
                  {room.lastResult}
                </h1>

                <h2>{current?.name}</h2>

                {room.lastResult === "SOLD" ? (
                  <>
                    <p className="eyebrow">SOLD TO</p>
                    <h2>{room.lastWinnerTeamName || "Winning team"}</h2>
                    <h2>₹{Number(room.lastSoldPrice).toFixed(2)} Cr</h2>
                  </>
                ) : (
                  <h2>NO TEAM BOUGHT THIS PLAYER</h2>
                )}

                <p className="muted">{getCategory(current)}</p>
                <div className="timer">
                  <Timer /><strong>{remaining}s</strong>
                  <small>Next transition</small>
                </div>
              </div>
            )}

            {room.phase === "next_player" && (
              <div className="auction-transition">
                <p className="eyebrow">AUCTION CONTINUES</p>
                <div className="player-placeholder"><Activity size={52} /></div>
                <h1>NEXT PLAYER</h1>
                <h2>COMING UP</h2>
                <p className="muted">
                  Unsold players return after the first auction round.
                </p>
                <div className="timer">
                  <Timer /><strong>{remaining}s</strong>
                  <small>Until next player</small>
                </div>
              </div>
            )}

            {room.phase === "bidding" && current && (
              <>
                <p className="eyebrow">NOW ON THE BLOCK</p>
                <div className="player-placeholder"><Activity size={52} /></div>

                <div className="player-category">
                  {category}
                </div>

                <h2>{current.name}</h2>
                <p className="muted">
                  {current.role} · {current.nationality}
                  {current.isOverseas ? " · Overseas" : ""}
                </p>

                <div className="player-stats">
                  <span>BAT <b>{current.batting}</b></span>
                  <span>BOWL <b>{current.bowling}</b></span>
                  <span>FIELD <b>{current.fielding}</b></span>
                </div>

                <div className="timer">
                  <Timer /><strong>{remaining}s</strong>
                  <small>remaining</small>
                </div>

                <div className="bid-box">
                  <div>
                    <small>CURRENT BID</small>
                    <h2>₹{Number(room.currentBid).toFixed(2)} Cr</h2>
                    <small>
                      {room.highestBidder ? "Highest bid active" : "Base price"}
                    </small>
                  </div>

                  <div className="bid-controls">
                    <input
                      type="number"
                      min={room.currentBid + 0.5}
                      step="0.5"
                      placeholder={`Min ₹${(room.currentBid + 0.5).toFixed(2)}`}
                      value={bid}
                      onChange={e => setBid(e.target.value)}
                    />
                    <button
                      className="primary"
                      onClick={placeBid}
                      disabled={!bid || Number(bid) <= room.currentBid || remaining <= 0}
                    >
                      Bid
                    </button>
                  </div>
                </div>
              </>
            )}

            {room.phase !== "result" &&
              room.phase !== "next_player" &&
              room.phase !== "bidding" && (
                <p>Waiting for auction state…</p>
              )}
          </div>

          <aside className="panel">
            <h2>Live squad budgets</h2>
            {room.members.map(m => (
              <div className="budget-row" key={m.teamName}>
                <span>{m.teamName}</span>
                <b>₹{Number(m.budget).toFixed(2)} Cr</b>
              </div>
            ))}

            <h3>Sold players <span>{soldCount}</span></h3>
            {(room.soldPlayers || []).slice(-5).reverse().map((s, i) => {
              const team = room.members.find(
                m => String(m.user?._id || m.user) === String(s.teamUser)
              );
              return (
                <div className="sold-row" key={i}>
                  <span>{s.player?.name} · {team?.teamName || "Team"}</span>
                  <b>₹{s.price} Cr</b>
                </div>
              );
            })}

            <h3>Unsold players <span>{unsoldCount}</span></h3>
            {(room.unsoldPlayers || []).slice(-5).reverse().map((p, i) => (
              <div className="sold-row" key={i}>
                <span>{p.name}</span>
                <b>UNSOLD</b>
              </div>
            ))}
          </aside>
        </section>
      )}

      {room?.status === "waiting" && (
        <section className="panel waiting">
          <Gavel size={36} />
          <h2>Gather your rivals</h2>
          <p className="muted">
            The host can start once all four participants have joined.
          </p>
        </section>
      )}

      {room?.status === "completed" && (
        <section className="panel">
          <div className="panel-head">
            <h2><Trophy /> Auction complete</h2>
            <button className="primary" onClick={results}>
              Evaluate squads
            </button>
          </div>

          <p>
            Sold: {soldCount} · Unsold after final round: {unsoldCount}
          </p>

          {rankings?.map(r => (
            <div className="rank-row" key={r.userId}>
              <b>#{r.rank} {r.teamName}</b>
              <span>{r.score}/100</span>
              <small>
                {r.players} players · ₹{r.remainingBudget} Cr left
              </small>
            </div>
          ))}

          {analysis && (
            <div className="analysis">
              <h3>Squad analysis</h3>
              <p>{analysis}</p>
            </div>
          )}
        </section>
      )}

      {room && (
        <section className="panel squad-panel">
          <h2>Your squad · {me?.squad?.length || 0} players</h2>
          <div className="squad-list">
            {(me?.squad || []).map(p => (
              <span key={p._id}>
                {p.name} <small>{p.role}</small>
              </span>
            ))}
          </div>
        </section>
      )}

      {message && <p className="notice">{message}</p>}
      <p className="footnote">
        Real-time auction state synchronized through Socket.IO.
      </p>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("caw_user"));
    } catch {
      return null;
    }
  });

  function logout() {
    localStorage.removeItem("caw_token");
    localStorage.removeItem("caw_user");
    setUser(null);
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/" /> : <Auth onAuth={setUser} />}
      />
      <Route
        path="*"
        element={
          !user ? (
            <Navigate to="/auth" />
          ) : (
            <Shell user={user} onLogout={logout}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/room/:code" element={<RoomPage user={user} />} />
              </Routes>
            </Shell>
          )
        }
      />
    </Routes>
  );
}


