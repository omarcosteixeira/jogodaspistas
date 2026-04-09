import React, { useState } from 'react';
import { GameState, DisputaUser } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface HomeScreenProps {
  setGameState: (state: GameState) => void;
  appLogo: string;
  disputaUser?: DisputaUser | null;
  setDisputaUser?: (user: DisputaUser) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ setGameState, appLogo, disputaUser, setDisputaUser }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editEmail, setEditEmail] = useState(disputaUser?.email || '');
  const [editPhone, setEditPhone] = useState(disputaUser?.phone || '');
  const [editPassword, setEditPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const shareReferral = () => {
    if (!disputaUser) return;
    const url = `${window.location.origin}?ref=${disputaUser.name}`;
    navigator.clipboard.writeText(url);
    alert('Link de convite copiado! Compartilhe com seus amigos para ganhar estrelas.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputaUser || !setDisputaUser) return;
    
    setIsSavingProfile(true);
    setProfileMessage('');
    
    try {
      const docRef = doc(db, 'disputa_players', disputaUser.id);
      const updateData: any = {
        email: editEmail,
        phone: editPhone
      };
      
      if (editPassword.trim()) {
        updateData.password = editPassword.trim();
      }

      await updateDoc(docRef, updateData);
      
      setDisputaUser({
        ...disputaUser,
        email: editEmail,
        phone: editPhone
      });
      
      setProfileMessage('Perfil atualizado com sucesso!');
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileMessage('');
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileMessage('Erro ao atualizar perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-3xl text-center border border-slate-700/50 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-center mb-8 relative z-10">
        <img 
          src={appLogo} 
          alt="Logótipo Jogo das Pistas Gospel" 
          className="w-56 h-auto rounded-2xl drop-shadow-[0_10px_25px_rgba(245,158,11,0.25)] transition-transform duration-500 hover:scale-105 hover:rotate-1"
        />
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 mb-6 font-display tracking-tight relative z-10">
        Bem-vindo ao Jogo das Pistas!
      </h1>
      
      {disputaUser && (
        <div className="mb-8 bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 shadow-inner">
          <div className="text-left flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg">
              {disputaUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold mb-1">Logado como</p>
              <p className="text-xl font-bold text-white leading-tight">{disputaUser.name}</p>
              <p className="text-sm text-primary-400 font-mono font-medium">{disputaUser.score} pts</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/10 text-yellow-400 px-4 py-2.5 rounded-xl font-bold border border-yellow-500/30 flex items-center justify-center gap-2 shadow-sm">
              <span className="text-lg">⭐</span> {disputaUser.stars || 0} Estrelas
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEditEmail(disputaUser.email || '');
                  setEditPhone(disputaUser.phone || '');
                  setEditPassword('');
                  setShowProfileModal(true);
                }}
                className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-2 px-3 rounded-xl transition-all border border-slate-600 hover:border-slate-500 shadow-sm"
              >
                Editar Perfil
              </button>
              <button 
                onClick={shareReferral}
                className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-2 px-3 rounded-xl transition-all border border-slate-600 hover:border-slate-500 shadow-sm"
              >
                Convidar (+1 ⭐)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-slate-300 mb-10 space-y-5 text-left bg-slate-900/40 p-6 md:p-8 rounded-2xl border border-slate-700/50 relative z-10 shadow-inner">
        <p className="text-lg leading-relaxed">
          Uma nova e divertida maneira de aprender mais sobre a Bíblia! Jogue sozinho no <strong className="text-indigo-400 font-semibold">Modo Disputa</strong> para testar seus conhecimentos e subir no Ranking Global, ou reúna amigos e família para <strong className="text-primary-400 font-semibold">Jogar em Grupo</strong>.
        </p>
        <ul className="space-y-3 text-sm md:text-base text-slate-400">
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 mt-0.5">🏆</span>
            <span><strong className="text-indigo-400 font-semibold">Modo Disputa:</strong> Partidas rápidas de 6 cartas aleatórias. Acertar rápido reduz seu tempo de espera! Ganhe estrelas e desafie outros jogadores.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-400 mt-0.5">👥</span>
            <span><strong className="text-primary-400 font-semibold">Jogar em Grupo:</strong> Escolha a categoria, a dificuldade e a quantidade de jogadores para uma partida local.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-yellow-400 mt-0.5">💡</span>
            <span><strong className="text-yellow-400 font-semibold">Dica de Ouro:</strong> Quanto menos dicas você usar para acertar, mais pontos você ganha!</span>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        <button 
          onClick={() => setGameState('disputaLogin')}
          className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold py-5 px-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-900/50 border border-indigo-400/30 flex flex-col items-center justify-center gap-3"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🏆</span> 
          <span className="tracking-wide">{disputaUser ? 'Continuar Disputa' : 'Modo Disputa'}</span>
        </button>
        
        <button 
          onClick={() => setGameState('setup')}
          className="group relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-400 hover:to-primary-600 text-slate-900 font-bold py-5 px-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary-900/30 border border-primary-300/40 flex flex-col items-center justify-center gap-3"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">👥</span> 
          <span className="tracking-wide">Jogar em Grupo</span>
        </button>

        <button 
          onClick={() => setGameState('ranking')}
          className="group relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold py-5 px-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-900/50 border border-slate-500/30 flex flex-col items-center justify-center gap-3"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🌍</span> 
          <span className="tracking-wide">Ranking Global</span>
        </button>
      </div>

      {showProfileModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-sm text-center border border-slate-600/50 transform transition-all scale-100">
            <h2 className="text-2xl font-bold text-white mb-6 font-display">Editar Perfil</h2>
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div className="text-left">
                <label className="block text-slate-400 text-sm mb-1 ml-1">E-mail</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Seu E-mail"
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl p-3 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-inner"
                  disabled={isSavingProfile}
                />
              </div>
              <div className="text-left">
                <label className="block text-slate-400 text-sm mb-1 ml-1">Telefone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Seu Telefone"
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl p-3 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-inner"
                  disabled={isSavingProfile}
                />
              </div>
              <div className="text-left">
                <label className="block text-slate-400 text-sm mb-1 ml-1">Nova Senha</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Deixe em branco para manter"
                  className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl p-3 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-inner"
                  disabled={isSavingProfile}
                  maxLength={20}
                />
              </div>
              
              {profileMessage && (
                <p className={`text-sm p-2 rounded-lg ${profileMessage.includes('Erro') ? 'bg-red-900/20 text-red-400 border border-red-500/30' : 'bg-green-900/20 text-green-400 border border-green-500/30'}`}>
                  {profileMessage}
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 border border-slate-500/30"
                  disabled={isSavingProfile}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-900/30"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
