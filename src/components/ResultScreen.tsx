import React from 'react';
import { Player } from '../types';

interface ResultScreenProps {
  players: Player[];
  totalRounds: number;
  setGameState: (state: 'setup' | 'playing' | 'result') => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ players, totalRounds, setGameState }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md text-center">
      <span className="text-6xl mb-4 block">🏆</span>
      <h1 className="text-3xl font-bold text-amber-400 mb-2 font-serif">Fim de Jogo!</h1>
      <p className="text-slate-300 mb-6">O desafio de {totalRounds} cartas foi concluído.</p>
      
      <div className="bg-slate-700 rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-600 pb-2">Placar Final</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg ${i === 0 ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-slate-800'}`}>
              <span className="font-bold flex items-center gap-2">
                {i === 0 ? '👑' : <span className="text-slate-500 w-5">{i+1}º</span>}
                {p.name}
              </span>
              <span className="font-mono text-amber-400 font-bold">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => setGameState('setup')}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-lg py-4 rounded-xl transition-transform active:scale-95 shadow-lg"
      >
        Jogar Novamente
      </button>
    </div>
  );
};
