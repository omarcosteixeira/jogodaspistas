import React from 'react';

interface LoadingAnimationProps {
  message?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ message = 'Carregando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-6 w-full h-full min-h-[200px]">
      <div className="relative flex items-center justify-center w-20 h-20">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary-500/20 blur-sm"></div>
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 border-r-indigo-500 animate-[spin_1s_linear_infinite]"></div>
        {/* Inner pulsing circle */}
        <div className="absolute w-8 h-8 bg-gradient-to-tr from-primary-400 to-indigo-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
      </div>
      <p className="text-slate-300 font-display font-medium tracking-widest uppercase text-sm animate-pulse">
        {message}
      </p>
    </div>
  );
};
