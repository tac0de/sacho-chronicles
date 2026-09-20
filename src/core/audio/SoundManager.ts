/**
 * 조선 궁중 효과음 합성 사운드 매니저 (Web Audio API 기반)
 * 외부 음원 파일 의존 없이 100% 브라우저 내장 오디오 신디사이저로
 * 붓글씨, 묵직한 낙관 타격음, 궁중 편종(鐘) 소리, 두루마리 마찰음을 즉각 합성 재생합니다.
 */
export class SoundManager {
  private static instance: SoundManager | null = null;
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private constructor() {
    try {
      this.muted = localStorage.getItem('sacho_sound_muted') === 'true';
    } catch {
      this.muted = false;
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('sacho_sound_muted', this.muted ? 'true' : 'false');
    } catch {}
    return this.muted;
  }

  /**
   * 붓글씨 사각거리는 소리 (Brush stroke / Paper friction)
   * 한지 위에 말총 붓이 스치는 질감의 대역통과 백색 소음
   */
  public playBrush(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const duration = 0.18;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      // 노이즈 버퍼 생성 (부드러운 마찰음 질감)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // 1800Hz 대역 통과 필터 (한지에 먹물 묻은 붓이 닿는 주파수 대역)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1900, ctx.currentTime);
      filter.Q.setValueAtTime(2.2, ctx.currentTime);

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + duration);
    } catch {}
  }

  /**
   * 낙관(도장) 찍는 묵직한 소리 (Seal stamp thud)
   * 옥새/사관 직인이 한지에 쾅 찍히는 둔탁한 타격음과 목재 잔향
   */
  public playStamp(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. 저주파 쿵 타격음 (140Hz -> 35Hz 피치 하강)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);

      oscGain.gain.setValueAtTime(0.55, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);

      // 2. 목재 도장 부딪히는 찰나의 딱 소리 (Wood click transient)
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(820, now);
      click.frequency.exponentialRampToValueAtTime(200, now + 0.03);

      clickGain.gain.setValueAtTime(0.4, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      click.start(now);
      click.stop(now + 0.04);
    } catch {}
  }

  /**
   * 궁중 편종/편경 및 새벽 시보 종소리 (Court chime / Pyeonjong bell)
   * 맑고 은은하게 울려 퍼지는 다중 배음 합성
   */
  public playChime(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // 궁중 정악의 맑은 배음 (C5, G5, C6)
      const freqs = [523.25, 783.99, 1046.5];
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.32, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
      masterGain.connect(ctx.destination);

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initialVol = 0.4 / (idx + 1);
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2 - idx * 0.3);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 2.4);
      });
    } catch {}
  }

  /**
   * 두루마리 펼침 및 책장 넘김 소리 (Scroll unroll / Page flip)
   */
  public playScroll(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.22;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.linearRampToValueAtTime(1800, now + 0.1);
      filter.frequency.linearRampToValueAtTime(400, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {}
  }
}
