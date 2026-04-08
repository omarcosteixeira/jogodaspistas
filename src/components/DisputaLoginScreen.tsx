import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { GameState, DisputaUser } from '../types';

interface DisputaLoginScreenProps {
  setGameState: (state: GameState) => void;
  setDisputaUser: (user: DisputaUser) => void;
  startGameDisputa: () => void;
}

export const DisputaLoginScreen: React.FC<DisputaLoginScreenProps> = ({
  setGameState,
  setDisputaUser,
  startGameDisputa
}) => {
  const [step, setStep] = useState<'username' | 'password' | 'profile' | 'new_user' | 'cooldown'>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState('');

  const getDocId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

  const checkCooldown = (cooldownUntil?: number) => {
    if (!cooldownUntil) return false;
    const now = Date.now();
    if (now < cooldownUntil) {
      const diff = cooldownUntil - now;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCooldownRemaining(`${minutes}m ${seconds}s`);
      return true;
    }
    return false;
  };

  const handleCheckUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');
    try {
      const docId = getDocId(username);
      const docRef = doc(db, 'disputa_players', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStep('password');
      } else {
        setStep('profile');
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao conectar ao servidor. Verifique as regras do Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const docId = getDocId(username);
      const docRef = doc(db, 'disputa_players', docId);
      
      const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(docRef, {
        name: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: newPassword,
        score: 0,
        stars: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Check for referral
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        const referrerDocId = getDocId(ref);
        if (referrerDocId !== docId) {
          try {
            const referrerRef = doc(db, 'disputa_players', referrerDocId);
            const referrerSnap = await getDoc(referrerRef);
            if (referrerSnap.exists()) {
              await setDoc(referrerRef, { stars: (referrerSnap.data().stars || 0) + 1 }, { merge: true });
            }
          } catch (e) {
            console.error("Error updating referrer stars:", e);
          }
        }
      }
      
      setGeneratedPassword(newPassword);
      setStep('new_user');
      setDisputaUser({
        id: docId,
        name: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        score: 0,
        stars: 0
      });
    } catch (err: any) {
      console.error(err);
      setError('Erro ao criar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');
    try {
      const docId = getDocId(username);
      const docRef = doc(db, 'disputa_players', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.password === password) {
          if (checkCooldown(data.cooldownUntil)) {
            setStep('cooldown');
            
            // Start a timer to update the cooldown display
            const interval = setInterval(() => {
              if (!checkCooldown(data.cooldownUntil)) {
                clearInterval(interval);
                setStep('password'); // Or just start the game
              }
            }, 1000);
            
          } else {
            setDisputaUser({
              id: docId,
              name: data.name,
              email: data.email,
              phone: data.phone,
              score: data.score || 0,
              stars: data.stars || 0,
              cooldownUntil: data.cooldownUntil
            });
            startGameDisputa();
          }
        } else {
          setError('Senha incorreta!');
        }
      } else {
        setError('Usuário não encontrado.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-md border border-slate-700/50 text-center relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <span className="text-6xl block mb-6 drop-shadow-lg">🏆</span>
      <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 mb-3 font-display tracking-tight">Modo Disputa</h2>
      <p className="text-slate-300 mb-8 text-sm font-medium leading-relaxed">
        Jogue sozinho, acumule pontos e suba no Ranking Global!
      </p>

      {step === 'username' && (
        <form onSubmit={handleCheckUsername} className="flex flex-col gap-4 relative z-10">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Digite seu Nome ou Apelido"
            className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl p-4 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-center text-lg shadow-inner placeholder-slate-500"
            maxLength={20}
            required
            disabled={loading}
          />
          {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded-lg border border-red-500/30">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-900/30 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin inline-block"></span>
                Carregando...
              </>
            ) : 'Continuar'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4 relative z-10">
          <p className="text-white mb-2">Bem-vindo de volta, <strong className="text-primary-400 text-lg">{username}</strong>!</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua Senha (6 dígitos)"
            className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl p-4 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-center text-2xl tracking-[0.5em] shadow-inner placeholder-slate-500"
            maxLength={6}
            required
            disabled={loading}
          />
          {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded-lg border border-red-500/30">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-900/30 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin inline-block"></span>
                Entrando...
              </>
            ) : 'Entrar e Jogar'}
          </button>
        </form>
      )}

      {step === 'cooldown' && (
        <div className="flex flex-col gap-4 animate-fade-in relative z-10">
          <div className="bg-orange-900/20 backdrop-blur-md border border-orange-500/30 p-6 rounded-2xl shadow-inner">
            <p className="text-orange-400 font-bold mb-2 text-lg">Aguarde um momento!</p>
            <p className="text-slate-300 text-sm mb-5 leading-relaxed">
              Você precisa esperar o tempo de recarga para jogar novamente no Modo Disputa.
            </p>
            <div className="text-3xl font-mono font-bold text-white tracking-widest bg-slate-950/50 py-4 rounded-xl border border-slate-700/50 shadow-inner">
              {cooldownRemaining}
            </div>
          </div>
          
          <button
            onClick={async () => {
              try {
                const docId = getDocId(username);
                const docRef = doc(db, 'disputa_players', docId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  if (data.stars > 0) {
                    await setDoc(docRef, { stars: data.stars - 1, cooldownUntil: Date.now() + 30000 }, { merge: true });
                    // Refresh cooldown
                    checkCooldown(Date.now() + 30000);
                  } else {
                    alert("Você não tem estrelas suficientes!");
                  }
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/30 mt-2"
          >
            <span className="text-xl">⭐</span> Usar 1 Estrela (Reduzir para 30s)
          </button>

          <button
            onClick={() => setGameState('home')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all active:scale-95 border border-slate-500/30"
          >
            Voltar ao Menu
          </button>
        </div>
      )}

      {step === 'profile' && (
        <form onSubmit={handleCreateProfile} className="flex flex-col gap-4 relative z-10">
          <p className="text-white text-sm mb-4 leading-relaxed">Olá <strong className="text-primary-400 text-base">{username}</strong>! Parece que você é novo por aqui. Preencha seus dados para criar seu perfil.</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu E-mail (opcional)"
            className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl p-4 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-center shadow-inner placeholder-slate-500"
            disabled={loading}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Seu Telefone (opcional)"
            className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl p-4 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-center shadow-inner placeholder-slate-500"
            disabled={loading}
          />
          {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded-lg border border-red-500/30">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-900/30 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin inline-block"></span>
                Criando...
              </>
            ) : 'Criar Conta'}
          </button>
        </form>
      )}

      {step === 'new_user' && (
        <div className="flex flex-col gap-4 animate-fade-in relative z-10">
          <div className="bg-green-900/20 backdrop-blur-md border border-green-500/30 p-6 rounded-2xl shadow-inner">
            <p className="text-green-400 font-bold mb-3 text-lg">Conta criada com sucesso!</p>
            <p className="text-slate-300 text-sm mb-5 leading-relaxed">
              Guarde esta senha. Você precisará dela para voltar e continuar acumulando pontos:
            </p>
            <div className="text-4xl font-mono font-bold text-white tracking-[0.2em] bg-slate-950/50 py-4 rounded-xl border border-slate-700/50 shadow-inner">
              {generatedPassword}
            </div>
          </div>
          <button
            onClick={startGameDisputa}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-900/30 mt-2"
          >
            Começar a Jogar!
          </button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-700/50 relative z-10">
        <button
          onClick={() => setGameState('setup')}
          className="text-slate-400 hover:text-white text-sm transition-colors font-medium"
          disabled={loading}
        >
          Voltar para o Menu Principal
        </button>
      </div>
    </div>
  );
};
