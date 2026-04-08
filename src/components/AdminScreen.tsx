import React, { useState, useRef } from 'react';

interface AdminScreenProps {
  onClose: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('appTheme') || 'amber');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '91931324') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Senha incorreta');
    }
  };

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('appTheme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('appLogo', base64String);
        alert('Logo atualizada com sucesso!');
        // Dispatch a custom event so other components can update
        window.dispatchEvent(new Event('logoUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    localStorage.removeItem('appLogo');
    alert('Logo resetada para o padrão.');
    window.dispatchEvent(new Event('logoUpdated'));
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-md border border-slate-700/50 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 mb-8 text-center font-display tracking-tight relative z-10">Área Restrita</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              className="w-full bg-slate-900/50 text-white border border-slate-600 rounded-xl p-4 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-center text-2xl tracking-[0.5em] shadow-inner placeholder-slate-500"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg border border-red-500/30">{error}</p>}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all border border-slate-500/30 active:scale-95"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-900/30 active:scale-95"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    );
  }

  const themes = [
    { id: 'amber', name: 'Âmbar (Padrão)', color: 'bg-amber-500' },
    { id: 'blue', name: 'Azul', color: 'bg-blue-500' },
    { id: 'green', name: 'Verde', color: 'bg-green-500' },
    { id: 'purple', name: 'Roxo', color: 'bg-purple-500' },
    { id: 'rose', name: 'Rosa', color: 'bg-rose-500' },
  ];

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-md border border-slate-700/50 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center mb-8 border-b border-slate-700/50 pb-5 relative z-10">
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500 font-display tracking-tight">Configurações</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl transition-colors">&times;</button>
      </div>

      <div className="space-y-8 relative z-10">
        {/* Theme Selection */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
          <h3 className="text-lg font-medium text-white mb-4">Cor do Tema</h3>
          <div className="grid grid-cols-5 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center transition-all shadow-md ${currentTheme === t.id ? 'ring-4 ring-white scale-110 shadow-lg shadow-white/20' : 'hover:scale-110 hover:shadow-lg'}`}
                title={t.name}
              />
            ))}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
          <h3 className="text-lg font-medium text-white mb-4">Logo Inicial</h3>
          <div className="flex flex-col gap-4">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-4 rounded-xl transition-all border border-slate-500/30 flex items-center justify-center gap-3 shadow-sm active:scale-95"
            >
              <span className="text-xl">📁</span> Escolher Nova Imagem
            </button>
            <button
              onClick={handleResetLogo}
              className="w-full bg-slate-800 hover:bg-slate-700 text-red-400 font-medium py-3 rounded-xl transition-all border border-red-900/50 text-sm active:scale-95"
            >
              Restaurar Logo Padrão
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700/50 relative z-10">
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary-900/30 active:scale-95 text-lg"
        >
          Salvar e Fechar
        </button>
      </div>
    </div>
  );
};
