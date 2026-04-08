import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { GameState, DisputaUser } from '../types';
import { LoadingAnimation } from './LoadingAnimation';

interface RankingScreenProps {
  setGameState: (state: GameState) => void;
  disputaUser?: DisputaUser | null;
  onChallenge?: (targetId: string, targetName: string) => void;
}

interface RankingPlayer {
  id: string;
  name: string;
  score: number;
}

export const RankingScreen: React.FC<RankingScreenProps> = ({ setGameState, disputaUser, onChallenge }) => {
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const q = query(
          collection(db, 'disputa_players'),
          orderBy('score', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const rankingData: RankingPlayer[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          rankingData.push({
            id: doc.id,
            name: data.name,
            score: data.score || 0
          });
        });
        setPlayers(rankingData);
      } catch (err: any) {
        console.error(err);
        setError('Erro ao carregar o ranking. Verifique as regras do Firebase.');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-md border border-slate-700/50 flex flex-col h-[85vh] relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="text-center mb-6 relative z-10">
        <span className="text-5xl block mb-3 drop-shadow-md">🌍</span>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 font-display tracking-tight">Ranking Global</h2>
        <p className="text-slate-400 text-sm mt-1 font-medium">Os melhores jogadores do Modo Disputa</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 relative z-10">
        {loading ? (
          <LoadingAnimation message="Carregando ranking..." />
        ) : error ? (
          <div className="text-center text-red-400 py-10 text-sm bg-red-900/20 rounded-xl border border-red-500/30">
            {error}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center text-slate-400 py-10 bg-slate-900/40 rounded-xl border border-slate-700/50">
            Nenhum jogador no ranking ainda. Seja o primeiro!
          </div>
        ) : (
          players.map((p, i) => {
            let badge = `${i + 1}º`;
            let bgClass = 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600';
            let textClass = 'text-white';
            
            if (i === 0) {
              badge = '💎'; // Diamante
              bgClass = 'bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-cyan-500/50 hover:from-cyan-800/50 hover:to-blue-800/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
              textClass = 'text-cyan-300';
            } else if (i === 1) {
              badge = '🥇'; // Ouro
              bgClass = 'bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-yellow-500/50 hover:from-yellow-800/50 hover:to-amber-800/50 hover:border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]';
              textClass = 'text-yellow-300';
            } else if (i === 2) {
              badge = '🥈'; // Prata
              bgClass = 'bg-gradient-to-r from-slate-700/60 to-slate-800/60 border-slate-400/50 hover:from-slate-600/60 hover:to-slate-700/60 hover:border-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.1)]';
              textClass = 'text-slate-200';
            } else if (i <= 9) {
              badge = '🥉'; // Bronze
              bgClass = 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-700/40 hover:from-orange-800/30 hover:to-red-800/30 hover:border-orange-500';
              textClass = 'text-orange-300';
            }

            return (
              <div 
                key={p.id} 
                onClick={() => setSelectedPlayer(p)}
                className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 ${bgClass}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-slate-500 w-8 text-center drop-shadow-sm">
                    {badge}
                  </span>
                  <span className={`font-bold text-lg tracking-wide ${textClass}`}>
                    {p.name}
                  </span>
                </div>
                <span className="font-mono text-primary-400 font-bold bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-inner">
                  {p.score} pts
                </span>
              </div>
            );
          })
        )}
      </div>

      {selectedPlayer && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-sm text-center border border-slate-600/50 transform transition-all scale-100">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4 border-4 border-slate-800">
              {selectedPlayer.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-1 font-display">{selectedPlayer.name}</h2>
            <p className="text-primary-400 font-mono text-xl mb-8 font-medium bg-slate-900/50 inline-block px-4 py-1 rounded-full border border-primary-500/20">{selectedPlayer.score} pts</p>
            
            {disputaUser && disputaUser.id !== selectedPlayer.id && onChallenge ? (
              <button 
                onClick={() => {
                  onChallenge(selectedPlayer.id, selectedPlayer.name);
                  setSelectedPlayer(null);
                }}
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95 mb-3 flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 border border-red-400/30 text-lg"
              >
                <span className="text-2xl">⚔️</span> Desafiar
              </button>
            ) : null}
            
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 border border-slate-500/30"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-slate-700/50 relative z-10">
        <button
          onClick={() => setGameState('home')}
          className="w-full bg-slate-700/80 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 border border-slate-500/30 shadow-sm"
        >
          Voltar para Home
        </button>
      </div>
    </div>
  );
};
