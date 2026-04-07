import React from 'react';
import { GameState, DisputaUser } from '../types';

interface HomeScreenProps {
  setGameState: (state: GameState) => void;
  appLogo: string;
  disputaUser?: DisputaUser | null;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ setGameState, appLogo, disputaUser }) => {
  const shareReferral = () => {
    if (!disputaUser) return;
    const url = `${window.location.origin}?ref=${disputaUser.name}`;
    navigator.clipboard.writeText(url);
    alert('Link de convite copiado! Compartilhe com seus amigos para ganhar estrelas.');
  };

  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-2xl text-center border-t-4 border-primary-500">
      <div className="flex justify-center mb-6">
        <img 
          src={appLogo} 
          alt="Logótipo Jogo das Pistas Gospel" 
          className="w-48 h-auto rounded-xl drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-transform hover:scale-105"
        />
      </div>

      <h1 className="text-4xl font-bold text-primary-400 mb-4 font-serif">
        Bem-vindo ao Jogo das Pistas!
      </h1>
      
      {disputaUser && (
        <div className="mb-6 bg-slate-900/50 border border-primary-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-sm text-slate-400">Logado como:</p>
            <p className="text-xl font-bold text-white">{disputaUser.name}</p>
            <p className="text-sm text-primary-400 font-mono">{disputaUser.score} pts</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg font-bold border border-yellow-500/30 flex items-center justify-center gap-2">
              <span>⭐</span> {disputaUser.stars || 0} Estrelas
            </div>
            <button 
              onClick={shareReferral}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg transition-colors"
            >
              Convidar Amigo (+1 ⭐)
            </button>
          </div>
        </div>
      )}

      <div className="text-slate-300 mb-8 space-y-4 text-left bg-slate-900/50 p-6 rounded-xl border border-slate-700">
        <p>
          Uma nova e divertida maneira de aprender mais sobre a Bíblia! Jogue sozinho no <strong>Modo Disputa</strong> para testar seus conhecimentos e subir no Ranking Global, ou reúna amigos e família para <strong>Jogar em Grupo</strong>.
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-slate-400">
          <li><strong className="text-primary-400">Modo Disputa:</strong> Partidas rápidas de 6 cartas aleatórias. Acertar rápido reduz seu tempo de espera para a próxima partida! Ganhe estrelas e desafie outros jogadores.</li>
          <li><strong className="text-primary-400">Jogar em Grupo:</strong> Escolha a categoria, a dificuldade e a quantidade de jogadores para uma partida local.</li>
          <li><strong className="text-primary-400">Dica de Ouro:</strong> Quanto menos dicas você usar para acertar, mais pontos você ganha!</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setGameState('disputaLogin')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-4 rounded-xl transition-transform active:scale-95 shadow-lg flex flex-col items-center justify-center gap-2 border border-indigo-400/30"
        >
          <span className="text-3xl">🏆</span> 
          <span>{disputaUser ? 'Continuar Disputa' : 'Modo Disputa'}</span>
        </button>
        
        <button 
          onClick={() => setGameState('setup')}
          className="bg-primary-600 hover:bg-primary-500 text-slate-900 font-bold py-4 px-4 rounded-xl transition-transform active:scale-95 shadow-lg flex flex-col items-center justify-center gap-2 border border-primary-400/30"
        >
          <span className="text-3xl">👥</span> 
          <span>Jogar em Grupo</span>
        </button>

        <button 
          onClick={() => setGameState('ranking')}
          className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-4 rounded-xl transition-transform active:scale-95 shadow-lg flex flex-col items-center justify-center gap-2 border border-slate-500/30"
        >
          <span className="text-3xl">🌍</span> 
          <span>Ranking Global</span>
        </button>
      </div>
    </div>
  );
};
