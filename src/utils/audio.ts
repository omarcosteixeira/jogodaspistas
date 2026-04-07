export const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export const playTone = (freq: number, type: OscillatorType, duration: number) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const playCorrectSound = () => {
  playTone(600, 'sine', 0.1);
  setTimeout(() => playTone(800, 'sine', 0.2), 100);
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
};

export const playWrongSound = () => {
  playTone(300, 'square', 0.3);
  setTimeout(() => playTone(150, 'square', 0.4), 150);
  if (navigator.vibrate) navigator.vibrate([300]);
};

export const playTickSound = () => {
  playTone(800, 'sine', 0.05);
};
