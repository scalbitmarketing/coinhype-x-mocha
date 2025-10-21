export default class EnhancedSportsSoundManager {
  private audioContext: AudioContext | null = null;
  private soundCache: Map<string, AudioBuffer> = new Map();
  private gainNode: GainNode | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0.4; // Default volume
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  private createSyntheticSound(type: string): AudioBuffer | null {
    if (!this.audioContext) return null;

    const duration = type === 'success' ? 0.6 : 0.2;
    const sampleRate = this.audioContext.sampleRate;
    const frames = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, frames, sampleRate);
    const data = buffer.getChannelData(0);

    switch (type) {
      case 'tap':
        this.generateTap(data, frames, sampleRate);
        break;
      case 'select':
        this.generateSelect(data, frames, sampleRate);
        break;
      case 'success':
        this.generateSuccess(data, frames, sampleRate);
        break;
      case 'error':
        this.generateError(data, frames, sampleRate);
        break;
      default:
        return null;
    }

    return buffer;
  }

  private generateTap(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 15);
      const freq = 600 + Math.sin(t * 40) * 100;
      data[i] = Math.sin(freq * 2 * Math.PI * t) * envelope * 0.3;
    }
  }

  private generateSelect(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 12);
      const freq = 800 + t * 200; // Rising tone
      data[i] = Math.sin(freq * 2 * Math.PI * t) * envelope * 0.35;
    }
  }

  private generateSuccess(data: Float32Array, frames: number, sampleRate: number) {
    // Success chime - C major arpeggio
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3);
      let sample = 0;
      
      notes.forEach((freq, index) => {
        const delay = index * 0.1;
        if (t > delay) {
          const noteEnv = Math.exp(-(t - delay) * 4);
          sample += Math.sin(freq * 2 * Math.PI * (t - delay)) * noteEnv;
        }
      });
      
      data[i] = sample * envelope * 0.25;
    }
  }

  private generateError(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      const freq = 300 - t * 150; // Descending tone
      data[i] = Math.sin(freq * 2 * Math.PI * t) * envelope * 0.3;
    }
  }

  private async loadSound(type: string): Promise<AudioBuffer | null> {
    if (this.soundCache.has(type)) {
      return this.soundCache.get(type)!;
    }

    const buffer = this.createSyntheticSound(type);
    if (buffer) {
      this.soundCache.set(type, buffer);
    }
    
    return buffer;
  }

  async play(type: 'tap' | 'select' | 'success' | 'error') {
    if (!this.audioContext || !this.gainNode) return;

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const buffer = await this.loadSound(type);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.start();
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  mute() {
    this.setVolume(0);
  }

  unmute() {
    this.setVolume(0.4);
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundCache.clear();
  }
}

// Global instance
let sportsSoundManager: EnhancedSportsSoundManager | null = null;

export function getSportsSoundManager(): EnhancedSportsSoundManager {
  if (!sportsSoundManager) {
    sportsSoundManager = new EnhancedSportsSoundManager();
  }
  return sportsSoundManager;
}
