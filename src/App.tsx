import React, { useState, useEffect } from 'react';
import { GameState, Player, Difficulty } from './types';
import { cardDatabase } from './data';
import { shuffleArray } from './utils/game';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('setup');
  
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
      score: 0
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

    setPlayers(initializedPlayers);
    setDeck(shuffleArray(filteredCards));
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setTotalRounds(roundsToPlay);
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
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
        />
      )}

      {gameState === 'result' && (
        <div className="p-4 w-full flex justify-center">
          <ResultScreen 
            players={players}
            totalRounds={totalRounds}
            setGameState={setGameState}
          />
        </div>
      )}

      {errorMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-sm text-center border-2 border-red-500">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h2 className="text-lg font-bold text-white mb-6">{errorMessage}</h2>
            <button 
              onClick={() => setErrorMessage("")}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl transition-transform active:scale-95"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
