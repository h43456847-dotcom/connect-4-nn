/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import pg from "pg";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        elo INTEGER DEFAULT 1500,
        avatar_id INTEGER DEFAULT 0,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        p1_id INTEGER REFERENCES users(id),
        p2_id INTEGER REFERENCES users(id),
        p1_elo INTEGER,
        p2_elo INTEGER,
        winner_id INTEGER REFERENCES users(id),
        is_bot_match BOOLEAN DEFAULT FALSE,
        bot_depth INTEGER,
        pairing_id INTEGER,
        winner VARCHAR(10),
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS moves (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        move_number INTEGER,
        board_state JSONB,
        move_made INTEGER,
        final_result INTEGER
      );

      CREATE TABLE IF NOT EXISTS nnue_weights (
        id SERIAL PRIMARY KEY,
        layer_name VARCHAR(50),
        weights JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Ensure pairing_id, category, and avatar_id columns exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='pairing_id') THEN
          ALTER TABLE matches ADD COLUMN pairing_id INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='category') THEN
          ALTER TABLE matches ADD COLUMN category VARCHAR(50) DEFAULT 'general';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_id') THEN
          ALTER TABLE users ADD COLUMN avatar_id INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_active') THEN
          ALTER TABLE users ADD COLUMN last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;

      -- FIX: Ensure matches table has p1_id, p2_id, and winner_id
      DO $$
      BEGIN
        -- Handle p1_id/p2_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='p1_id') THEN
           IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='player1_id') THEN
             ALTER TABLE matches RENAME COLUMN player1_id TO p1_id;
             ALTER TABLE matches RENAME COLUMN player2_id TO p2_id;
           ELSE
             ALTER TABLE matches ADD COLUMN p1_id INTEGER;
             ALTER TABLE matches ADD COLUMN p2_id INTEGER;
           END IF;
        END IF;

        -- Handle winner_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='winner_id') THEN
           IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='winnerId') THEN
             ALTER TABLE matches RENAME COLUMN "winnerId" TO winner_id;
           ELSE
             ALTER TABLE matches ADD COLUMN winner_id INTEGER;
           END IF;
        END IF;

        -- Handle moves column (missing from your error report)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='moves') THEN
           ALTER TABLE matches ADD COLUMN moves JSONB DEFAULT '[]'::jsonb;
        END IF;
      END $$;

      -- Taunts Table (The "Deviated Sheet")
      CREATE TABLE IF NOT EXISTS taunts (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER,
        emoji VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Initialize default admin if not exists
    const adminCheck = await pool.query("SELECT * FROM users WHERE username = 'mathias_cheow'");
    if (adminCheck.rows.length === 0) {
      await pool.query("INSERT INTO users (username, password, elo) VALUES ('mathias_cheow', 'h43456847', 2500)");
    }

    // Initialize default weights if none exist
    const weightCheck = await pool.query("SELECT COUNT(*) FROM nnue_weights");
    if (weightCheck.rows[0].count === '0') {
      const defaultWeights = {
        brain: {
          levels: [
            {
              inputs: new Array(84).fill(0),
              outputs: new Array(16).fill(0),
              biases: new Array(16).fill(0).map(() => Math.random() * 0.2 - 0.1),
              weights: new Array(84).fill(0).map(() => new Array(16).fill(0).map(() => Math.random() * 0.2 - 0.1))
            },
            {
              inputs: new Array(16).fill(0),
              outputs: new Array(1).fill(0),
              biases: [0.0],
              weights: new Array(16).fill(0).map(() => [Math.random() * 0.2 - 0.1])
            }
          ]
        }
      };
      await pool.query("INSERT INTO nnue_weights (layer_name, weights) VALUES ('kaggle', $1), ('user', $1), ('both', $1)", [JSON.stringify(defaultWeights)]);
    }

    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  await initDb();

  // Connect 4 Core Logic (Duplicated for server-side authority)
  const ROWS = 6;
  const COLS = 7;
  function createEmptyBoard() {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  }
  function isValidMove(board: any[][], col: number) {
    return board[0][col] === null;
  }
  function dropPiece(board: any[][], col: number, player: 1 | 2) {
    const newBoard = board.map(row => [...row]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][col] === null) {
        newBoard[r][col] = player;
        return newBoard;
      }
    }
    return newBoard;
  }
  function checkWinner(board: any[][]) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (board[r][c] && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2] && board[r][c] === board[r][c+3]) return board[r][c];
      }
    }
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c] && board[r][c] === board[r+3][c]) return board[r][c];
      }
    }
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (board[r][c] && board[r][c] === board[r+1][c+1] && board[r][c] === board[r+2][c+2] && board[r][c] === board[r+3][c+3]) return board[r][c];
      }
    }
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (board[r][c] && board[r][c] === board[r-1][c+1] && board[r][c] === board[r-2][c+2] && board[r][c] === board[r-3][c+3]) return board[r][c];
      }
    }
    const isDraw = board[0].every((cell: any) => cell !== null);
    if (isDraw) return 'draw';
    return null;
  }

  // Matchmaking Queue (In-memory for simplicity)
  let matchmakingQueue: { userId: number, username: string, elo: number, avatar_id: number, joinedAt: number }[] = [];
  let privateRooms = new Map<string, { 
    host: { userId: number, username: string, elo: number, avatar_id: number }, 
    guest: null,
    createdAt: number 
  }>();
  let activeMatches = new Map<number, { 
    opponent: any, 
    playerColor: number, 
    opponentColor: number,
    moves: number[],
    board: any[][],
    currentPlayer: 1 | 2,
    winner: any,
    lastMoveAt: number,
    p1_avatar: number,
    p2_avatar: number,
    isBotMatch: boolean,
    lastTaunt?: {
      emoji: string;
      userId: string;
      timestamp: number;
    }
  }>();

  // Bot Takeover Logic
  setInterval(async () => {
    const now = Date.now();
    for (const [userId, match] of activeMatches.entries()) {
      if (match.winner) continue;
      
      // 25 seconds timeout
      if (now - match.lastMoveAt > 25000) {
        console.log(`Bot takeover for user ${userId} in match with ${match.opponent.username}`);
        
        // Find valid moves
        const validMoves = [];
        for (let c = 0; c < COLS; c++) {
          if (isValidMove(match.board, c)) validMoves.push(c);
        }
        
        if (validMoves.length > 0) {
          // In a real scenario, we'd use NNUE here if possible, 
          // but for now we'll pick a move slightly above random to simulate "Bot Takeover"
          // We prioritize center if possible.
          const bestMove = validMoves.includes(3) ? 3 : validMoves[Math.floor(Math.random() * validMoves.length)];
          
          match.moves.push(bestMove);
          match.board = dropPiece(match.board, bestMove, match.currentPlayer);
          match.winner = checkWinner(match.board);
          match.currentPlayer = match.currentPlayer === 1 ? 2 : 1;
          match.lastMoveAt = now;
          
          // Update opponent state
          const oppMatch = activeMatches.get(match.opponent.userId);
          if (oppMatch) {
            oppMatch.moves = match.moves;
            oppMatch.board = match.board;
            oppMatch.winner = match.winner;
            oppMatch.currentPlayer = match.currentPlayer;
            oppMatch.lastMoveAt = now;
          }
        }
      }
    }
  }, 1000);

  // API Routes
  app.post("/api/user/update-username", async (req, res) => {
    const { userId, newUsername } = req.body;
    try {
      const result = await pool.query(
        "UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, elo, avatar_id",
        [newUsername, userId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, user: result.rows[0] });
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/user/update-avatar", async (req, res) => {
    const { userId, avatarId } = req.body;
    try {
      const result = await pool.query(
        "UPDATE users SET avatar_id = $1 WHERE id = $2 RETURNING id, username, elo, avatar_id",
        [avatarId, userId]
      );
      
      // Update active match if exists
      const match = activeMatches.get(userId);
      if (match) {
        if (match.playerColor === 1) match.p1_avatar = avatarId;
        else match.p2_avatar = avatarId;
      }

      res.json({ success: true, user: result.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/user/heartbeat", async (req, res) => {
    const { userId } = req.body;
    try {
      await pool.query("UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1", [userId]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/user/status/:userId", async (req, res) => {
    try {
      const result = await pool.query("SELECT last_active FROM users WHERE id = $1", [req.params.userId]);
      if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
      
      const lastActive = new Date(result.rows[0].last_active).getTime();
      const now = Date.now();
      const isOnline = (now - lastActive) < 10000; // 10 seconds threshold
      
      res.json({ isOnline });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO users (username, password, elo, avatar_id) VALUES ($1, $2, 1500, 0) RETURNING id, username, elo, avatar_id",
        [username, password]
      );
      res.json({ success: true, user: result.rows[0] });
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const result = await pool.query(
        "SELECT id, username, password, elo, avatar_id FROM users WHERE username = $1",
        [username]
      );
      if (result.rows.length === 0 || result.rows[0].password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const { password: _, ...user } = result.rows[0];
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, username, elo, avatar_id FROM users ORDER BY elo DESC"
      );
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chat/messages", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT m.id, m.content, m.created_at, u.username, u.avatar_id 
         FROM messages m 
         JOIN users u ON m.user_id = u.id 
         ORDER BY m.created_at DESC LIMIT 50`
      );
      res.json(result.rows.reverse());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/chat/send", async (req, res) => {
    const { userId, content } = req.body;
    try {
      await pool.query(
        "INSERT INTO messages (user_id, content) VALUES ($1, $2)",
        [userId, content]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/user/matches/:userId", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT m.*, 
                u1.username as p1_username, u1.avatar_id as p1_avatar,
                u2.username as p2_username, u2.avatar_id as p2_avatar
         FROM matches m
         LEFT JOIN users u1 ON m.p1_id = u1.id
         LEFT JOIN users u2 ON m.p2_id = u2.id
         WHERE m.p1_id = $1 OR m.p2_id = $1
         ORDER BY m.created_at DESC LIMIT 20`,
        [req.params.userId]
      );
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/matchmaking/join", (req, res) => {
    const { userId: rawUserId, username, elo, avatarId: rawAvatarId, avatar_id } = req.body;
    const userId = Number(rawUserId);
    const avatarId = avatar_id !== undefined ? avatar_id : rawAvatarId;
    
    // HEALER: Prevent Ghost Matches
    // 1. Remove if already in queue
    matchmakingQueue = matchmakingQueue.filter(u => Number(u.userId) !== userId);
    
    // 2. If there's an existing match record for this user, clean up both sides
    const existingMatch = activeMatches.get(userId);
    if (existingMatch && existingMatch.opponent) {
      activeMatches.delete(Number(existingMatch.opponent.userId));
    }
    activeMatches.delete(userId);

    // 3. Clean up any other match that thinks it's playing against this user
    for (const [key, match] of activeMatches.entries()) {
      if (Number(match.opponent?.userId) === userId) {
        activeMatches.delete(key);
      }
    }
    
    // Check if someone else is waiting
    if (matchmakingQueue.length > 0) {
      const opponent = matchmakingQueue.shift()!;
      
      // Randomize colors
      const player1IsRed = Math.random() > 0.5;
      const p1Color = player1IsRed ? 1 : 2;
      const p2Color = player1IsRed ? 2 : 1;

      // Store for both players
      const board = createEmptyBoard();
      const sharedMoves: number[] = [];
      const matchData = {
        moves: sharedMoves,
        board: board,
        currentPlayer: 1 as (1 | 2),
        winner: null as any,
        lastMoveAt: Date.now(),
        p1_avatar: player1IsRed ? avatarId : opponent.avatar_id,
        p2_avatar: player1IsRed ? opponent.avatar_id : avatarId,
        isBotMatch: false
      };

      activeMatches.set(Number(opponent.userId), { 
        ...matchData,
        opponent: { userId, username, elo, avatar_id: avatarId }, 
        playerColor: p2Color, 
        opponentColor: p1Color,
        isBotMatch: false
      });

      activeMatches.set(userId, {
        ...matchData,
        opponent: { userId: Number(opponent.userId), username: opponent.username, elo: opponent.elo, avatar_id: opponent.avatar_id },
        playerColor: p1Color,
        opponentColor: p2Color,
        isBotMatch: false
      });

      // Found a match!
      return res.json({ 
        success: true, 
        matchFound: true, 
        opponent: { userId: opponent.userId, username: opponent.username, elo: opponent.elo, avatar_id: opponent.avatar_id }, 
        playerColor: p1Color, 
        opponentColor: p2Color 
      });
    }

    // Join queue
    matchmakingQueue.push({ userId, username, elo, avatar_id: avatarId, joinedAt: Date.now() });
    res.json({ success: true, matchFound: false });
  });

  app.post("/api/matchmaking/private/create", (req, res) => {
    const { userId: rawUserId, username, elo, avatar_id } = req.body;
    const userId = Number(rawUserId);
    
    // HEALER: Aggressive Cleanup
    // 1. Remove from public queue
    matchmakingQueue = matchmakingQueue.filter(u => Number(u.userId) !== userId);
    
    // 2. Remove existing private rooms for this user
    for (const [code, room] of privateRooms.entries()) {
      if (Number(room.host.userId) === userId) {
        privateRooms.delete(code);
      }
    }

    // 3. CRITICAL: Clear existing active matches for this user to prevent "Match Recovery" on reload
    const existingMatch = activeMatches.get(userId);
    if (existingMatch && existingMatch.opponent) {
      activeMatches.delete(Number(existingMatch.opponent.userId));
    }
    activeMatches.delete(userId);

    // 4. Clean up any other match that thinks it's playing against this user
    for (const [key, match] of activeMatches.entries()) {
      if (Number(match.opponent?.userId) === userId) {
        activeMatches.delete(key);
      }
    }

    // Generate unique 4 digit code
    let code = "";
    let attempts = 0;
    while(attempts < 100) {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      if (!privateRooms.has(code)) break;
      attempts++;
    }

    privateRooms.set(code, {
      host: { userId, username, elo, avatar_id },
      guest: null,
      createdAt: Date.now()
    });

    res.json({ success: true, code });
  });

  app.post("/api/matchmaking/private/join", (req, res) => {
    const { userId: rawUserId, username, elo, avatar_id, code } = req.body;
    const userId = Number(rawUserId);
    
    // Aggressive Cleanup for the Joiner too
    matchmakingQueue = matchmakingQueue.filter(u => Number(u.userId) !== userId);
    const existingMatch = activeMatches.get(userId);
    if (existingMatch && existingMatch.opponent) {
      activeMatches.delete(Number(existingMatch.opponent.userId));
    }
    activeMatches.delete(userId);

    const room = privateRooms.get(code);

    if (!room) {
      return res.status(404).json({ error: "Private room not found or expired." });
    }

    if (Number(room.host.userId) === userId) {
      return res.status(400).json({ error: "You cannot join your own room." });
    }

    // Found match!
    const opponent = room.host;
    privateRooms.delete(code);

    // Setup match
    const player1IsRed = Math.random() > 0.5;
    const p1Color = player1IsRed ? 1 : 2;
    const p2Color = player1IsRed ? 2 : 1;

    const board = createEmptyBoard();
    const sharedMoves: number[] = [];
    const matchData = {
      moves: sharedMoves,
      board: board,
      currentPlayer: 1 as (1 | 2),
      winner: null as any,
      lastMoveAt: Date.now(),
      p1_avatar: player1IsRed ? avatar_id : opponent.avatar_id,
      p2_avatar: player1IsRed ? opponent.avatar_id : avatar_id,
      isBotMatch: false
    };

    activeMatches.set(Number(opponent.userId), { 
      ...matchData,
      opponent: { userId, username, elo, avatar_id }, 
      playerColor: p2Color, 
      opponentColor: p1Color,
      isBotMatch: false
    });

    activeMatches.set(userId, {
      ...matchData,
      opponent: { ...opponent, userId: Number(opponent.userId) },
      playerColor: p1Color,
      opponentColor: p2Color,
      isBotMatch: false
    });

    res.json({ 
      success: true, 
      matchFound: true, 
      opponent: { ...opponent, userId: Number(opponent.userId) }, 
      playerColor: p1Color, 
      opponentColor: p2Color 
    });
  });

  app.post("/api/matchmaking/private/cancel", (req, res) => {
    const { userId, code } = req.body;
    const room = privateRooms.get(code);
    if (room && room.host.userId === userId) {
      privateRooms.delete(code);
      return res.json({ success: true });
    }
    res.status(404).json({ error: "Room not found or you are not the host." });
  });

  app.post("/api/matchmaking/poll", (req, res) => {
    const { userId: rawUserId } = req.body;
    const userId = Number(rawUserId);
    const match = activeMatches.get(userId);
    if (match && match.opponent) {
      if (match.lastTaunt && Date.now() - match.lastTaunt.timestamp > 3000) {
        delete match.lastTaunt;
      }
      return res.json({ success: true, matchFound: true, ...match });
    }
    res.json({ success: true, matchFound: false });
  });

  app.post("/api/match/move", (req, res) => {
    const { userId: rawUserId, col } = req.body;
    const userId = Number(rawUserId);
    const match = activeMatches.get(userId);
    if (!match) return res.status(404).json({ error: "Match not found" });
    if (match.winner) return res.status(400).json({ error: "Game already finished" });
    
    // Validate turn
    const isPlayerTurn = match.playerColor === match.currentPlayer;
    if (!isPlayerTurn) return res.status(400).json({ error: "Not your turn" });

    // Validate move
    if (!isValidMove(match.board, col)) return res.status(400).json({ error: "Invalid move" });

    const newBoard = dropPiece(match.board, col, match.currentPlayer);
    const newWinner = checkWinner(newBoard);
    const nextPlayer = match.currentPlayer === 1 ? 2 : 1;
    const now = Date.now();

    match.moves.push(col);
    match.board = newBoard;
    match.winner = newWinner;
    match.currentPlayer = nextPlayer;
    match.lastMoveAt = now;

    // Force synchronize the opponent's state
    const opponentMatch = activeMatches.get(Number(match.opponent.userId));
    if (opponentMatch) {
      opponentMatch.moves = match.moves;
      opponentMatch.board = match.board;
      opponentMatch.winner = match.winner;
      opponentMatch.currentPlayer = match.currentPlayer;
      opponentMatch.lastMoveAt = match.lastMoveAt;
    }

    res.json({ success: true, winner: match.winner, board: match.board, currentPlayer: match.currentPlayer });
  });

  app.get("/api/match/status/:userId", (req, res) => {
    const userId = parseInt(req.params.userId);
    const match = activeMatches.get(userId);
    if (!match) return res.status(404).json({ error: "No active match" });

    res.json({
      success: true,
      moves: match.moves,
      board: match.board,
      currentPlayer: match.currentPlayer,
      winner: match.winner,
      opponent: match.opponent,
      playerColor: match.playerColor,
      opponentColor: match.opponentColor,
      p1_avatar: match.p1_avatar,
      p2_avatar: match.p2_avatar,
      lastMoveAt: match.lastMoveAt,
      lastEmoji: match.lastEmoji,
      lastEmojiBy: match.lastEmojiBy,
      lastEmojiAt: match.lastEmojiAt,
      lastEmojiId: match.lastEmojiId,
      serverTime: Date.now()
    });
  });

  app.post("/api/matchmaking/leave", (req, res) => {
    const { userId } = req.body;
    matchmakingQueue = matchmakingQueue.filter(u => u.userId !== userId);
    res.json({ success: true });
  });

  app.post("/api/match/resign", async (req, res) => {
    const { userId: rawUserId } = req.body;
    const userId = Number(rawUserId);
    
    let match: any = activeMatches.get(userId);
    if (!match) {
      for (const [key, m] of activeMatches.entries()) {
        if (m.opponent && Number(m.opponent.userId) === userId) {
          match = m;
          break;
        }
      }
    }
    
    if (!match) {
      return res.status(404).json({ error: "No active match found for this user." });
    }

    try {
      const opponentId = Number(match.opponent.userId);
      const opponentMatch = activeMatches.get(opponentId);
      
      const userRes = await pool.query("SELECT elo FROM users WHERE id = $1", [userId]);
      const userElo = userRes.rows[0].elo;
      const oppRes = await pool.query("SELECT elo FROM users WHERE id = $1", [opponentId]);
      const opponentElo = oppRes.rows[0].elo;

      // BOSS LOGIC Calculation
      // Resigner always loses
      const resignerDelta = userElo >= opponentElo ? -15 : -3;
      // Winner always wins
      const winnerDelta = opponentElo <= userElo ? 15 : 3;

      // Update DB
      await pool.query("UPDATE users SET elo = GREATEST(100, elo + $1) WHERE id = $2", [resignerDelta, userId]);
      await pool.query("UPDATE users SET elo = elo + $1 WHERE id = $2", [winnerDelta, opponentId]);

      // Set winner in memory so opponent's poll sees it
      const winnerColor = match.playerColor === 1 ? 2 : 1;
      match.winner = winnerColor;
      if (opponentMatch) {
        opponentMatch.winner = winnerColor;
      }

      // Log in DB
      const p1_id = match.playerColor === 1 ? userId : opponentId;
      const p2_id = match.playerColor === 2 ? userId : opponentId;
      const winner_id = opponentId;

      await pool.query(
        "INSERT INTO matches (p1_id, p2_id, winner_id, moves) VALUES ($1, $2, $3, $4)",
        [p1_id, p2_id, winner_id, JSON.stringify(match.moves || [])]
      );

      res.json({ success: true, message: "Match resigned.", eloChange: resignerDelta });
    } catch (err: any) {
      console.error("Resign error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/elo/update", async (req, res) => {
    const { userId, opponentId, winnerId, isBot } = req.body;
    try {
      const userRes = await pool.query("SELECT elo FROM users WHERE id = $1", [userId]);
      let userElo = userRes.rows[0].elo;
      
      let opponentElo = 1500;
      if (!isBot) {
        const oppRes = await pool.query("SELECT elo FROM users WHERE id = $1", [opponentId]);
        opponentElo = oppRes.rows[0].elo;
      } else {
        opponentElo = Number(opponentId) || 1500;
      }

      // BOSS LOGIC:
      // If win vs equal/stronger: +15
      // If win vs weaker: +3
      // If lose vs equal/weaker: -15
      // If lose vs stronger: -3
      
      let delta = 0;
      if (winnerId === userId) {
        // Win
        delta = userElo <= opponentElo ? 15 : 3;
      } else if (winnerId === opponentId) {
        // Loss
        delta = userElo >= opponentElo ? -15 : -3;
      } else {
        // Draw
        delta = 0;
      }

      const newElo = Math.max(100, userElo + delta);
      await pool.query("UPDATE users SET elo = $1 WHERE id = $2", [newElo, userId]);
      
      res.json({ success: true, newElo, eloChange: delta });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/match/taunt", async (req, res) => {
    const { userId, opponentId, emoji } = req.body;
    const match = activeMatches.get(Number(userId));
    const now = Date.now();
    
    if (match) {
      match.lastEmoji = emoji;
      match.lastEmojiBy = Number(userId);
      match.lastEmojiAt = now;
      match.lastEmojiId = Math.random().toString(36).substr(2, 9);
      
      const oppMatch = activeMatches.get(Number(opponentId));
      if (oppMatch) {
        oppMatch.lastEmoji = emoji;
        oppMatch.lastEmojiBy = Number(userId);
        oppMatch.lastEmojiAt = now;
        oppMatch.lastEmojiId = match.lastEmojiId;
      }
    }
    
    // Log to "Deviated Sheet" (Taunts Table)
    try {
      await pool.query("INSERT INTO taunts (sender_id, emoji) VALUES ($1, $2)", [Number(userId), emoji]);
    } catch (err) {
      console.error("DB: Failed to log taunt", err);
    }
    
    res.json({ success: true });
  });

  app.get("/api/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", database: "connected" });
    } catch (err) {
      console.error("Health check failed:", err);
      res.status(500).json({ status: "error", database: "disconnected", error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get("/api/debug/counts", async (req, res) => {
    try {
      const matches = await pool.query("SELECT COUNT(*) FROM matches");
      const moves = await pool.query("SELECT COUNT(*) FROM moves");
      const weights = await pool.query("SELECT COUNT(*) FROM nnue_weights");
      
      const tables = await pool.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name = 'kaggle_training_data_1'
      `);
      
      let kaggleCount = '0';
      let kaggleError = null;
      let kaggleColumns = [];
      let kaggleSchema = 'public';
      let kaggleSample = null;
      
      if (tables.rows.length > 0) {
        kaggleSchema = tables.rows[0].table_schema;
        try {
          const kaggle = await pool.query(`SELECT COUNT(*) FROM "${kaggleSchema}"."kaggle_training_data_1"`);
          kaggleCount = kaggle.rows[0].count;
          
          const columns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'kaggle_training_data_1' AND table_schema = $1
          `, [kaggleSchema]);
          kaggleColumns = columns.rows.map(r => r.column_name);

          if (kaggleCount !== '0') {
            const sample = await pool.query(`SELECT * FROM "${kaggleSchema}"."kaggle_training_data_1" LIMIT 1`);
            kaggleSample = sample.rows[0];
          }
        } catch (e) {
          kaggleError = e instanceof Error ? e.message : String(e);
        }
      } else {
        kaggleError = "Table 'kaggle_training_data_1' not found in any schema.";
      }
      
      const allTables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      res.json({
        matches: matches.rows[0].count,
        moves: moves.rows[0].count,
        weights: weights.rows[0].count,
        kaggle: kaggleCount,
        kaggleError: kaggleError,
        kaggleColumns: kaggleColumns,
        kaggleSchema: kaggleSchema,
        kaggleSample: kaggleSample,
        tables: allTables.rows.map(r => r.table_name)
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/nnue/init", async (req, res) => {
    try {
      // Clear existing weights first
      await pool.query("DELETE FROM nnue_weights");
      
      const defaultWeights = {
        brain: {
          levels: [
            {
              inputs: new Array(84).fill(0),
              outputs: new Array(16).fill(0),
              biases: new Array(16).fill(0).map(() => Math.random() * 0.2 - 0.1),
              weights: new Array(84).fill(0).map(() => new Array(16).fill(0).map(() => Math.random() * 0.2 - 0.1))
            },
            {
              inputs: new Array(16).fill(0),
              outputs: new Array(1).fill(0),
              biases: [0.0],
              weights: new Array(16).fill(0).map(() => [Math.random() * 0.2 - 0.1])
            }
          ]
        }
      };
      await pool.query("INSERT INTO nnue_weights (layer_name, weights) VALUES ('kaggle', $1), ('user', $1), ('both', $1)", [JSON.stringify(defaultWeights)]);
      res.json({ success: true });
    } catch (err) {
      console.error("Error initializing weights:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/save-match", async (req, res) => {
    const { p1Depth, p2Depth, pairingId, winner, moves, category = 'general' } = req.body;
    
    try {
      const matchResult = await pool.query(
        "INSERT INTO matches (p1_depth, p2_depth, pairing_id, winner, category) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [p1Depth, p2Depth, pairingId, winner, category]
      );
      
      const matchId = matchResult.rows[0].id;
      
      // Prepare bulk insert for moves
      const moveValues = moves.map((m: any, index: number) => [
        matchId,
        index,
        JSON.stringify(m.board),
        m.move,
        m.result
      ]);

      // Simple iterative insert for now, could be optimized with a single query
      for (const vals of moveValues) {
        await pool.query(
          "INSERT INTO moves (match_id, move_number, board_state, move_made, final_result) VALUES ($1, $2, $3, $4, $5)",
          vals
        );
      }

      res.json({ success: true, matchId });
    } catch (err) {
      console.error("Error saving match:", err);
      res.status(500).json({ error: "Failed to save match" });
    }
  });

  app.post("/api/clear-matches", async (req, res) => {
    try {
      // Delete from moves first to handle potential foreign key constraints
      // then delete from matches.
      await pool.query("DELETE FROM moves");
      await pool.query("DELETE FROM matches");
      res.json({ success: true });
    } catch (err) {
      console.error("Error clearing matches:", err);
      res.status(500).json({ error: "Failed to clear matches" });
    }
  });

  app.get("/api/matches", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM matches ORDER BY created_at DESC LIMIT 50");
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching matches:", err);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.get("/api/match/:id", async (req, res) => {
    try {
      const match = await pool.query("SELECT * FROM matches WHERE id = $1", [req.params.id]);
      const moves = await pool.query("SELECT * FROM moves WHERE match_id = $1 ORDER BY move_number ASC", [req.params.id]);
      res.json({ match: match.rows[0], moves: moves.rows });
    } catch (err) {
      console.error("Error fetching match details:", err);
      res.status(500).json({ error: "Failed to fetch match details" });
    }
  });

  // --- NNUE Weights & Training ---
  app.get('/api/nnue/weights', async (req, res) => {
    const source = req.query.source || 'both';
    try {
      const result = await pool.query('SELECT * FROM nnue_weights WHERE layer_name = $1 ORDER BY updated_at DESC LIMIT 1', [source]);
      if (result.rows.length === 0) {
        // Default weights (84 -> 16 -> 1)
        const defaultWeights = {
          brain: {
            levels: [
              {
                inputs: new Array(84).fill(0),
                outputs: new Array(16).fill(0),
                biases: new Array(16).fill(0).map(() => Math.random() * 0.2 - 0.1),
                weights: new Array(84).fill(0).map(() => new Array(16).fill(0).map(() => Math.random() * 0.2 - 0.1))
              },
              {
                inputs: new Array(16).fill(0),
                outputs: new Array(1).fill(0),
                biases: [0.0],
                weights: new Array(16).fill(0).map(() => [Math.random() * 0.2 - 0.1])
              }
            ]
          }
        };
        return res.json(defaultWeights);
      }
      res.json(result.rows[0].weights);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/nnue/weights', async (req, res) => {
    try {
      const { weights, source = 'both' } = req.body;
      // Use UPSERT logic: Try to update the specific source layer first
      const result = await pool.query(
        'UPDATE nnue_weights SET weights = $1, updated_at = CURRENT_TIMESTAMP WHERE layer_name = $2',
        [JSON.stringify(weights), source]
      );
      
      // If no row was updated, it means the source doesn't exist yet, so insert it
      if (result.rowCount === 0) {
        await pool.query(
          'INSERT INTO nnue_weights (layer_name, weights) VALUES ($1, $2)',
          [source, JSON.stringify(weights)]
        );
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Error saving weights:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/nnue/training-data', async (req, res) => {
    const source = req.query.source || 'both';
    const category = req.query.category; // Optional: 'specialized' or 'general'
    try {
      let userMoves = [];
      let kaggleMoves = [];

      // 1. Get user moves from our own database
      if (source === 'user' || source === 'both') {
        const limit = source === 'user' ? 5000 : 2500;
        let query = `
          SELECT m.board_state, m.final_result 
          FROM moves m
          JOIN matches mt ON m.match_id = mt.id
          WHERE m.board_state IS NOT NULL AND m.final_result IS NOT NULL
        `;
        const params: any[] = [limit];
        
        if (category) {
          query += ` AND mt.category = $2`;
          params.push(category);
        }
        
        query += ` ORDER BY RANDOM() LIMIT $1`;

        const userMovesResult = await pool.query(query, params);
        
        userMoves = userMovesResult.rows.map(row => {
          // Normalize board state to use 1 and 2
          const normalizedBoard = row.board_state.map((r: any) => 
            r.map((cell: any) => {
              if (cell === 1 || cell === '1' || cell === 'x') return 1;
              if (cell === 2 || cell === '2' || cell === 'o' || cell === -1 || cell === '-1') return 2;
              return null;
            })
          );
          
          // Normalize result: 1 for P1 win, -1 for P2 win
          let normalizedResult = 0;
          if (row.final_result === 1 || row.final_result === '1' || row.final_result === 'win') normalizedResult = 1;
          if (row.final_result === 2 || row.final_result === '2' || row.final_result === 'loss' || row.final_result === -1 || row.final_result === '-1') normalizedResult = -1;
          
          return { board_state: normalizedBoard, final_result: normalizedResult };
        });
      }

      // 2. Get Kaggle moves
      if (source === 'kaggle' || source === 'both') {
        const limit = source === 'kaggle' ? 5000 : 2500;
        // Find the schema for the kaggle table
        const tableCheck = await pool.query(`
          SELECT table_schema 
          FROM information_schema.tables 
          WHERE table_name = 'kaggle_training_data_1'
          LIMIT 1
        `);
        
        const schema = tableCheck.rows.length > 0 ? tableCheck.rows[0].table_schema : 'public';
        
        // Check columns to be sure
        const columnCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'kaggle_training_data_1' AND table_schema = $1
        `, [schema]);
        
        const columns = columnCheck.rows.map(r => r.column_name);
        const hasBoardState = columns.includes('board_state');
        const hasFinalResult = columns.includes('final_result');
        
        if (hasBoardState && hasFinalResult) {
          const result = await pool.query(`
            SELECT board_state, final_result 
            FROM "${schema}"."kaggle_training_data_1" 
            WHERE board_state IS NOT NULL AND final_result IS NOT NULL
            ORDER BY RANDOM() LIMIT $1
          `, [limit]);
          
          kaggleMoves = result.rows.map(row => {
            // Normalize board state to use 1 and 2
            const normalizedBoard = row.board_state.map((r: any) => 
              r.map((cell: any) => {
                if (cell === 1 || cell === '1' || cell === 'x') return 1;
                if (cell === 2 || cell === '2' || cell === 'o' || cell === -1 || cell === '-1') return 2;
                return null;
              })
            );
            
            // Normalize result: 1 for P1 win, -1 for P2 win
            let normalizedResult = 0;
            if (row.final_result === 1 || row.final_result === '1' || row.final_result === 'win') normalizedResult = 1;
            if (row.final_result === 2 || row.final_result === '2' || row.final_result === 'loss' || row.final_result === -1 || row.final_result === '-1') normalizedResult = -1;
            
            return { board_state: normalizedBoard, final_result: normalizedResult };
          });
        } else {
          // Handle Kaggle schema: pos_01...pos_42, winner
          const posColumns = columns.filter(c => c.startsWith('pos_')).sort();
          const hasWinner = columns.includes('winner');

          if (posColumns.length === 42 && hasWinner) {
            const query = `SELECT ${posColumns.join(', ')}, winner FROM "${schema}"."kaggle_training_data_1" ORDER BY RANDOM() LIMIT $1`;
            const result = await pool.query(query, [limit]);
            
            kaggleMoves = result.rows.map(row => {
              // Map board state: 'x' -> 1, 'o' -> -1, 'b' -> 0 (or 1, 2, 0)
              const flat_board = posColumns.map(col => {
                const val = row[col];
                if (val === 'x' || val === 1 || val === '1') return 1;
                if (val === 'o' || val === 2 || val === -1 || val === '2' || val === '-1') return 2; // Use 2 for player 2
                return null; // Use null for empty
              });

              // Reshape into 6x7 2D array (Board type)
              const board_state = [];
              for (let r = 0; r < 6; r++) {
                board_state.push(flat_board.slice(r * 7, (r + 1) * 7));
              }

              // Map result: 'win' -> 1, 'loss' -> -1, 'draw' -> 0
              let final_result = 0;
              const w = row.winner;
              if (w === 'win' || w === 1 || w === '1') final_result = 1;
              if (w === 'loss' || w === 2 || w === -1 || w === '2' || w === '-1') final_result = -1;

              return { board_state, final_result };
            });
          }
        }
      }

      // 3. Combine both sources
      const allMoves = [...userMoves, ...kaggleMoves];
      
      if (allMoves.length === 0) {
        return res.status(400).json({ 
          error: `No training data found for source '${source}'.` 
        });
      }

      res.json(allMoves);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
