/**
 * 조선 궁중 효과음 합성 사운드 매니저 (Web Audio API 기반)
 * 외부 음원 파일 의존 없이 100% 브라우저 내장 오디오 신디사이저로
 * 붓글씨, 묵직한 낙관 타격음, 궁중 편종(鐘) 소리, 두루마리 마찰음을 즉각 합성 재생합니다.
 */
export class SoundManager {
  private static instance: SoundManager | null = null;
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private bgmMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private bgmIntervalId: ReturnType<typeof setInterval> | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private isBgmRunning: boolean = false;

  private constructor() {
    try {
      this.muted = localStorage.getItem('sacho_sound_muted') === 'true';
    } catch {
      this.muted = false;
    }

    try {
      this.bgmMuted = localStorage.getItem('sacho_bgm_muted') === 'true';
    } catch {
      this.bgmMuted = false;
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

  public isBgmMuted(): boolean {
    return this.bgmMuted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('sacho_sound_muted', this.muted ? 'true' : 'false');
    } catch {}
    return this.muted;
  }

  public toggleBgm(): boolean {
    this.bgmMuted = !this.bgmMuted;
    try {
      localStorage.setItem('sacho_bgm_muted', this.bgmMuted ? 'true' : 'false');
    } catch {}

    if (this.bgmMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.bgmMuted;
  }

  /**
   * 조선 궁중 정악/풍류 앰비언트 배경음악 생성기 (Procedural Ambient BGM)
   * 은은한 오경(五更) 깊은 밤의 저음 공명 드론과 오음음계(궁·상·각·치·우) 가야금·대금 선율을
   * 순수 Web Audio 신디사이저로 무한 자동 생성합니다.
   */
  public startBgm(): void {
    if (this.bgmMuted || this.isBgmRunning) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      this.isBgmRunning = true;
      const now = ctx.currentTime;

      // 마스터 BGM 게인 노드 (자극적이지 않고 은은하게 배경에 스미는 볼륨)
      this.bgmGain = ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.001, now);
      this.bgmGain.gain.linearRampToValueAtTime(0.065, now + 3.0);
      this.bgmGain.connect(ctx.destination);

      // 1. 궁궐 심야의 은은한 바탕 저음 드론 (C2 65.41Hz, G2 98.0Hz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);

      this.droneOsc1 = ctx.createOscillator();
      this.droneOsc2 = ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc2.type = 'triangle';
      this.droneOsc1.frequency.setValueAtTime(65.41, now); // C2
      this.droneOsc2.frequency.setValueAtTime(98.0, now);  // G2

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.35, now);

      this.droneOsc1.connect(filter);
      this.droneOsc2.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(this.bgmGain);

      this.droneOsc1.start(now);
      this.droneOsc2.start(now);

      // 2. 가야금/대금 오음음계 (C, D, F, G, A) 선율 루프
      const pentatonicScale = [
        130.81, // C3 (궁)
        146.83, // D3 (상)
        174.61, // F3 (각)
        196.00, // G3 (치)
        220.00, // A3 (우)
        261.63, // C4
        293.66, // D4
        349.23, // F4
        392.00, // G4
        440.00, // A4
        523.25, // C5
      ];

      let noteIndex = 0;
      const melodySequence = [0, 2, 3, 4, 3, 2, 5, 4, 3, 1, 0, 3, 5, 7, 6, 5, 3];

      const playMelodyNote = () => {
        if (!this.isBgmRunning || this.bgmMuted || !this.ctx || !this.bgmGain) return;
        try {
          const t = this.ctx.currentTime;
          const noteIdx = melodySequence[noteIndex % melodySequence.length];
          noteIndex++;

          // 20% 확률로 가끔 한 옥타브 위 대금 취음(Flute) 연주
          if (Math.random() < 0.22) {
            this.playFluteSigh(this.ctx, this.bgmGain, t, pentatonicScale[Math.min(noteIdx + 4, pentatonicScale.length - 1)]);
          } else {
            this.playStringPluck(this.ctx, this.bgmGain, t, pentatonicScale[noteIdx]);
          }
        } catch {}
      };

      // 첫 음표는 1.5초 후 시작, 이후 3.2초~5.5초 간격으로 유유자적하게 연주
      this.bgmIntervalId = setInterval(() => {
        playMelodyNote();
      }, 3800);

      setTimeout(() => {
        playMelodyNote();
      }, 1200);

    } catch {}
  }

  /**
   * 현악기(가야금/거문고) 농현(弄絃) 뜯는 소리 합성
   */
  private playStringPluck(ctx: AudioContext, destination: AudioNode, time: number, freq: number): void {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noteGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    // 미세한 음程과 배음
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 2, time);

    // 농현 (한국 전통 현악기의 농밀한 비브라토/꺾임)
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.setValueAtTime(4.8, time);
    vibratoGain.gain.setValueAtTime(0, time);
    vibratoGain.gain.linearRampToValueAtTime(freq * 0.025, time + 0.5); // 서서히 꺾임
    vibrato.connect(osc1.frequency);
    vibrato.start(time + 0.3);
    vibrato.stop(time + 2.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(250, time + 1.8);

    noteGain.gain.setValueAtTime(0.001, time);
    noteGain.gain.linearRampToValueAtTime(0.4, time + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + 2.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 2.3);
    osc2.stop(time + 2.3);
  }

  /**
   * 대금(大琴) 청아한 젓대 취음 소리 합성
   */
  private playFluteSigh(ctx: AudioContext, destination: AudioNode, time: number, freq: number): void {
    const fluteOsc = ctx.createOscillator();
    const fluteGain = ctx.createGain();
    const fluteFilter = ctx.createBiquadFilter();

    fluteOsc.type = 'sine';
    fluteOsc.frequency.setValueAtTime(freq, time);

    // 대금 청소리 비브라토
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vib.frequency.setValueAtTime(5.2, time);
    vibGain.gain.setValueAtTime(freq * 0.018, time);
    vib.connect(fluteOsc.frequency);
    vib.start(time);
    vib.stop(time + 3.2);

    fluteFilter.type = 'bandpass';
    fluteFilter.frequency.setValueAtTime(freq, time);
    fluteFilter.Q.setValueAtTime(3.5, time);

    fluteGain.gain.setValueAtTime(0.001, time);
    fluteGain.gain.linearRampToValueAtTime(0.22, time + 0.8);
    fluteGain.gain.exponentialRampToValueAtTime(0.001, time + 3.0);

    fluteOsc.connect(fluteFilter);
    fluteFilter.connect(fluteGain);
    fluteGain.connect(destination);

    fluteOsc.start(time);
    fluteOsc.stop(time + 3.2);
  }

  public stopBgm(): void {
    if (!this.isBgmRunning) return;
    this.isBgmRunning = false;

    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }

    if (this.bgmGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.bgmGain.gain.linearRampToValueAtTime(0.001, now + 0.8);
      } catch {}
    }

    setTimeout(() => {
      try {
        this.droneOsc1?.stop();
        this.droneOsc2?.stop();
        this.droneOsc1?.disconnect();
        this.droneOsc2?.disconnect();
        this.bgmGain?.disconnect();
      } catch {}
      this.droneOsc1 = null;
      this.droneOsc2 = null;
      this.bgmGain = null;
    }, 900);
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
