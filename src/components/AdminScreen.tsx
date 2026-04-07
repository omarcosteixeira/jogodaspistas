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
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border-2 border-primary-500">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Área Restrita</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg p-4 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all text-center text-xl tracking-widest"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold py-3 rounded-xl transition-all"
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
    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border-2 border-primary-500">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-primary-400">Configurações</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
      </div>

      <div className="space-y-8">
        {/* Theme Selection */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Cor do Tema</h3>
          <div className="grid grid-cols-5 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center transition-transform ${currentTheme === t.id ? 'ring-4 ring-white scale-110' : 'hover:scale-105'}`}
                title={t.name}
              />
            ))}
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Logo Inicial</h3>
          <div className="flex flex-col gap-3">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-all border border-slate-600 flex items-center justify-center gap-2"
            >
              <span>📁</span> Escolher Nova Imagem
            </button>
            <button
              onClick={handleResetLogo}
              className="w-full bg-slate-800 hover:bg-slate-700 text-red-400 font-medium py-2 rounded-xl transition-all border border-red-900/50 text-sm"
            >
              Restaurar Logo Padrão
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-700">
        <button
          onClick={onClose}
          className="w-full bg-primary-500 hover:bg-primary-600 text-slate-900 font-bold py-3 rounded-xl transition-all"
        >
          Salvar e Fechar
        </button>
      </div>
    </div>
  );
};
