import React, { useEffect, useState } from 'react';
import { Player, GameState, DisputaUser, ActiveChallenge } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';

interface ResultScreenProps {
  players: Player[];
  totalRounds: number;
  setGameState: (state: GameState) => void;
  disputaUser?: DisputaUser | null;
  activeChallenge?: ActiveChallenge | null;
  setActiveChallenge?: (challenge: ActiveChallenge | null) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ players, totalRounds, setGameState, disputaUser, activeChallenge, setActiveChallenge }) => {
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [cooldownMinutes, setCooldownMinutes] = useState(10);

  useEffect(() => {
    const saveScore = async () => {
      if (disputaUser && players.length > 0 && !scoreSaved) {
        setSavingScore(true);
        try {
          const player = players[0];
          const pointsEarned = player.score;
          
          // Calculate cooldown
          let newCooldownMinutes = 10;
          const cluesGuessedAt = player.cluesGuessedAt || [];
          
          const firstClueGuesses = cluesGuessedAt.filter(c => c === 0).length;
          const secondClueGuesses = cluesGuessedAt.filter(c => c <= 1).length;
          const thirdClueGuesses = cluesGuessedAt.filter(c => c <= 2).length;

          if (firstClueGuesses >= 5) {
            newCooldownMinutes = 0;
          } else if (secondClueGuesses >= 4) {
            newCooldownMinutes = 1;
          } else if (thirdClueGuesses >= 3) {
            newCooldownMinutes = 5;
          }

          setCooldownMinutes(newCooldownMinutes);

          if (pointsEarned > 0 || newCooldownMinutes < 10) {
            const docRef = doc(db, 'disputa_players', disputaUser.id);
            const updates: any = {};
            if (pointsEarned > 0) updates.score = increment(pointsEarned);
            
            if (newCooldownMinutes > 0) {
              updates.cooldownUntil = Date.now() + newCooldownMinutes * 60 * 1000;
            } else {
              updates.cooldownUntil = 0;
            }
            
            await updateDoc(docRef, updates);
          }

          // Handle Challenge Logic
          if (activeChallenge) {
            if (activeChallenge.type === 'issuing' && activeChallenge.targetId && activeChallenge.targetName) {
              await addDoc(collection(db, 'challenges'), {
                challengerId: disputaUser.id,
                challengerName: disputaUser.name,
                challengedId: activeChallenge.targetId,
                challengedName: activeChallenge.targetName,
                challengerFirstClueCount: firstClueGuesses,
                status: 'pending',
                createdAt: Date.now()
              });
            } else if (activeChallenge.type === 'responding' && activeChallenge.challengeId) {
              const challengeRef = doc(db, 'challenges', activeChallenge.challengeId);
              const challengerScore = activeChallenge.challengerFirstClueCount || 0;
              const challengedScore = firstClueGuesses;
              
              await updateDoc(challengeRef, {
                challengedFirstClueCount: challengedScore,
                status: 'completed'
              });

              // Award stars
              if (challengedScore > challengerScore) {
                // Challenged wins
                const docRef = doc(db, 'disputa_players', disputaUser.id);
                await updateDoc(docRef, { stars: increment(challengedScore) });
              } else if (challengerScore > challengedScore && activeChallenge.challengerId) {
                // Challenger wins
                const challengerRef = doc(db, 'disputa_players', activeChallenge.challengerId);
                await updateDoc(challengerRef, { stars: increment(challengerScore) });
              }
            }
            if (setActiveChallenge) setActiveChallenge(null);
          }

          setScoreSaved(true);
        } catch (error) {
          console.error("Error saving score:", error);
        } finally {
          setSavingScore(false);
        }
      }
    };

    saveScore();
  }, [disputaUser, players, scoreSaved]);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md text-center">
      <span className="text-6xl mb-4 block">🏆</span>
      <h1 className="text-3xl font-bold text-primary-400 mb-2 font-serif">Fim de Jogo!</h1>
      <p className="text-slate-300 mb-6">O desafio de {totalRounds} cartas foi concluído.</p>
      
      {disputaUser && (
        <div className="mb-6 bg-indigo-900/30 border border-indigo-500/50 p-4 rounded-xl">
          <p className="text-indigo-300 text-sm mb-1">Modo Disputa</p>
          <p className="text-white font-bold text-lg">Pontos ganhos: <span className="text-primary-400">+{players[0].score}</span></p>
          
          {activeChallenge && activeChallenge.type === 'issuing' && (
            <div className="mt-3 pt-3 border-t border-indigo-500/30">
              <p className="text-sm text-slate-300">
                Desafio enviado para <strong className="text-primary-400">{activeChallenge.targetName}</strong>!
              </p>
              <p className="text-xs text-slate-400 mt-1">Aguarde até que ele responda.</p>
            </div>
          )}

          {activeChallenge && activeChallenge.type === 'responding' && (
            <div className="mt-3 pt-3 border-t border-indigo-500/30">
              <p className="text-sm text-slate-300">Resultado do Desafio:</p>
              <p className="text-white">Você acertou <strong className="text-primary-400">{players[0].cluesGuessedAt?.filter(c => c === 0).length || 0}</strong> na primeira dica.</p>
              <p className="text-white">Oponente acertou <strong className="text-primary-400">{activeChallenge.challengerFirstClueCount}</strong>.</p>
              {((players[0].cluesGuessedAt?.filter(c => c === 0).length || 0) > (activeChallenge.challengerFirstClueCount || 0)) ? (
                <p className="text-green-400 font-bold mt-2">Você venceu e ganhou estrelas! ⭐</p>
              ) : ((players[0].cluesGuessedAt?.filter(c => c === 0).length || 0) < (activeChallenge.challengerFirstClueCount || 0)) ? (
                <p className="text-red-400 font-bold mt-2">Você perdeu o desafio.</p>
              ) : (
                <p className="text-yellow-400 font-bold mt-2">Empate!</p>
              )}
            </div>
          )}

          {scoreSaved && (
            <div className="mt-3 pt-3 border-t border-indigo-500/30">
              <p className="text-sm text-slate-300">
                Tempo de espera para próxima partida:
              </p>
              <p className="text-xl font-bold text-indigo-400">
                {cooldownMinutes === 0 ? 'Jogue agora!' : `${cooldownMinutes} minutos`}
              </p>
            </div>
          )}

          {savingScore ? (
            <p className="text-slate-400 text-xs mt-2 animate-pulse">Salvando pontuação no ranking...</p>
          ) : scoreSaved ? (
            <p className="text-green-400 text-xs mt-2">Dados salvos com sucesso!</p>
          ) : null}
        </div>
      )}

      <div className="bg-slate-700 rounded-xl p-4 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-600 pb-2">Placar Final</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg ${i === 0 ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-slate-800'}`}>
              <span className="font-bold flex items-center gap-2">
                {i === 0 ? '👑' : <span className="text-slate-500 w-5">{i+1}º</span>}
                {p.name}
              </span>
              <span className="font-mono text-primary-400 font-bold">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => setGameState('setup')}
        className="w-full bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold text-lg py-4 rounded-xl transition-transform active:scale-95 shadow-lg"
      >
        {disputaUser ? 'Voltar ao Menu' : 'Jogar Novamente'}
      </button>
    </div>
  );
};
