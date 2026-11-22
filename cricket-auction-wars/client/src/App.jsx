
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


