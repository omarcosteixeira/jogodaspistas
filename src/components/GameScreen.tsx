import React, { useState, useEffect, useRef } from 'react';
import { Card, Player, Difficulty, GameState } from '../types';
import { playCorrectSound, playWrongSound, playTickSound } from '../utils/audio';
import { isAnswerCorrect } from '../utils/game';

interface GameScreenProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  deck: Card[];
  setDeck: React.Dispatch<React.SetStateAction<Card[]>>;
  currentPlayerIndex: number;
  setCurrentPlayerIndex: React.Dispatch<React.SetStateAction<number>>;
  currentRound: number;
  setCurrentRound: React.Dispatch<React.SetStateAction<number>>;
  totalRounds: number;
  difficulty: Difficulty;
  setGameState: (state: GameState) => void;
  appLogo: string;
}

const pointsArray = [20, 15, 10, 5, 1];
const timeLimits = { easy: 45, medium: 30, hard: 15 };

export const GameScreen: React.FC<GameScreenProps> = ({
  players,
  setPlayers,
  deck,
  setDeck,
  currentPlayerIndex,
  setCurrentPlayerIndex,
  currentRound,
  setCurrentRound,
  totalRounds,
  difficulty,
  setGameState,
  appLogo
}) => {
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimits[difficulty]);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviousCluesModal, setShowPreviousCluesModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastAction, setLastAction] = useState<'correct' | 'wrong' | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  
  const [guess, setGuess] = useState("");
  const [isListening, setIsListening] = useState(false);
  
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
    }
  }, [SpeechRecognition]);

  useEffect(() => {
    if (showAnswerModal) return;

    if (timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 10 && prev > 1) playTickSound(); 
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    } else {
      handleSkip(true); 
    }
  }, [timeLeft, showAnswerModal]);

  const submitGuess = (textToSubmit?: string) => {
    const finalGuess = typeof textToSubmit === 'string' ? textToSubmit : guess;
    if (!finalGuess.trim()) return;

    const correct = isAnswerCorrect(finalGuess, deck[0].answer);

    if (correct) {
      const points = pointsArray[currentClueIndex];
      setPointsEarned(points);
      setLastAction('correct');
      setPlayers(prev => prev.map((p, i) => {
        if (i === currentPlayerIndex) {
          const newCluesGuessedAt = p.cluesGuessedAt ? [...p.cluesGuessedAt, currentClueIndex] : [currentClueIndex];
          return { ...p, score: p.score + points, cluesGuessedAt: newCluesGuessedAt };
        }
        return p;
      }));
      playCorrectSound();
      setShowAnswerModal(true);
    } else {
      handleSkip(true); 
    }
    
    setGuess('');
    if(isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage("Reconhecimento de voz não suportado neste dispositivo.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setGuess(transcript);
        setIsListening(false);
        submitGuess(transcript); 
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
      
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSkip = (isMistakeOrTimeout = false) => {
    if (currentClueIndex < 4) {
      setCurrentClueIndex(prev => prev + 1);
      setTimeLeft(timeLimits[difficulty]);
      setGuess('');
      if (isMistakeOrTimeout) playWrongSound();
    } else {
      setPointsEarned(0);
      setLastAction('wrong');
      playWrongSound();
      setShowAnswerModal(true);
    }
  };

  const nextTurn = () => {
    setShowAnswerModal(false);
    setShowPreviousCluesModal(false);
    setCurrentClueIndex(0);
    setTimeLeft(timeLimits[difficulty]);
    setGuess('');

    setDeck(prev => prev.slice(1));

    let nextPlayer = currentPlayerIndex + 1;
    let nextRound = currentRound;

    if (nextPlayer >= players.length) {
      nextPlayer = 0;
      nextRound++;
    }

    if (nextRound > totalRounds) {
      setGameState('result');
    } else {
      setCurrentPlayerIndex(nextPlayer);
      setCurrentRound(nextRound);
    }
  };

  const currentCard = deck[0];
  const currentPlayer = players[currentPlayerIndex];

  if (!currentCard) return null;

  return (
    <>
      <header className="bg-slate-800 p-4 shadow-md flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <img 
            src={appLogo} 
            alt="Logo Mini" 
            className="w-12 h-12 rounded-full object-cover border-2 border-primary-500/50"
          />
          <div>
            <h1 className="text-lg font-bold text-primary-400 font-serif">Jogo das Pistas</h1>
            <p className="text-xs text-slate-400">Rodada {currentRound} de {totalRounds}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-300">Jogando agora:</p>
          <p className="font-bold text-primary-400 text-lg truncate max-w-[120px]">{currentPlayer?.name}</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full">
        <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative border-t-4 border-primary-500">
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="inline-block bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-md uppercase tracking-wider font-bold">
                {currentCard.category}
              </span>
              <p className="text-slate-400 text-sm mt-1">Dica {currentClueIndex + 1} de 5</p>
            </div>
            <div className={`flex items-center justify-center w-14 h-14 rounded-full border-4 ${timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-primary-500 text-primary-500'}`}>
              <span className="text-xl font-bold font-mono">{timeLeft}</span>
            </div>
          </div>

          <div className="min-h-[120px] flex items-center justify-center mb-6 bg-slate-700/50 p-4 rounded-xl border border-slate-600">
            <p className="text-center text-xl font-medium leading-relaxed">
              "{currentCard.clues[currentClueIndex]}"
            </p>
          </div>

          <div className="text-center mb-4">
            <p className="text-sm text-slate-400">
              Valor desta pista: <span className="font-bold text-primary-400">{pointsArray[currentClueIndex]} pontos</span>
            </p>
          </div>

          {currentClueIndex > 0 && (
            <div className="text-center mb-6">
              <button 
                onClick={() => setShowPreviousCluesModal(true)}
                className="text-primary-400 hover:text-primary-300 underline text-sm font-medium transition-colors"
              >
                👁️ Ver dicas anteriores ({currentClueIndex})
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitGuess(guess); }}
                placeholder="Qual o evento?..."
                className="flex-1 bg-slate-700 text-white rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary-400 text-lg placeholder-slate-400 shadow-inner"
              />
              {SpeechRecognition && (
                <button 
                  onClick={toggleListening}
                  className={`p-4 rounded-xl flex items-center justify-center transition-all shadow-md ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'}`}
                  title="Falar Resposta"
                >
                  <span className="text-2xl">🎤</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button 
                onClick={() => handleSkip(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center border border-slate-600"
              >
                <span className="text-xl mb-1">⏭️</span>
                {currentClueIndex < 4 ? "Pular Dica" : "Desistir"}
              </button>
              <button 
                onClick={() => submitGuess(guess)}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg shadow-green-900/50"
              >
                <span className="text-xl mb-1">✅</span>
                Responder
              </button>
            </div>
          </div>

        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setShowConfirmModal(true)}
            className="text-slate-400 hover:text-white underline text-sm transition-colors"
          >
            Finalizar Jogo Agora
          </button>
        </div>
      </main>

      {showConfirmModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center border-2 border-primary-500">
            <span className="text-5xl mb-4 block">❓</span>
            <h2 className="text-xl font-bold text-white mb-6">Deseja realmente finalizar o jogo e ver o placar?</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
              >
                Não, Voltar
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  setGameState('result');
                }}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold py-3 rounded-xl transition-all active:scale-95"
              >
                Sim, Finalizar
              </button>
            </div>
          </div>
        </div>
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

      {showPreviousCluesModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border-2 border-slate-600">
            <h2 className="text-xl font-bold text-primary-400 mb-4 font-serif text-center border-b border-slate-700 pb-2">
              Dicas Anteriores
            </h2>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {currentCard.clues.slice(0, currentClueIndex).map((clue, idx) => (
                <div key={idx} className="bg-slate-700 p-3 rounded-lg border border-slate-600">
                  <p className="text-xs text-slate-400 mb-1 font-bold">Dica {idx + 1} ({pointsArray[idx]} pts):</p>
                  <p className="text-sm text-white italic">"{clue}"</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowPreviousCluesModal(false)}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showAnswerModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className={`bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center border-2 ${lastAction === 'correct' ? 'border-green-500' : 'border-red-500'}`}>
            
            <div className="text-6xl mb-4">
              {lastAction === 'correct' ? '🎉' : '❌'}
            </div>
            
            {lastAction === 'correct' ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">
                  A resposta era:
                </h2>
                <p className="text-4xl font-black text-primary-400 mb-6 font-serif leading-tight">
                  {currentCard.answer}
                </p>
                <p className="text-green-400 font-bold mb-8 bg-green-900/30 p-3 rounded-lg inline-block border border-green-800">
                  +{pointsEarned} Pontos ganhos!
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Você não pontuou!
                </h2>
                <p className="text-lg text-slate-300 mb-6">
                  A resposta permanecerá em segredo para não dar dicas aos adversários.
                </p>
                <p className="text-red-400 font-bold mb-8 bg-red-900/30 p-3 rounded-lg inline-block border border-red-800">
                  Nenhum ponto nesta rodada.
                </p>
              </>
            )}

            <button 
              onClick={nextTurn}
              className="w-full bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold text-lg py-4 rounded-xl transition-transform active:scale-95 shadow-lg"
            >
              Próximo Jogador
            </button>
          </div>
        </div>
      )}
    </>
  );
};
