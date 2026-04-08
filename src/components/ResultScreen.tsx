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
    <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-md text-center border border-slate-700/50 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <span className="text-7xl mb-6 block drop-shadow-lg animate-bounce">🏆</span>
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 mb-2 font-display tracking-tight">Fim de Jogo!</h1>
      <p className="text-slate-300 mb-8 font-medium">O desafio de {totalRounds} cartas foi concluído.</p>
      
      {disputaUser && (
        <div className="mb-8 bg-indigo-900/20 backdrop-blur-md border border-indigo-500/30 p-5 rounded-2xl shadow-inner relative z-10">
          <p className="text-indigo-300 text-xs uppercase tracking-wider font-bold mb-2">Modo Disputa</p>
          <p className="text-white font-bold text-xl mb-1">Pontos ganhos: <span className="text-primary-400">+{players[0].score}</span></p>
          
          {activeChallenge && activeChallenge.type === 'issuing' && (
            <div className="mt-4 pt-4 border-t border-indigo-500/20">
              <p className="text-sm text-slate-300">
                Desafio enviado para <strong className="text-primary-400">{activeChallenge.targetName}</strong>!
              </p>
              <p className="text-xs text-slate-400 mt-1">Aguarde até que ele responda.</p>
            </div>
          )}

          {activeChallenge && activeChallenge.type === 'responding' && (
            <div className="mt-4 pt-4 border-t border-indigo-500/20">
              <p className="text-sm text-slate-300 mb-2 font-semibold">Resultado do Desafio:</p>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-slate-400">Você (1ª dica):</span>
                <span className="text-white font-bold">{players[0].cluesGuessedAt?.filter(c => c === 0).length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-3">
                <span className="text-slate-400">Oponente (1ª dica):</span>
                <span className="text-white font-bold">{activeChallenge.challengerFirstClueCount}</span>
              </div>
              
              {((players[0].cluesGuessedAt?.filter(c => c === 0).length || 0) > (activeChallenge.challengerFirstClueCount || 0)) ? (
                <p className="text-green-400 font-bold bg-green-900/30 py-2 rounded-lg border border-green-500/30">Você venceu e ganhou estrelas! ⭐</p>
              ) : ((players[0].cluesGuessedAt?.filter(c => c === 0).length || 0) < (activeChallenge.challengerFirstClueCount || 0)) ? (
                <p className="text-red-400 font-bold bg-red-900/30 py-2 rounded-lg border border-red-500/30">Você perdeu o desafio.</p>
              ) : (
                <p className="text-yellow-400 font-bold bg-yellow-900/30 py-2 rounded-lg border border-yellow-500/30">Empate!</p>
              )}
            </div>
          )}

          {scoreSaved && (
            <div className="mt-4 pt-4 border-t border-indigo-500/20">
              <p className="text-sm text-slate-300 mb-1">
                Tempo de espera para próxima partida:
              </p>
              <p className="text-2xl font-bold text-indigo-400 font-display">
                {cooldownMinutes === 0 ? 'Jogue agora!' : `${cooldownMinutes} minutos`}
              </p>
            </div>
          )}

          {savingScore ? (
            <p className="text-slate-400 text-xs mt-3 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-indigo-500/50 border-t-indigo-500 rounded-full animate-spin inline-block"></span>
              Salvando pontuação...
            </p>
          ) : scoreSaved ? (
            <p className="text-green-400 text-xs mt-3 flex items-center justify-center gap-1">
              <span>✅</span> Dados salvos com sucesso!
            </p>
          ) : null}
        </div>
      )}

      <div className="bg-slate-900/50 rounded-2xl p-5 mb-8 border border-slate-700/50 shadow-inner relative z-10">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700/50 pb-3 font-display tracking-wide">Placar Final</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className={`flex justify-between items-center p-3.5 rounded-xl transition-all ${i === 0 ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/10 border border-primary-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-slate-800/80 border border-slate-700/50'}`}>
              <span className="font-bold flex items-center gap-3 text-lg">
                {i === 0 ? <span className="text-2xl drop-shadow-md">👑</span> : <span className="text-slate-500 w-6 text-center">{i+1}º</span>}
                <span className={i === 0 ? 'text-primary-300' : 'text-white'}>{p.name}</span>
              </span>
              <span className="font-mono text-primary-400 font-bold bg-slate-950/50 px-3 py-1 rounded-lg border border-slate-700/50 shadow-inner">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => setGameState('setup')}
        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold text-lg py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-900/30 relative z-10"
      >
        {disputaUser ? 'Voltar ao Menu' : 'Jogar Novamente'}
      </button>
    </div>
  );
};
