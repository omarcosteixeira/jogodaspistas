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
    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border-2 border-primary-500 text-center">
      <span className="text-5xl block mb-4">🏆</span>
      <h2 className="text-2xl font-bold text-primary-400 mb-2 font-serif">Modo Disputa</h2>
      <p className="text-slate-300 mb-6 text-sm">
        Jogue sozinho, acumule pontos e suba no Ranking Global!
      </p>

      {step === 'username' && (
        <form onSubmit={handleCheckUsername} className="flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Digite seu Nome ou Apelido"
            className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-4 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all text-center text-lg"
            maxLength={20}
            required
            disabled={loading}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold py-3 rounded-xl transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : 'Continuar'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <p className="text-white">Bem-vindo de volta, <strong className="text-primary-400">{username}</strong>!</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua Senha (6 dígitos)"
            className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-4 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all text-center text-xl tracking-widest"
            maxLength={6}
            required
            disabled={loading}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold py-3 rounded-xl transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar e Jogar'}
          </button>
        </form>
      )}

      {step === 'cooldown' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-orange-900/30 border border-orange-500/50 p-4 rounded-xl">
            <p className="text-orange-400 font-bold mb-2">Aguarde um momento!</p>
            <p className="text-slate-300 text-sm mb-4">
              Você precisa esperar o tempo de recarga para jogar novamente no Modo Disputa.
            </p>
            <div className="text-2xl font-mono font-bold text-white tracking-widest bg-slate-900 py-3 rounded-lg">
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
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>⭐ Usar 1 Estrela (Reduzir para 30s)</span>
          </button>

          <button
            onClick={() => setGameState('home')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-transform active:scale-95"
          >
            Voltar ao Menu
          </button>
        </div>
      )}

      {step === 'profile' && (
        <form onSubmit={handleCreateProfile} className="flex flex-col gap-4">
          <p className="text-white text-sm mb-2">Olá <strong className="text-primary-400">{username}</strong>! Parece que você é novo por aqui. Preencha seus dados para criar seu perfil.</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu E-mail (opcional)"
            className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-4 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all text-center"
            disabled={loading}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Seu Telefone (opcional)"
            className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-4 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all text-center"
            disabled={loading}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold py-3 rounded-xl transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Conta'}
          </button>
        </form>
      )}

      {step === 'new_user' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-xl">
            <p className="text-green-400 font-bold mb-2">Conta criada com sucesso!</p>
            <p className="text-slate-300 text-sm mb-4">
              Guarde esta senha. Você precisará dela para voltar e continuar acumulando pontos:
            </p>
            <div className="text-4xl font-mono font-bold text-white tracking-widest bg-slate-900 py-3 rounded-lg">
              {generatedPassword}
            </div>
          </div>
          <button
            onClick={startGameDisputa}
            className="w-full bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold py-3 rounded-xl transition-transform active:scale-95"
          >
            Começar a Jogar!
          </button>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-700">
        <button
          onClick={() => setGameState('setup')}
          className="text-slate-400 hover:text-white text-sm transition-colors"
          disabled={loading}
        >
          Voltar para o Menu Principal
        </button>
      </div>
    </div>
  );
};
