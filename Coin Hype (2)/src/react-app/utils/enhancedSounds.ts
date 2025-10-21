export default class EnhancedSoundManager {
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
      this.gainNode.gain.value = 0.3; // Default volume
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  private createSyntheticSound(type: string): AudioBuffer | null {
    if (!this.audioContext) return null;

    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const frames = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, frames, sampleRate);
    const data = buffer.getChannelData(0);

    switch (type) {
      case 'click':
        this.generateClick(data, frames, sampleRate);
        break;
      case 'win':
        this.generateWin(data, frames, sampleRate);
        break;
      case 'lose':
        this.generateLose(data, frames, sampleRate);
        break;
      case 'spin':
        this.generateSpin(data, frames, sampleRate);
        break;
      case 'bounce':
        this.generateBounce(data, frames, sampleRate);
        break;
      case 'explosion':
        this.generateExplosion(data, frames, sampleRate);
        break;
      case 'gem':
        this.generateGem(data, frames, sampleRate);
        break;
      case 'cashout':
        this.generateCashout(data, frames, sampleRate);
        break;
      default:
        return null;
    }

    return buffer;
  }

  private generateClick(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 10);
      data[i] = Math.sin(800 * 2 * Math.PI * t) * envelope * 0.3;
    }
  }

  private generateWin(data: Float32Array, frames: number, sampleRate: number) {
    const notes = [523, 659, 784]; // C, E, G major chord
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      let sample = 0;
      
      notes.forEach(freq => {
        sample += Math.sin(freq * 2 * Math.PI * t) * envelope;
      });
      
      data[i] = sample * 0.2;
    }
  }

  private generateLose(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3);
      const freq = 200 - t * 50; // Descending tone
      data[i] = Math.sin(freq * 2 * Math.PI * t) * envelope * 0.3;
    }
  }

  private generateSpin(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = 1 - t / 0.3;
      const freq = 400 + Math.sin(t * 20) * 100;
      data[i] = Math.sin(freq * 2 * Math.PI * t) * envelope * 0.2;
    }
  }

  private generateBounce(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8) * (1 + Math.sin(t * 40));
      data[i] = Math.sin(600 * 2 * Math.PI * t) * envelope * 0.25;
    }
  }

  private generateExplosion(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 4);
      const noise = (Math.random() - 0.5) * 2;
      const tone = Math.sin(150 * 2 * Math.PI * t);
      data[i] = (noise * 0.7 + tone * 0.3) * envelope * 0.3;
    }
  }

  private generateGem(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 5);
      const freq = 800 + Math.sin(t * 30) * 200;
      data[i] = Math.sin(freq * 2 * Math.PI * t) * envelope * 0.25;
    }
  }

  private generateCashout(data: Float32Array, frames: number, sampleRate: number) {
    for (let i = 0; i < frames; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      const freq = 400 + t * 400; // Rising tone
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

  async play(type: 'click' | 'win' | 'lose' | 'spin' | 'bounce' | 'explosion' | 'gem' | 'cashout') {
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
    this.setVolume(0.3);
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundCache.clear();
  }
}
