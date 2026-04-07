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
    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => setGameState('home')}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <span>←</span> Voltar
        </button>
        <h2 className="text-2xl font-bold text-primary-400 font-serif">Jogar em Grupo</h2>
      </div>

      <div className="flex justify-center mb-6">
        <img 
          src={appLogo} 
          alt="Logótipo Jogo das Pistas Gospel" 
          className="w-48 h-auto rounded-xl drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-transform hover:scale-105"
        />
      </div>

      <div className="mb-6">
        <label className="block text-slate-300 mb-2 font-medium">Quantidade de Jogadores: <span className="font-bold text-primary-400">{numPlayers}</span></label>
        <input 
          type="range" 
          min="1" max="8" 
          value={numPlayers} 
          onChange={(e) => setNumPlayers(parseInt(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-slate-300 mb-2 font-medium">Nível de Dificuldade:</label>
        <select 
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-3 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all cursor-pointer"
        >
          <option value="easy">🟢 Fácil (45 seg por dica)</option>
          <option value="medium">🟡 Médio (30 seg por dica)</option>
          <option value="hard">🔴 Difícil (15 seg por dica)</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-slate-300 mb-2 font-medium">Modo de Jogo (Categoria):</label>
        <select 
          value={gameMode}
          onChange={(e) => setGameMode(e.target.value)}
          className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-3 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all cursor-pointer"
        >
          <option value="mixed">🔀 Mesclado (Todas as Categorias)</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>📚 Apenas {cat}</option>
          ))}
        </select>
        
        {gameMode !== 'mixed' && Math.floor(cardDatabase.filter(c => c.category === gameMode).length / numPlayers) < 6 && (
          <p className="text-xs text-primary-400 mt-2 bg-primary-900/30 p-2 rounded border border-primary-900/50">
            Aviso: O jogo terá um limite de {Math.floor(cardDatabase.filter(c => c.category === gameMode).length / numPlayers)} rodada(s) para {numPlayers} jogador(es) devido à quantidade de cartas desta categoria.
          </p>
        )}
      </div>

      <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
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
              className="bg-slate-700 text-white border border-slate-600 rounded-lg p-3 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
              placeholder={`Nome do Jogador ${index + 1}`}
              maxLength={15}
            />
          </div>
        ))}
      </div>

      <button 
        onClick={startGame}
        className="w-full bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold text-lg py-4 rounded-xl transition-transform active:scale-95 shadow-lg"
      >
        Começar Jogo
      </button>
    </div>
  );
};
