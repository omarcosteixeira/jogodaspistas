import React from 'react';
import { Difficulty, GameState } from '../types';
import { cardDatabase } from '../data';

interface SetupScreenProps {
  numPlayers: number;
  setNumPlayers: (num: number) => void;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  gameMode: string;
  setGameMode: (mode: string) => void;
  playerNames: string[];
  setPlayerNames: (names: string[]) => void;
  startGame: () => void;
  uniqueCategories: string[];
  appLogo: string;
  setGameState: (state: GameState) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  numPlayers,
  setNumPlayers,
  difficulty,
  setDifficulty,
  gameMode,
  setGameMode,
  playerNames,
  setPlayerNames,
  startGame,
  uniqueCategories,
  appLogo,
  setGameState
}) => {
  return (
    <div className="bg-slate-800/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-md border border-slate-700/50 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center mb-8 relative z-10">
        <button 
          onClick={() => setGameState('home')}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50"
        >
          <span>←</span> Voltar
        </button>
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 font-display tracking-tight">Jogar em Grupo</h2>
      </div>

      <div className="flex justify-center mb-8 relative z-10">
        <img 
          src={appLogo} 
          alt="Logótipo Jogo das Pistas Gospel" 
          className="w-40 h-auto rounded-2xl drop-shadow-[0_10px_25px_rgba(245,158,11,0.25)] transition-transform duration-500 hover:scale-105"
        />
      </div>

      <div className="mb-6 bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 shadow-inner relative z-10">
        <label className="flex justify-between items-center text-slate-300 mb-3 font-medium">
          Quantidade de Jogadores: 
          <span className="font-bold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-lg border border-primary-500/20">{numPlayers}</span>
        </label>
        <input 
          type="range" 
          min="1" max="8" 
          value={numPlayers} 
          onChange={(e) => setNumPlayers(parseInt(e.target.value))}
          className="w-full accent-primary-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-6 bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 shadow-inner relative z-10">
        <label className="block text-slate-300 mb-3 font-medium">Nível de Dificuldade:</label>
        <select 
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="w-full bg-slate-800 text-white border border-slate-600 rounded-xl p-3.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all cursor-pointer shadow-sm"
        >
          <option value="easy">🟢 Fácil (45 seg por dica)</option>
          <option value="medium">🟡 Médio (30 seg por dica)</option>
          <option value="hard">🔴 Difícil (15 seg por dica)</option>
        </select>
      </div>

      <div className="mb-6 bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 shadow-inner relative z-10">
        <label className="block text-slate-300 mb-3 font-medium">Modo de Jogo (Categoria):</label>
        <select 
          value={gameMode}
          onChange={(e) => setGameMode(e.target.value)}
          className="w-full bg-slate-800 text-white border border-slate-600 rounded-xl p-3.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all cursor-pointer shadow-sm"
        >
          <option value="mixed">🔀 Mesclado (Todas as Categorias)</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>📚 Apenas {cat}</option>
          ))}
        </select>
        
        {gameMode !== 'mixed' && Math.floor(cardDatabase.filter(c => c.category === gameMode).length / numPlayers) < 6 && (
          <p className="text-xs text-primary-300 mt-3 bg-primary-900/30 p-3 rounded-xl border border-primary-500/30 flex items-start gap-2">
            <span className="text-lg leading-none">⚠️</span>
            <span>Aviso: O jogo terá um limite de {Math.floor(cardDatabase.filter(c => c.category === gameMode).length / numPlayers)} rodada(s) para {numPlayers} jogador(es) devido à quantidade de cartas desta categoria.</span>
          </p>
        )}
      </div>

      <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {playerNames.map((name, index) => (
          <div key={index} className="flex flex-col">
            <input 
              type="text" 
              value={name}
              onChange={(e) => {
                const newNames = [...playerNames];
                newNames[index] = e.target.value;
                setPlayerNames(newNames);
              }}
              className="bg-slate-900/50 text-white border border-slate-600 rounded-xl p-4 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-inner"
              placeholder={`Nome do Jogador ${index + 1}`}
              maxLength={15}
            />
          </div>
        ))}
      </div>

      <button 
        onClick={startGame}
        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold text-lg py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-900/30 relative z-10"
      >
        Começar Jogo
      </button>
    </div>
  );
};
