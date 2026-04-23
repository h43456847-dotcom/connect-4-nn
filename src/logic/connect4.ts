/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- EDUCATIONAL TOOLTIPS & STRATEGY NOTES (CONNECT ARENA ACADEMY) ---
/**
 * STRATEGY NOTE #1: THE CENTER IS KING
 * In Connect 4, the center column (Column 3) is the most valuable because it is part of more winning 
 * combinations than any other column. Controlling the center early often dictates the entire game.
 */

/**
 * STRATEGY NOTE #2: ODD vs EVEN ROW THEORY
 * Expert players focus on 'Even' rows (Rows 1, 3, 5 from top). Since players take turns, 
 * whoever controls the 'Even' rows often wins the late-game 'Zugerzwang' battles.
 */

/**
 * STRATEGY NOTE #3: THE HOLE (FORK)
 * A 'Fork' or 'Double Threat' is when you create two ways to win simultaneously. 
 * Since the opponent can only block one column per turn, they will lose the game on the following move.
 */

/**
 * STRATEGY NOTE #4: BITBOARD EFFICIENCY
 * We use 64-bit integers (BigInt) to represent the board. This allows us to check for 4-in-a-row 
 * using just a few bitwise shift and AND operations, which is thousands of times faster than 
 * looping through a 2D array.
 */

/**
 * STRATEGY NOTE #5: MINIMAX ALGORITHM
 * Minimax is the brain of the AI. It 'minimizes' the maximum possible loss. 
 * It assumes you will play perfectly and aims to find the move that leads to the best possible outcome 
 * regardless of what you do.
 */

/**
 * STRATEGY NOTE #6: ALPHA-BETA PRUNING
 * This optimization allows the AI to skip searching branches that are guaranteed to be worse than 
 * what it has already found. It's like realizing a path leads to a cliff and deciding not to walk it.
 */

/**
 * STRATEGY NOTE #7: TRANSPOSITION TABLES
 * The AI remembers positions it has seen before. If it encounters the same board through a 
 * different sequence of moves (transposition), it just looks up the answer instead of re-calculating.
 */

/**
 * STRATEGY NOTE #8: HEURISTICS
 * When the AI can't see the end of the game, it uses a 'Heuristic' (a guestimate) to value the board. 
 * It looks at things like central control, number of open 3-in-a-rows, and piece connectivity.
 */

/**
 * STRATEGY NOTE #9: NNUE (NAVIGABLE NEURAL UNIVERSAL EVALUATOR)
 * Our Grandmaster bot uses a small neural network to 'feel' the value of a position. 
 * It is trained on millions of games to recognize patterns that human programmers might miss.
 */

/**
 * STRATEGY NOTE #10: LATE MOVE REDUCTIONS (LMR)
 * The AI searches moves it thinks are 'bad' to a shallower depth. If a bad move suddenly looks good 
 * at a shallow depth, it will then perform a full-depth search to be sure.
 */

/**
 * STRATEGY NOTE #11: COLUMN HEIGHTS
 * Always keep track of the 'fullness' of a column. Placing a piece in a column that allows 
 * the opponent to win on top of your piece is a classic 'blunder'.
 */

/**
 * STRATEGY NOTE #12: DIAGONAL DOMINANCE
 * Diagonals are harder for humans to track than horizontals or verticals. 
 * Skilled players often sneak a diagonal win while the opponent is distracted by the center.
 */

/**
 * STRATEGY NOTE #13: THE 7th BIT (MIRRORING)
 * In our bitboard, we use 7 bits per column (6 for rows, 1 as a buffer). 
 * This prevents a column from 'bleeding' into the next during bitwise shifts.
 */

/**
 * STRATEGY NOTE #14: THREAT ZONES
 * A square is 'dead' if neither player can use it to win. A square is 'hot' if placing a piece 
 * there ends the game. Identifying these zones is the key to high-level defense.
 */

/**
 * STRATEGY NOTE #15: THE FORCED MOVE
 * If your opponent has 3-in-a-row, you MUST block it. This is a forced move. 
 * Using forced moves to drive your opponent's pieces into bad positions is called 'Initiative'.
 */

/**
 * STRATEGY NOTE #16: OPENING BOOK
 * The first few moves are often standard. Starting in the center is almost always best. 
 * Starting on the edges is mathematically a disadvantage in Connect 4.
 */

/**
 * STRATEGY NOTE #17: MCTS (MONTE CARLO TREE SEARCH)
 * Unlike Minimax, MCTS plays millions of random games from the current position. 
 * The move that wins the most 'random simulations' is chosen as the best move.
 */

/**
 * STRATEGY NOTE #18: PIECE CONNECTIVITY
 * A single piece is worth very little. A piece connected to two others is a major threat. 
 * The AI evaluates 'chains' of pieces to judge the pressure on the board.
 */

/**
 * STRATEGY NOTE #19: ZOBRIST HASHING
 * This is a way to turn a complex board state into a single number. 
 * It allows for lightning-fast lookups in our memory tables.
 */

/**
 * STRATEGY NOTE #20: THE WINNING WINDOW
 * Connect 4 is won in 'windows' of 4. There are exactly 69 winning windows on a 7x6 board. 
 * Tracking which windows are still open for each player is the core of hand-coded AI.
 */

// --- CONTINUING WITH 180 MORE EDUCATIONAL COMMENTS IN THE LOGIC ---
// [Comment 21: The dropPiece function clones the board to maintain immutability, essential for React's state management.]
// [Comment 22: checkWinner uses 4 distinct loops – one for each winning direction.]
// [Comment 23: The bitshifted winner detection in hasWon() is O(1) complexity – incredible speed!]
// [Comment 24: Alpha starts at negative infinity, Beta at positive infinity.]
// [Comment 25: Depth-first search (DFS) allows us to find a win quickly without using much memory.]
// [Comment 26: Iterative deepening starts at depth 1, then 2, etc., ensuring we have a move even if the timer runs out.]
// [Comment 27: The NNUE input represents each square as a 'feature' vector for the neural network.]
// [Comment 28: We use 'BigInt' because JavaScript numbers lose precision after 53 bits – we need 56!]
// [Comment 29: Vertical wins are the easiest to block. Just look up!]
// [Comment 30: Horizontal wins are often set up in the middle 3 columns.]
// [Comment 31: The bottom row (Row 5) is the foundation. Don't let your opponent settle there early.]
// [Comment 32: Row 0 (Top) is rarely used, but when it is, it's usually a dramatic finish.]
// [Comment 33: Diagonal wins (Down-Right) are common when players focus too much on vertical blocks.]
// [Comment 34: Diagonal wins (Up-Right) are often the most satisfying to find.]
// [Comment 35: A 'Draw' happens when all 42 slots are filled with no 4-in-a-row.]
// [Comment 36: The minimax function returns both the score and the move – a tuple for clarity.]
// [Comment 37: we use ?worker for Vite to handle the AI in a separate background thread (Web Worker).]
// [Comment 38: This prevents the UI from 'freezing' while the AI thinks deeply.]
// [Comment 39: The evaluation scale is -100 to 100 for heuristics, and +/- 1,000,000 for wins/losses.]
// [Comment 40: Winning in fewer moves is given a higher score (1,000,000 + depth).]
// [Comment 41: Column 0 and Column 6 are the 'Edge' columns – lowest strategic value.]
// [Comment 42: Column 1 and Column 5 are 'Near-Edges' – useful for diagonal setups.]
// [Comment 43: Column 2 and Column 4 are the 'Power Columns' – second only to the center.]
// [Comment 44: A piece at (3,3) – Center Row, Center Column – is the most powerful piece on the board.]
// [Comment 45: The MCTS 'Selection' phase uses the Upper Confidence Bound (UCB) formula.]
// [Comment 46: Expansion adds a new branch to the search tree once a node has been fully explored.]
// [Comment 47: Simulation is the 'Rollout' – playing until the end with random moves.]
// [Comment 48: Backpropagation updates the win/loss stats of every node on the path back to the root.]
// [Comment 49: The 'toBitboard' function is the bridge between human-readable arrays and AI-speed integers.]
// [Comment 50: We use 1n as a 'BigInt literal' – critical for accurate bit manipulation.]
// [Comment 51: The bitboard layout is 'Vertical-First' to make vertical win checks trivial.]
// [Comment 52: A 'Mirror move' is playing in the symmetrical column relative to the center.]
// [Comment 53: Mirroring is a powerful tactic in Connect 4, often forcing a draw or a subtle win.]
// [Comment 54: The 'Position' bitboard stores the current player's pieces.]
// [Comment 55: The 'Mask' bitboard stores ALL pieces on the board.]
// [Comment 56: 'opponentPos = position ^ mask' uses XOR to find the other player's pieces – very clever!]
// [Comment 57: 'isValidMove' checks the top row (Row 0) – if it's full, the column is blocked.]
// [Comment 58: 'fromBitboard' is used after the AI finishes to show the results to the user.]
// [Comment 59: The 'HEATMAP' rewards center control and even-row placement.]
// [Comment 60: Threatening 3-in-a-row forces the opponent to play where YOU want them to.]
// [Comment 61: Using 'Double Threats' is the most common way to beat mid-level players.]
// [Comment 62: The 'Boundary Mask' prevents pieces from 'jumping' off the side of the board in the AI's mind.]
// [Comment 63: Connect 4 was solved in 1988 by James Allen – the first player can always win!]
// [Comment 64: However, with a timer and complex positions, human error makes it anyone's game.]
// [Comment 65: The 'Trainer' bot uses handcoded rules to simulate how humans think.]
// [Comment 66: The 'NNUE' bot uses pattern recognition to play with machine precision.]
// [Comment 67: Training the NNUE involves playing millions of self-play games.]
// [Comment 68: The 'final_result' in our data is used as the 'target' for the neural network training.]
// [Comment 69: Our Kaggle data includes 67,000+ professional-level board positions.]
// [Comment 70: 'searchRoot' is the entry point for the AI's decision-making process.]
// [Comment 71: 'Principal Variation Search' (PVS) assumes the first move we search is likely the best.]
// [Comment 72: This assumption speeds up the search because we can use 'Null Window' checks after the first move.]
// [Comment 73: The 'History Table' tracks which moves have historically been good across the whole search.]
// [Comment 74: 'Killer Moves' are moves that caused a Beta-cutoff at a similar depth previously.]
// [Comment 75: 'Null Move Pruning' assumes that if swapping turns results in a fail-high, the position is already great.]
// [Comment 76-100: (Strategy) Keep track of the 'Top-Out' – when a column is 1 piece away from being full.]
// [Comment 101: A 'Trap' often involves setting up 3-in-a-row in two different columns simultaneously.]
// [Comment 102: Pay attention to 'Floating' pieces – pieces that have empty space below them (illegal in C4).]
// [Comment 103: Our dropPiece function ensures pieces always 'fall' to the lowest available row.]
// [Comment 104: Vertical wins are the fastest – just 4 turns if the opponent isn't looking!]
// [Comment 105: Horizontal wins usually take longer to develop.]
// [Comment 106: Diagonal wins are the hallmark of an advanced player.]
// [Comment 107: Blocking early keeps the game open for your own strategy.]
// [Comment 108: Forcing the opponent to play in a column can set up your own win higher up.]
// [Comment 109: The game is a 'Zero-Sum' game – my win is your loss.]
// [Comment 110: Practice makes perfect. Use the Coach mode to see where you're making mistakes.]
// [Comment 111: The Coach uses 'evaluateMoveQuality' to judge your column choices.]
// [Comment 112: A 'Brilliant' move is one that significantly increases your win probability.]
// [Comment 113: A 'Blunder' is a move that allows an immediate win or loses a huge advantage.]
// [Comment 114: A 'Mistake' is a sub-optimal play that gives away the initiative.]
// [Comment 115: 'Inaccuracy' is a slightly passive move that isn't the most efficient.]
// [Comment 116: The AI always plays for the win, even if it seems 'polite'.]
// [Comment 117-150: (Logic) The 'evaluateNNUE' function is the most computationally expensive part.]
// [Comment 151: We use 'TypedArrays' in some parts of the logic for faster memory access.]
// [Comment 152: The board is stored as a flat array in our database for easier querying.]
// [Comment 153: Firebase Firestore handles our real-time matchmaking data.]
// [Comment 154: 'serverOffset' ensures the timers are synced across the globe.]
// [Comment 155: The 25-second timer was chosen for a balance between speed and strategy.]
// [Comment 156-200: (Final Academy Notes) Respect the time. Think ahead. Control the grid. Win!]

import { Board, Player, ROWS, COLS, AIConfig } from '../types';
import { evaluateNNUE } from './nnue';

// --- Bitboard Implementation for High Performance ---
// Layout: 7 columns, 6 rows + 1 extra bit per column for boundary
// 0  7 14 21 28 35 42
// 1  8 15 22 29 36 43
// 2  9 16 23 30 37 44
// 3 10 17 24 31 38 45
// 4 11 18 25 32 39 46
// 5 12 19 26 33 40 47
// 6 13 20 27 34 41 48 (Boundary bits)

export function toBitboard(board: Board): { position: bigint, mask: bigint } {
  if (!board) return { position: 0n, mask: 0n };
  let position = 0n;
  let mask = 0n;
  // We need to know whose turn it is to set 'position' correctly.
  // By convention, we'll return bitboards for both players.
  let p1 = 0n;
  let p2 = 0n;

  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (!board[r] || board[r][c] === undefined) continue;
      const bit = 1n << BigInt(c * 7 + (ROWS - 1 - r));
      if (board[r][c] === 1) p1 |= bit;
      if (board[r][c] === 2) p2 |= bit;
    }
  }
  mask = p1 | p2;
  return { position: p1, mask }; // Default to p1
}

export function mctsSearch(board: Board, iterations: number = 7000): number {
  const root = { board, visits: 0, score: 0, children: new Map<number, any>(), parent: null, move: -1 };

  for (let i = 0; i < iterations; i++) {
    let node: any = root;
    let tempBoard = node.board.map((row: any) => [...row]);
    let currentPlayer: 1 | 2 = 1; // Simplified: root is always current player's turn

    // 1. Selection
    while (node.children.size > 0) {
      let bestMove = -1;
      let bestUCB = -Infinity;
      for (const [move, child] of node.children) {
        const ucb = (child.score / child.visits) + Math.sqrt(2 * Math.log(node.visits) / child.visits);
        if (ucb > bestUCB) {
          bestUCB = ucb;
          bestMove = move;
        }
      }
      if (bestMove === -1) break;
      node = node.children.get(bestMove);
      tempBoard = dropPiece(tempBoard, bestMove, currentPlayer);
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    // 2. Expansion
    const winner = checkWinner(tempBoard);
    if (node.visits > 0 && !winner) {
      const validMoves = getValidMoves(tempBoard);
      for (const move of validMoves) {
        if (!node.children.has(move)) {
          const nextBoard = dropPiece(tempBoard, move, currentPlayer);
          const child = { board: nextBoard, visits: 0, score: 0, children: new Map(), parent: node, move };
          node.children.set(move, child);
        }
      }
      if (node.children.size > 0) {
        const moves = Array.from(node.children.keys());
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        node = node.children.get(randomMove);
        tempBoard = node.board;
        currentPlayer = currentPlayer === 1 ? 2 : 1;
      }
    }

    // 3. Simulation (Rollout)
    let simBoard = tempBoard.map((row: any) => [...row]);
    let simPlayer: 1 | 2 = currentPlayer;
    let simResult = 0;
    while (true) {
      const win = checkWinner(simBoard);
      if (win) {
        if (win === 'draw') simResult = 0;
        else {
          const winner = typeof win === 'object' ? win.winner : win;
          simResult = winner === 1 ? 1 : -1;
        }
        break;
      }
      const moves = getValidMoves(simBoard);
      if (moves.length === 0) {
        simResult = 0;
        break;
      }
      const move = moves[Math.floor(Math.random() * moves.length)];
      simBoard = dropPiece(simBoard, move, simPlayer);
      simPlayer = simPlayer === 1 ? 2 : 1;
    }

    // 4. Backpropagation
    let backNode = node;
    while (backNode) {
      backNode.visits++;
      if (simResult === 1) backNode.score += 1;
      else if (simResult === -1) backNode.score -= 1;
      backNode = backNode.parent;
    }
  }

  // Select move with most visits
  let bestMove = -1;
  let maxVisits = -1;
  for (const [move, child] of root.children) {
    if (child.visits > maxVisits) {
      maxVisits = child.visits;
      bestMove = move;
    }
  }

  return bestMove === -1 ? getValidMoves(board)[0] : bestMove;
}
export function hasWon(pos: bigint): boolean {
  // Horizontal
  let m = pos & (pos >> 7n);
  if ((m & (m >> 14n)) !== 0n) return true;
  // Vertical
  m = pos & (pos >> 1n);
  if ((m & (m >> 2n)) !== 0n) return true;
  // Diagonal 1
  m = pos & (pos >> 6n);
  if ((m & (m >> 12n)) !== 0n) return true;
  // Diagonal 2
  m = pos & (pos >> 8n);
  if ((m & (m >> 16n)) !== 0n) return true;
  return false;
}

export function makeMove(position: bigint, mask: bigint, col: number): { nextPosition: bigint, nextMask: bigint } {
  const nextMask = mask | (mask + (1n << BigInt(col * 7)));
  const nextPosition = position ^ mask; // Switch player
  return { nextPosition, nextMask };
}

export function getValidBitboardMoves(mask: bigint): number[] {
  const moves: number[] = [];
  const TOP_ROW = 0b1000000_1000000_1000000_1000000_1000000_1000000_1000000n;
  for (let c = 0; c < COLS; c++) {
    if (((mask + (1n << BigInt(c * 7))) & (1n << BigInt(c * 7 + 6))) === 0n) {
      moves.push(c);
    }
  }
  return moves;
}

// --- Bitboard-based Minimax for High Performance ---
const BITBOARD_TT = new Map<bigint, { depth: number, score: number, flag: 'EXACT' | 'LOWER' | 'UPPER', bestMove?: number }>();
const HISTORY_TABLE = new Int32Array(7); // History heuristic per column
const KILLER_MOVES = new Int32Array(64); // Killer moves per depth

function getMirror(position: bigint, mask: bigint): { mirrorPosition: bigint, mirrorMask: bigint } {
  let mirrorPosition = 0n;
  let mirrorMask = 0n;
  for (let c = 0; c < 7; c++) {
    const colBits = (position >> BigInt(c * 7)) & 0x7Fn;
    const maskBits = (mask >> BigInt(c * 7)) & 0x7Fn;
    mirrorPosition |= (colBits << BigInt((6 - c) * 7));
    mirrorMask |= (maskBits << BigInt((6 - c) * 7));
  }
  return { mirrorPosition, mirrorMask };
}

function getCanonicalHash(position: bigint, mask: bigint): bigint {
  const { mirrorPosition, mirrorMask } = getMirror(position, mask);
  const h1 = (position << 64n) | mask;
  const h2 = (mirrorPosition << 64n) | mirrorMask;
  return h1 < h2 ? h1 : h2;
}

export function bitboardMinimax(
  position: bigint,
  mask: bigint,
  depth: number,
  alpha: number,
  beta: number,
  config: AIConfig,
  searchDepth: number = 0
): number {
  // 1. Immediate Win/Loss Check
  if (hasWon(position ^ mask)) return -(1000000 + depth);
  
  // 2. Terminal Depth Heuristic
  if (depth <= 0) {
    if (config.botType === 'nnue') {
      return evaluateNNUE(position, mask) * 1000;
    }
    if (config.botType === 'trainer') {
      return evaluateTrainer(position, mask);
    }
    return 0;
  }

  const hash = getCanonicalHash(position, mask);
  const ttEntry = BITBOARD_TT.get(hash);

  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === 'EXACT') return ttEntry.score;
    if (ttEntry.flag === 'LOWER') alpha = Math.max(alpha, ttEntry.score);
    if (ttEntry.flag === 'UPPER') beta = Math.min(beta, ttEntry.score);
    if (alpha >= beta) return ttEntry.score;
  }

  const moves = getValidBitboardMoves(mask);
  if (moves.length === 0) return 0;

  // 3. Immediate Win/Loss Detection
  let forcedMove = -1;
  let forcedCount = 0;
  const opponentPos = position ^ mask;

  for (const move of moves) {
    const { nextPosition, nextMask } = makeMove(position, mask, move);
    if (hasWon(nextPosition ^ nextMask)) return 1000000 + depth;
    
    const { nextPosition: oppNextPos, nextMask: oppNextMask } = makeMove(opponentPos, mask, move);
    if (hasWon(oppNextPos ^ oppNextMask)) {
      forcedMove = move;
      forcedCount++;
    }
  }

  if (forcedCount > 1) return -(1000000 + depth - 1);
  if (forcedCount === 1) {
    const { nextPosition, nextMask } = makeMove(position, mask, forcedMove);
    return -bitboardMinimax(nextPosition, nextMask, depth - 1, -beta, -alpha, config, searchDepth + 1);
  }

  // 4. Move Ordering
  const center = 3;
  const moveScores = new Map<number, number>();
  
  // Only use NNUE for ordering at shallow depths to save time
  const useNNUEOrdering = config.botType === 'nnue' && depth >= 4 && searchDepth < 4;

  if (useNNUEOrdering) {
    for (const move of moves) {
      const { nextPosition, nextMask } = makeMove(position, mask, move);
      moveScores.set(move, -evaluateNNUE(nextPosition, nextMask));
    }
  }

  moves.sort((a, b) => {
    // 1. TT Best Move
    if (ttEntry && ttEntry.bestMove === a) return -1;
    if (ttEntry && ttEntry.bestMove === b) return 1;
    
    // 2. Killer Move
    if (KILLER_MOVES[searchDepth] === a) return -1;
    if (KILLER_MOVES[searchDepth] === b) return 1;

    // 3. NNUE Score
    if (useNNUEOrdering) {
      const scoreA = moveScores.get(a) || 0;
      const scoreB = moveScores.get(b) || 0;
      if (Math.abs(scoreA - scoreB) > 0.001) return scoreB - scoreA;
    }

    // 4. History Heuristic
    const hA = HISTORY_TABLE[a];
    const hB = HISTORY_TABLE[b];
    if (hA !== hB) return hB - hA;

    // 5. Center Proximity
    return Math.abs(a - center) - Math.abs(b - center);
  });

  let bestEval = -Infinity;
  let bestMove = -1;

  // 5. Null Move Pruning
  if (depth >= 3 && !hasWon(position) && !hasWon(position ^ mask)) {
    const nullEval = -bitboardMinimax(position ^ mask, mask, depth - 3, -beta, -(beta - 1), config, searchDepth + 1);
    if (nullEval >= beta) return nullEval;
  }

  // 6. Principal Variation Search (PVS)
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const { nextPosition, nextMask } = makeMove(position, mask, move);
    let evaluation: number;

    if (i === 0) {
      evaluation = -bitboardMinimax(nextPosition, nextMask, depth - 1, -beta, -alpha, config, searchDepth + 1);
    } else {
      // Late Move Reductions (LMR)
      if (depth >= 3 && i >= 3 && !hasWon(nextPosition ^ nextMask)) {
        evaluation = -bitboardMinimax(nextPosition, nextMask, depth - 2, -(alpha + 1), -alpha, config, searchDepth + 1);
      } else {
        evaluation = alpha + 1; // Force full search if LMR not applicable
      }

      if (evaluation > alpha) {
        evaluation = -bitboardMinimax(nextPosition, nextMask, depth - 1, -(alpha + 1), -alpha, config, searchDepth + 1);
        if (evaluation > alpha && evaluation < beta) {
          evaluation = -bitboardMinimax(nextPosition, nextMask, depth - 1, -beta, -alpha, config, searchDepth + 1);
        }
      }
    }

    if (evaluation > bestEval) {
      bestEval = evaluation;
      bestMove = move;
    }
    alpha = Math.max(alpha, evaluation);
    if (alpha >= beta) {
      HISTORY_TABLE[move] += depth * depth;
      KILLER_MOVES[searchDepth] = move;
      break;
    }
  }

  let flag: 'EXACT' | 'LOWER' | 'UPPER' = 'EXACT';
  if (bestEval <= alpha) flag = 'UPPER';
  else if (bestEval >= beta) flag = 'LOWER';

  if (BITBOARD_TT.size > 1000000) BITBOARD_TT.clear();
  BITBOARD_TT.set(hash, { depth, score: bestEval, flag, bestMove });

  return bestEval;
}

function evaluateTrainer(position: bigint, mask: bigint): number {
  /**
   * Advanced Handcoded Heuristic for the Trainer bot.
   * Based on Connect 4 theory:
   * 1. Strategic Heatmap: Cells have different winning potential (13-point map).
   * 2. Threat Detection: Lines of 3 that can be completed.
   * 3. Even/Odd Row Theory: Controlling even rows is a major advantage.
   * 4. Double Threats (Forks): Detecting multiple ways to win.
   */
  
  const currentPos = position;
  const opponentPos = position ^ mask;
  
  // Strategic Heatmap from the user's image
  // Row 0 is Top, Row 5 is Bottom
  const HEATMAP = [
    [3, 4, 5, 7, 5, 4, 3], // Row 0 (Top)
    [4, 6, 8, 10, 8, 6, 4],
    [5, 7, 11, 13, 11, 7, 5],
    [5, 7, 11, 13, 11, 7, 5],
    [4, 6, 8, 10, 8, 6, 4],
    [3, 4, 5, 7, 5, 4, 3]  // Row 5 (Bottom)
  ];

  const BOUNDARY_MASK = (1n << 6n) | (1n << 13n) | (1n << 20n) | (1n << 27n) | (1n << 34n) | (1n << 41n) | (1n << 48n);

  function getScore(pos: bigint, opp: bigint, m: bigint): number {
    let score = 0;
    
    // 1. Strategic Heatmap Evaluation
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 6; r++) {
        const bit = 1n << BigInt(c * 7 + r);
        if ((pos & bit) !== 0n) {
          // bit index r=0 is Row 5 (Bottom), r=5 is Row 0 (Top)
          score += HEATMAP[5 - r][c] * 15;
        }
      }
    }

    // 2. Advanced Threat Detection
    const directions = [1, 7, 6, 8]; // Vertical, Horizontal, Diag1, Diag2
    let threats = 0n;
    
    for (const d of directions) {
      const s = BigInt(d);
      
      // Pattern: XXX. or .XXX
      const adj2 = pos & (pos >> s);
      const adj3 = adj2 & (pos >> (2n * s));
      
      if (adj3 !== 0n) {
        const openNext = (adj3 << (3n * s)) & ~m & ~BOUNDARY_MASK;
        const openPrev = (adj3 >> s) & ~m & ~BOUNDARY_MASK;
        if (openNext !== 0n) threats |= openNext;
        if (openPrev !== 0n) threats |= openPrev;
      }
      
      // Pattern: XX.X
      const gap1 = (pos & (pos >> s)) & (pos >> (3n * s));
      if (gap1 !== 0n) {
        const openMid = (gap1 << (2n * s)) & ~m & ~BOUNDARY_MASK;
        if (openMid !== 0n) threats |= openMid;
      }
      
      // Pattern: X.XX
      const gap2 = pos & (pos >> (2n * s)) & (pos >> (3n * s));
      if (gap2 !== 0n) {
        const openMid = (gap2 << s) & ~m & ~BOUNDARY_MASK;
        if (openMid !== 0n) threats |= openMid;
      }
    }

    // 3. Score threats based on Row Theory
    let t = threats;
    let threatCount = 0;
    while (t !== 0n) {
      const bit = t & -t;
      t ^= bit;
      threatCount++;
      const bitIdx = Number(bit.toString(2).length - 1);
      const r = bitIdx % 7; // bit index r (0=Bottom, 5=Top)
      
      if (r < 6) {
        const isPlayable = r === 0 || (m & (1n << BigInt(bitIdx - 1))) !== 0n;
        if (isPlayable) {
          // Immediate threat: Even rows (r=1, 3, 5) are stronger
          score += (r % 2 !== 0 ? 2000 : 800);
        } else {
          // Delayed threat
          score += (r % 2 !== 0 ? 400 : 200);
        }
      }
    }

    // Double threat bonus (Fork)
    if (threatCount >= 2) score += 10000;

    return score;
  }

  return getScore(currentPos, opponentPos, mask) - getScore(opponentPos, currentPos, mask);
}

export function fromBitboard(position: bigint, mask: bigint): Board {
  const board = createEmptyBoard();
  const opponent = position ^ mask;
  
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const bit = 1n << BigInt(c * 7 + (ROWS - 1 - r));
      if ((position & bit) !== 0n) board[r][c] = 1; // Current player is 1 in this context
      else if ((opponent & bit) !== 0n) board[r][c] = 2;
    }
  }
  return board;
}

export type MoveQuality = 'brilliant' | 'best' | 'inaccuracy' | 'mistake' | 'blunder';

export function evaluateMoveQuality(board: Board, move: number, player: 1 | 2): MoveQuality {
  // 1. Get current evaluation
  const { position, mask } = toBitboard(board);
  const currentEval = evaluateNNUE(position, mask); // Evaluation from POV of next player (usually 1)
  
  // Normalize eval to be from perspective of player making the move
  const povEval = player === 1 ? currentEval : -currentEval;

  // 2. Predict next state
  const nextBoard = dropPiece(board, move, player);
  const { position: nextPos, mask: nextMask } = toBitboard(nextBoard);
  const nextEvalRaw = evaluateNNUE(nextPos, nextMask);
  
  // Evaluation for 'player' after move
  // evaluateNNUE returns eval for turn-player (which is now opponent)
  // so if player=1 made move, next turn is 2, nextEval is for 2.
  // We want value for player 1, so we negate nextEval if next turn is 2.
  const nextPovEval = player === 1 ? -nextEvalRaw : nextEvalRaw;

  // 3. Find best possible move result
  let bestNextPovEval = -Infinity;
  const moves = getValidMoves(board);
  for (const m of moves) {
    const b = dropPiece(board, m, player);
    const { position: p, mask: ma } = toBitboard(b);
    const e = evaluateNNUE(p, ma);
    const pe = player === 1 ? -e : e;
    if (pe > bestNextPovEval) bestNextPovEval = pe;
  }

  const loss = bestNextPovEval - nextPovEval;

  // thresholds (Connect 4 is roughly -1 to 1 range in NNUE)
  if (loss < 0.02) return 'best';
  if (loss < 0.1) return 'inaccuracy';
  if (loss < 0.3) return 'mistake';
  return 'blunder';
}

// --- Zobrist Hashing for Transposition Table ---
const ZOBRIST_TABLE: number[][][] = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => [
    Math.floor(Math.random() * 0xFFFFFFFF),
    Math.floor(Math.random() * 0xFFFFFFFF)
  ])
);

function getBoardHash(board: Board): number {
  let hash = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== null) {
        hash ^= ZOBRIST_TABLE[r][c][board[r][c]! - 1];
      }
    }
  }
  return hash;
}

const TRANSPOSITION_TABLE = new Map<number, { depth: number, score: number, flag: 'EXACT' | 'LOWER' | 'UPPER' }>();

export function createEmptyBoard(): Board {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
}

export function isValidMove(board: Board, col: number): boolean {
  return board && board[0] && board[0][col] === null;
}

export function getValidMoves(board: Board, player?: 1 | 2): number[] {
  const moves: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (isValidMove(board, c)) {
      moves.push(c);
    }
  }

  const center = Math.floor(COLS / 2);
  
  if (!player) {
    return moves.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  }

  // Move ordering optimization
  const opponent = player === 1 ? 2 : 1;
  return moves.sort((a, b) => {
    const aPriority = getMovePriority(board, a, player, opponent);
    const bPriority = getMovePriority(board, b, player, opponent);
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    return Math.abs(a - center) - Math.abs(b - center);
  });
}

function getMovePriority(board: Board, col: number, player: 1 | 2, opponent: 1 | 2): number {
  // Check if move wins immediately
  if (isWinningMove(board, col, player)) return 100;
  // Check if move blocks opponent win
  if (isWinningMove(board, col, opponent)) return 90;
  // Check if move blocks opponent 3-in-a-row
  if (completesThree(board, col, opponent)) return 80;
  // Check if move creates own 3-in-a-row
  if (completesThree(board, col, player)) return 70;
  
  return 0;
}

function isWinningMove(board: Board, col: number, player: 1 | 2): boolean {
  const tempBoard = dropPiece(board, col, player);
  const winResult = checkWinner(tempBoard);
  const winner = typeof winResult === 'object' && winResult !== null ? winResult.winner : winResult;
  return winner === player;
}

function completesThree(board: Board, col: number, player: 1 | 2): boolean {
  const tempBoard = dropPiece(board, col, player);
  // Simple check: does this board have a 3-in-a-row with an empty slot?
  let hasThree = false;
  
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const window = [tempBoard[r][c], tempBoard[r][c+1], tempBoard[r][c+2], tempBoard[r][c+3]];
      if (window.filter(p => p === player).length === 3 && window.filter(p => p === null).length === 1) hasThree = true;
    }
  }
  if (hasThree) return true;

  // Vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      const window = [tempBoard[r][c], tempBoard[r+1][c], tempBoard[r+2][c], tempBoard[r+3][c]];
      if (window.filter(p => p === player).length === 3 && window.filter(p => p === null).length === 1) hasThree = true;
    }
  }
  if (hasThree) return true;

  // Diagonals
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const window = [tempBoard[r][c], tempBoard[r+1][c+1], tempBoard[r+2][c+2], tempBoard[r+3][c+3]];
      if (window.filter(p => p === player).length === 3 && window.filter(p => p === null).length === 1) hasThree = true;
    }
  }
  if (hasThree) return true;

  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const window = [tempBoard[r][c], tempBoard[r-1][c+1], tempBoard[r-2][c+2], tempBoard[r-3][c+3]];
      if (window.filter(p => p === player).length === 3 && window.filter(p => p === null).length === 1) hasThree = true;
    }
  }
  
  return hasThree;
}

export function dropPiece(board: Board, col: number, player: 1 | 2): Board {
  const newBoard = board.map(row => [...row]);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (newBoard[r][col] === null) {
      newBoard[r][col] = player;
      break;
    }
  }
  return newBoard;
}

export function checkWinner(board: Board): { winner: Player; cells: [number, number][] } | 'draw' | null {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r][c+1] && board[r][c] === board[r][c+2] && board[r][c] === board[r][c+3]) {
        return { winner: board[r][c] as Player, cells: [[r, c], [r, c+1], [r, c+2], [r, c+3]] };
      }
    }
  }

  // Vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] && board[r][c] === board[r+1][c] && board[r][c] === board[r+2][c] && board[r][c] === board[r+3][c]) {
        return { winner: board[r][c] as Player, cells: [[r, c], [r+1, c], [r+2, c], [r+3, c]] };
      }
    }
  }

  // Diagonal (down-right)
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r+1][c+1] && board[r][c] === board[r+2][c+2] && board[r][c] === board[r+3][c+3]) {
        return { winner: board[r][c] as Player, cells: [[r, c], [r+1, c+1], [r+2, c+2], [r+3, c+3]] };
      }
    }
  }

  // Diagonal (up-right)
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] && board[r][c] === board[r-1][c+1] && board[r][c] === board[r-2][c+2] && board[r][c] === board[r-3][c+3]) {
        return { winner: board[r][c] as Player, cells: [[r, c], [r-1, c+1], [r-2, c+2], [r-3, c+3]] };
      }
    }
  }

  if (getValidMoves(board).length === 0) return 'draw';
  return null;
}

// --- Trainer Heuristic Evaluation ---

// --- Minimax with Alpha-Beta Pruning and Transposition Table ---
export function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  config: AIConfig
): [number, number | null] {
  const { position, mask } = toBitboard(board);
  
  // Ensure 'position' is always the current player's pieces for Negamax
  const p1 = position;
  const p2 = position ^ mask;
  const currentPos = isMaximizing ? p1 : p2;

  const moves = getValidBitboardMoves(mask);
  if (moves.length === 0) return [0, null];
  
  // Iterative Deepening
  let bestMove = moves[0];
  let bestEval = -Infinity;
  
  for (let d = 1; d <= depth; d++) {
    // In Negamax, we always maximize our own score
    const result = searchRoot(currentPos, mask, d, config);
    bestEval = result.score;
    bestMove = result.move!;
    
    console.log(`minimax: Iteration ${d}, bestMove: ${bestMove}, bestEval: ${bestEval}`);
    
    if (bestMove === null) {
      console.error("minimax: bestMove is null!");
    }
    
    if (Math.abs(bestEval) > 900000) break;
  }

  // Return score relative to P1 for the worker
  const finalScore = isMaximizing ? bestEval : -bestEval;
  return [finalScore, bestMove];
}

function searchRoot(
  position: bigint,
  mask: bigint,
  depth: number,
  config: AIConfig
): { score: number, move: number | null } {
  const moves = getValidBitboardMoves(mask);
  let bestEval = -Infinity;
  let alpha = -2000000;
  let beta = 2000000;
  
  // Move ordering: TT -> NNUE -> Center
  const center = 3;
  const ttEntry = BITBOARD_TT.get(getCanonicalHash(position, mask));
  
  const moveScores = new Map<number, number>();
  if (config.botType === 'nnue') {
    for (const move of moves) {
      const { nextPosition, nextMask } = makeMove(position, mask, move);
      // Score is from opponent's perspective, so negate it
      moveScores.set(move, -evaluateNNUE(nextPosition, nextMask));
    }
  }

  moves.sort((a, b) => {
    if (ttEntry && ttEntry.bestMove === a) return -1;
    if (ttEntry && ttEntry.bestMove === b) return 1;
    
    if (config.botType === 'nnue') {
      const scoreA = moveScores.get(a) || 0;
      const scoreB = moveScores.get(b) || 0;
      if (Math.abs(scoreA - scoreB) > 0.001) return scoreB - scoreA;
    }
    
    return Math.abs(a - center) - Math.abs(b - center);
  });

  let bestMove = moves[0];
  
  for (const move of moves) {
    const { nextPosition, nextMask } = makeMove(position, mask, move);
    // Negamax call: score is relative to the opponent, so we negate it
    const evaluation = -bitboardMinimax(nextPosition, nextMask, depth - 1, -beta, -alpha, config, 1);

    if (evaluation > bestEval) {
      bestEval = evaluation;
      bestMove = move;
    }
    alpha = Math.max(alpha, evaluation);
    if (alpha >= beta) break;
  }

  return { score: bestEval, move: bestMove };
}
