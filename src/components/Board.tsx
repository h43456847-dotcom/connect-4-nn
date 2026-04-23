/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Brain, Star, Check, AlertTriangle, HelpCircle, XCircle } from 'lucide-react';
import { Board as BoardType, Player, ROWS, COLS } from '../types';

export type MoveQuality = 'brilliant' | 'best' | 'inaccuracy' | 'mistake' | 'blunder';

interface BoardProps {
  board: BoardType;
  onColumnClick: (col: number) => void;
  disabled: boolean;
  winningCells?: [number, number][];
  lastMove?: { row: number, col: number, quality?: MoveQuality };
  coachMessage?: string;
}

export default function Board({ board, onColumnClick, disabled, winningCells, lastMove, coachMessage }: BoardProps) {
  const getQualityIcon = (quality: MoveQuality) => {
    switch (quality) {
      case 'brilliant': return <Star size={16} className="text-blue-400 fill-blue-400" />;
      case 'best': return <Check size={16} className="text-emerald-500" />;
      case 'inaccuracy': return <HelpCircle size={16} className="text-yellow-500" />;
      case 'mistake': return <AlertTriangle size={16} className="text-orange-500" />;
      case 'blunder': return <XCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const getQualityLabel = (quality: MoveQuality) => {
    switch (quality) {
      case 'brilliant': return 'BRILLIANT';
      case 'best': return 'BEST';
      case 'inaccuracy': return 'INACCURACY';
      case 'mistake': return 'MISTAKE';
      case 'blunder': return 'BLUNDER';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full items-center justify-center">
      <div className="relative bg-[#1a1a1a] p-5 md:p-8 rounded-[1.5rem] border border-white/10 shadow-2xl w-full max-w-3xl aspect-[7/6] group/board overflow-hidden pointer-events-auto">
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] pointer-events-none" />
        
        {/* Board Grid */}
        <div className="grid grid-cols-7 h-full w-full relative z-10 pointer-events-auto">
          {Array.from({ length: COLS }).map((_, colIndex) => (
            <div
              key={colIndex}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) {
                  onColumnClick(colIndex);
                }
              }}
              className={`flex flex-col px-1.5 md:px-2 py-2 cursor-pointer group h-full transition-all ${disabled ? 'cursor-not-allowed opacity-80' : 'hover:bg-white/[0.04] active:bg-white/[0.08]'}`}
            >
              <div className="flex-1 flex flex-col gap-2 md:gap-3">
                {Array.from({ length: ROWS }).map((_, rowIndex) => {
                  const cell = board[rowIndex][colIndex];
                  const isWinning = winningCells?.some(([r, c]) => r === rowIndex && c === colIndex);

                  return (
                    <div
                      key={rowIndex}
                      className="flex-1 aspect-square rounded-full bg-[#121212] border border-white/5 flex items-center justify-center relative shadow-inner transition-transform group-hover:scale-[1.02] duration-200"
                    >
                      <AnimatePresence>
                        {cell && (
                          <motion.div
                            initial={{ y: -600, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`w-[90%] h-[90%] rounded-full shadow-2xl relative ${
                              cell === 1 
                                ? 'bg-[#ff3d44] shadow-[0_0_30px_rgba(255,61,68,0.4)]' 
                                : 'bg-[#ffc812] shadow-[0_0_30px_rgba(255,200,18,0.4)]'
                            } ${isWinning ? 'ring-4 ring-white animate-pulse z-20' : ''}`}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coach Bubble */}
      <AnimatePresence>
        {coachMessage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-72 bg-[#111] border border-white/10 rounded-3xl p-6 relative shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                <Brain size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Coach AI</span>
                <span className="text-[8px] font-mono uppercase text-white/40">Real-time Analysis</span>
              </div>
            </div>
            
            <p className="text-sm text-white/80 leading-relaxed font-medium italic">
              "{coachMessage}"
            </p>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-red-500/30 rounded-full" />)}
              </div>
              <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest leading-none">NNUE v2.4.1</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
