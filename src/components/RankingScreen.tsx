import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { GameState, DisputaUser } from '../types';

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
    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border-2 border-primary-500 flex flex-col h-[80vh]">
      <div className="text-center mb-6">
        <span className="text-5xl block mb-2">🌍</span>
        <h2 className="text-2xl font-bold text-primary-400 font-serif">Ranking Global</h2>
        <p className="text-slate-400 text-sm">Os melhores jogadores do Modo Disputa</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
        {loading ? (
          <div className="text-center text-slate-400 py-10 animate-pulse">
            Carregando ranking...
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10 text-sm">
            {error}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            Nenhum jogador no ranking ainda. Seja o primeiro!
          </div>
        ) : (
          players.map((p, i) => {
            let badge = `${i + 1}º`;
            let bgClass = 'bg-slate-800 border-slate-700';
            
            if (i === 0) {
              badge = '💎'; // Diamante
              bgClass = 'bg-cyan-900/30 border-cyan-500/50';
            } else if (i === 1) {
              badge = '🥇'; // Ouro
              bgClass = 'bg-yellow-900/30 border-yellow-500/50';
            } else if (i === 2) {
              badge = '🥈'; // Prata
              bgClass = 'bg-slate-700 border-slate-400/50';
            } else if (i <= 9) {
              badge = '🥉'; // Bronze
              bgClass = 'bg-orange-900/20 border-orange-700/30';
            }

            return (
              <div 
                key={p.id} 
                onClick={() => setSelectedPlayer(p)}
                className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition-transform ${bgClass}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-slate-500 w-6 text-center">
                    {badge}
                  </span>
                  <span className={`font-bold ${i === 0 ? 'text-cyan-400' : i === 1 ? 'text-yellow-400' : 'text-white'}`}>
                    {p.name}
                  </span>
                </div>
                <span className="font-mono text-primary-400 font-bold bg-slate-900 px-3 py-1 rounded-lg">
                  {p.score} pts
                </span>
              </div>
            );
          })
        )}
      </div>

      {selectedPlayer && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-sm text-center border-2 border-primary-500">
            <h2 className="text-2xl font-bold text-white mb-2">{selectedPlayer.name}</h2>
            <p className="text-primary-400 font-mono mb-6">{selectedPlayer.score} pts</p>
            
            {disputaUser && disputaUser.id !== selectedPlayer.id && onChallenge ? (
              <button 
                onClick={() => {
                  onChallenge(selectedPlayer.id, selectedPlayer.name);
                  setSelectedPlayer(null);
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-transform active:scale-95 mb-3 flex items-center justify-center gap-2"
              >
                <span>⚔️</span> Desafiar
              </button>
            ) : null}
            
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-transform active:scale-95"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-700">
        <button
          onClick={() => setGameState('setup')}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all"
        >
          Voltar
        </button>
      </div>
    </div>
  );
};
