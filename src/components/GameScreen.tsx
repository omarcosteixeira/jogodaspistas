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
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative w-full overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 p-4 shadow-sm flex justify-between items-center w-full sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img 
            src={appLogo} 
            alt="Logo Mini" 
            className="w-12 h-12 rounded-full object-cover border-2 border-primary-500/50 shadow-md"
          />
          <div>
            <h1 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 font-display tracking-tight">Jogo das Pistas</h1>
            <p className="text-xs text-slate-400 font-medium">Rodada {currentRound} de {totalRounds}</p>
          </div>
        </div>
        <div className="text-right bg-slate-800/50 px-4 py-1.5 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Jogando agora</p>
          <p className="font-bold text-primary-400 text-lg truncate max-w-[120px]">{currentPlayer?.name}</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full relative z-10">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-md p-6 md:p-8 relative border border-slate-700/50">
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="inline-block bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider font-bold shadow-sm">
                {currentCard.category}
              </span>
              <p className="text-slate-400 text-sm mt-2 font-medium">Dica {currentClueIndex + 1} de 5</p>
            </div>
            <div className={`flex items-center justify-center w-16 h-16 rounded-full border-4 shadow-lg bg-slate-900/50 backdrop-blur-sm ${timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse shadow-red-500/20' : 'border-primary-500 text-primary-400 shadow-primary-500/20'}`}>
              <span className="text-2xl font-bold font-mono">{timeLeft}</span>
            </div>
          </div>

          <div className="min-h-[140px] flex items-center justify-center mb-6 bg-slate-900/40 p-6 rounded-2xl border border-slate-700/50 shadow-inner">
            <p className="text-center text-xl md:text-2xl font-medium leading-relaxed text-slate-100">
              "{currentCard.clues[currentClueIndex]}"
            </p>
          </div>

          <div className="text-center mb-5">
            <p className="text-sm text-slate-400 bg-slate-900/30 inline-block px-4 py-1.5 rounded-full border border-slate-700/30">
              Valor desta pista: <span className="font-bold text-primary-400">{pointsArray[currentClueIndex]} pontos</span>
            </p>
          </div>

          {currentClueIndex > 0 && (
            <div className="text-center mb-6">
              <button 
                onClick={() => setShowPreviousCluesModal(true)}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors flex items-center justify-center gap-2 mx-auto bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-xl border border-indigo-500/20"
              >
                <span>👁️</span> Ver dicas anteriores ({currentClueIndex})
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
                className="flex-1 bg-slate-900/50 text-white rounded-2xl p-4 outline-none border border-slate-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-lg placeholder-slate-500 shadow-inner transition-all"
              />
              {SpeechRecognition && (
                <button 
                  onClick={toggleListening}
                  className={`p-4 rounded-2xl flex items-center justify-center transition-all shadow-md ${isListening ? 'bg-red-500 animate-pulse shadow-red-500/30' : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 shadow-slate-900/50'}`}
                  title="Falar Resposta"
                >
                  <span className="text-2xl">🎤</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <button 
                onClick={() => handleSkip(false)}
                className="bg-slate-700/80 hover:bg-slate-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex flex-col items-center justify-center border border-slate-500/30 shadow-sm"
              >
                <span className="text-2xl mb-1">⏭️</span>
                {currentClueIndex < 4 ? "Pular Dica" : "Desistir"}
              </button>
              <button 
                onClick={() => submitGuess(guess)}
                className="bg-gradient-to-br from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg shadow-green-900/40 border border-green-400/30"
              >
                <span className="text-2xl mb-1">✅</span>
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-sm text-center border border-slate-600/50 transform transition-all scale-100">
            <span className="text-6xl mb-4 block drop-shadow-lg">❓</span>
            <h2 className="text-2xl font-bold text-white mb-8 font-display">Deseja realmente finalizar o jogo e ver o placar?</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 border border-slate-500/30"
              >
                Não, Voltar
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  setGameState('result');
                }}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-900/30"
              >
                Sim, Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-sm text-center border border-red-500/50 transform transition-all scale-100">
            <span className="text-5xl mb-4 block drop-shadow-lg">⚠️</span>
            <h2 className="text-xl font-bold text-white mb-8">{errorMessage}</h2>
            <button 
              onClick={() => setErrorMessage("")}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold py-4 rounded-xl transition-transform active:scale-95 shadow-lg shadow-primary-900/30"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {showPreviousCluesModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl p-6 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-md border border-slate-600/50 transform transition-all scale-100">
            <h2 className="text-2xl font-bold text-primary-400 mb-6 font-display text-center border-b border-slate-700/50 pb-4">
              Dicas Anteriores
            </h2>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {currentCard.clues.slice(0, currentClueIndex).map((clue, idx) => (
                <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                  <p className="text-xs text-indigo-300 mb-1 font-bold uppercase tracking-wider">Dica {idx + 1} <span className="text-slate-500">({pointsArray[idx]} pts)</span></p>
                  <p className="text-base text-slate-200 italic leading-relaxed">"{clue}"</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowPreviousCluesModal(false)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 border border-slate-500/30"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showAnswerModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className={`bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-sm text-center border transform transition-all scale-100 ${lastAction === 'correct' ? 'border-green-500/50' : 'border-red-500/50'}`}>
            
            <div className="text-7xl mb-6 drop-shadow-lg">
              {lastAction === 'correct' ? '🎉' : '❌'}
            </div>
            
            {lastAction === 'correct' ? (
              <>
                <h2 className="text-xl font-bold text-slate-300 mb-2">
                  A resposta era:
                </h2>
                <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 mb-8 font-display leading-tight">
                  {currentCard.answer}
                </p>
                <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-2xl inline-block mb-8 shadow-inner">
                  <p className="text-green-400 font-bold text-lg">
                    +{pointsEarned} Pontos ganhos!
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-3 font-display">
                  Você não pontuou!
                </h2>
                <p className="text-base text-slate-400 mb-8 leading-relaxed">
                  A resposta permanecerá em segredo para não dar dicas aos adversários.
                </p>
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-2xl inline-block mb-8 shadow-inner">
                  <p className="text-red-400 font-bold text-lg">
                    Nenhum ponto nesta rodada.
                  </p>
                </div>
              </>
            )}

            <button 
              onClick={nextTurn}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold text-lg py-4 rounded-xl transition-transform active:scale-95 shadow-lg shadow-primary-900/30"
            >
              Próximo Jogador
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
