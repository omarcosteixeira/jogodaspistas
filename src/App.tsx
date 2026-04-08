import React, { useState, useEffect } from 'react';
import { GameState, Player, Difficulty, DisputaUser, ActiveChallenge, Challenge } from './types';
import { cardDatabase } from './data';
import { shuffleArray } from './utils/game';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { AdminScreen } from './components/AdminScreen';
import { DisputaLoginScreen } from './components/DisputaLoginScreen';
import { RankingScreen } from './components/RankingScreen';
import { HomeScreen } from './components/HomeScreen';
import { db } from './firebase';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [appLogo, setAppLogo] = useState<string>('/logo.jpg');
  
  // Setup State
  const [numPlayers, setNumPlayers] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(["Jogador 1", "Jogador 2"]);
  const [gameMode, setGameMode] = useState('mixed');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [errorMessage, setErrorMessage] = useState("");
  
  // Jogo State
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<any[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(6);

  // Disputa State
  const [disputaUser, setDisputaUser] = useState<DisputaUser | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null);
  const [incomingChallenges, setIncomingChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    if (!disputaUser) {
      setIncomingChallenges([]);
      return;
    }
    
    // Listen for incoming challenges
    const q = query(
      collection(db, 'challenges'),
      where('challengedId', '==', disputaUser.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const challenges: Challenge[] = [];
      snapshot.forEach((doc) => {
        challenges.push({ id: doc.id, ...doc.data() } as Challenge);
      });
      setIncomingChallenges(challenges);
    });

    // Check for expired outgoing challenges
    const checkExpired = async () => {
      try {
        const outQ = query(
          collection(db, 'challenges'),
          where('challengerId', '==', disputaUser.id),
          where('status', '==', 'pending')
        );
        const outSnap = await getDocs(outQ);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        outSnap.forEach(async (challengeDoc) => {
          const data = challengeDoc.data();
          if (now - data.createdAt > oneDay) {
            // Expired! Award 6 stars to challenger
            const userRef = doc(db, 'disputa_players', disputaUser.id);
            await updateDoc(userRef, { stars: increment(6) });
            await updateDoc(challengeDoc.ref, { status: 'expired' });
            alert(`O desafio contra ${data.challengedName} expirou! Você ganhou 6 estrelas. ⭐`);
          }
        });
      } catch (e) {
        console.error("Error checking expired challenges", e);
      }
    };
    
    checkExpired();

    return () => unsubscribe();
  }, [disputaUser]);

  useEffect(() => {
    // Load theme and logo on mount
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    const loadLogo = () => {
      const savedLogo = localStorage.getItem('appLogo');
      if (savedLogo) {
        setAppLogo(savedLogo);
      } else {
        setAppLogo('/logo.jpg');
      }
    };
    
    loadLogo();
    window.addEventListener('logoUpdated', loadLogo);
    return () => window.removeEventListener('logoUpdated', loadLogo);
  }, []);

  useEffect(() => {
    setPlayerNames(prev => {
      const newNames = [...prev];
      while (newNames.length < numPlayers) {
        newNames.push(`Jogador ${newNames.length + 1}`);
      }
      return newNames.slice(0, numPlayers);
    });
  }, [numPlayers]);

  const uniqueCategories = [...new Set(cardDatabase.map(c => c.category))].sort();

  const startGame = () => {
    const initializedPlayers = playerNames.map((name, index) => ({
      id: index,
      name: name.trim() || `Jogador ${index + 1}`,
      score: 0,
      cluesGuessedAt: []
    }));
    
    let filteredCards = cardDatabase;
    if (gameMode !== 'mixed') {
      filteredCards = cardDatabase.filter(card => card.category === gameMode);
    }

    const maxRoundsPossible = Math.floor(filteredCards.length / numPlayers);
    const roundsToPlay = Math.min(6, maxRoundsPossible); 

    if (roundsToPlay === 0) {
      setErrorMessage(`Não há cartas suficientes na categoria escolhida para ${numPlayers} jogadores. Por favor, diminua o número de jogadores ou altere o modo de jogo.`);
      return;
    }

    setDisputaUser(null); // Clear disputa user if playing normal mode
    setPlayers(initializedPlayers);
    setDeck(shuffleArray(filteredCards));
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setTotalRounds(roundsToPlay);
    setGameState('playing');
  };

  const startGameDisputa = () => {
    if (!disputaUser) return;

    const initializedPlayers = [{
      id: 0,
      name: disputaUser.name,
      score: 0,
      cluesGuessedAt: []
    }];
    
    let filteredCards = cardDatabase;
    if (gameMode !== 'mixed') {
      filteredCards = cardDatabase.filter(card => card.category === gameMode);
    }

    const maxRoundsPossible = filteredCards.length;
    const roundsToPlay = Math.min(6, maxRoundsPossible); 

    if (roundsToPlay === 0) {
      setErrorMessage(`Não há cartas suficientes na categoria escolhida. Por favor, altere o modo de jogo.`);
      return;
    }

    setPlayers(initializedPlayers);
    setDeck(shuffleArray(filteredCards));
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setTotalRounds(roundsToPlay);
    setGameState('playing');
  };

  const handleChallenge = (targetId: string, targetName: string) => {
    setActiveChallenge({
      type: 'issuing',
      targetId,
      targetName
    });
    startGameDisputa();
  };

  const handleAcceptChallenge = (challenge: Challenge) => {
    setActiveChallenge({
      type: 'responding',
      challengeId: challenge.id,
      challengerId: challenge.challengerId,
      challengerFirstClueCount: challenge.challengerFirstClueCount
    });
    startGameDisputa();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center relative">
      {/* Admin Trigger */}
      <button 
        onClick={() => setShowAdmin(true)}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-all z-50"
        title="Administrador"
      >
        ⚙️
      </button>

      {showAdmin ? (
        <div className="p-4 w-full flex justify-center z-40 relative">
          <AdminScreen onClose={() => setShowAdmin(false)} />
        </div>
      ) : (
        <>
          {gameState === 'home' && (
            <div className="p-4 w-full flex justify-center">
              <HomeScreen 
                setGameState={setGameState} 
                appLogo={appLogo}
                disputaUser={disputaUser}
                setDisputaUser={setDisputaUser}
              />
            </div>
          )}

          {gameState === 'setup' && (
            <div className="p-4 w-full flex justify-center">
              <SetupScreen 
                numPlayers={numPlayers}
                setNumPlayers={setNumPlayers}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                gameMode={gameMode}
                setGameMode={setGameMode}
                playerNames={playerNames}
                setPlayerNames={setPlayerNames}
                startGame={startGame}
                uniqueCategories={uniqueCategories}
                appLogo={appLogo}
                setGameState={setGameState}
              />
            </div>
          )}

          {gameState === 'disputaLogin' && (
            <div className="p-4 w-full flex justify-center">
              <DisputaLoginScreen 
                setGameState={setGameState}
                setDisputaUser={setDisputaUser}
                startGameDisputa={startGameDisputa}
              />
            </div>
          )}

          {gameState === 'ranking' && (
            <div className="p-4 w-full flex justify-center">
              <RankingScreen 
                setGameState={setGameState} 
                disputaUser={disputaUser}
                onChallenge={handleChallenge}
              />
            </div>
          )}

          {gameState === 'playing' && (
            <GameScreen 
              players={players}
              setPlayers={setPlayers}
              deck={deck}
              setDeck={setDeck}
              currentPlayerIndex={currentPlayerIndex}
              setCurrentPlayerIndex={setCurrentPlayerIndex}
              currentRound={currentRound}
              setCurrentRound={setCurrentRound}
              totalRounds={totalRounds}
              difficulty={difficulty}
              setGameState={setGameState}
              appLogo={appLogo}
            />
          )}

          {gameState === 'result' && (
            <div className="p-4 w-full flex justify-center">
              <ResultScreen 
                players={players}
                totalRounds={totalRounds}
                setGameState={setGameState}
                disputaUser={disputaUser}
                activeChallenge={activeChallenge}
                setActiveChallenge={setActiveChallenge}
              />
            </div>
          )}
        </>
      )}

      {errorMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-sm text-center border-2 border-red-500">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h2 className="text-lg font-bold text-white mb-6">{errorMessage}</h2>
            <button 
              onClick={() => setErrorMessage("")}
              className="w-full bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold py-3 rounded-xl transition-transform active:scale-95"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {incomingChallenges.length > 0 && gameState !== 'playing' && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {incomingChallenges.map(challenge => (
            <div key={challenge.id} className="bg-slate-800/90 backdrop-blur-xl border border-red-500/50 p-5 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.3)] flex flex-col gap-3 w-80 animate-fade-in transform transition-all hover:scale-105">
              <div className="flex items-center gap-3 border-b border-slate-700/50 pb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                  <span className="text-xl">⚔️</span>
                </div>
                <div>
                  <p className="text-white font-bold font-display tracking-wide">Desafio Recebido!</p>
                  <p className="text-xs text-red-400 font-medium">Modo Disputa</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                <strong className="text-primary-400 font-bold text-base">{challenge.challengerName}</strong> desafiou você para uma partida!
              </p>
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => handleAcceptChallenge(challenge)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm shadow-lg shadow-red-900/30"
                >
                  Aceitar
                </button>
                <button 
                  onClick={async () => {
                    if (challenge.id) {
                      await updateDoc(doc(db, 'challenges', challenge.id), { status: 'declined' });
                      // Award 6 stars to challenger immediately since it was declined
                      const challengerRef = doc(db, 'disputa_players', challenge.challengerId);
                      await updateDoc(challengerRef, { stars: increment(6) });
                    }
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm border border-slate-500/30"
                >
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
