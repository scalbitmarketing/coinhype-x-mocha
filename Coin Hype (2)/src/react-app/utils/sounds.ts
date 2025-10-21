export default class SoundManager {
  private audioContext: AudioContext | null = null;
  
  constructor() {
    // Initialize audio context on first user interaction
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  private createBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  play(soundType: 'click' | 'win' | 'lose') {
    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    switch (soundType) {
      case 'click':
        this.createBeep(800, 0.1, 'square');
        break;
      case 'win':
        // Create a winning jingle
        setTimeout(() => this.createBeep(523, 0.2), 0);    // C
        setTimeout(() => this.createBeep(659, 0.2), 100);  // E
        setTimeout(() => this.createBeep(784, 0.3), 200);  // G
        break;
      case 'lose':
        this.createBeep(200, 0.5, 'sawtooth');
        break;
    }
  }

  // Cleanup method
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
