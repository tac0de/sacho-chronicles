import type { Engine } from '../core/simulation/Engine.js';
import { LOCATIONS } from '../data/locations.js';
import { SoundManager } from '../core/audio/SoundManager.js';

const HEAVENLY_STEMS = ['갑(甲)', '을(乙)', '병(丙)', '정(丁)', '무(戊)', '기(己)', '경(庚)', '신(辛)', '임(壬)', '계(癸)'];
const EARTHLY_BRANCHES = ['자(子)', '축(丑)', '인(寅)', '묘(卯)', '진(辰)', '사(巳)', '오(午)', '미(未)', '신(申)', '유(酉)', '술(戌)', '해(亥)'];

function getSexagenaryDay(day: number): string {
  const stem = HEAVENLY_STEMS[(day - 1) % 10];
  const branch = EARTHLY_BRANCHES[(day - 1) % 12];
  return `${stem[0]}${branch[0]}일 (${stem.slice(2, 3)}${branch.slice(2, 3)}日)`;
}

export class HeaderView {
  private container: HTMLElement;
  private engine: Engine;
  private onDebugToggle: () => void;
  private onAdvanceDay: () => void;
  private onReseed: (seed: string) => void;
  private onCompileSilok: () => void;
  private sound: SoundManager;

  constructor(
    container: HTMLElement,
    engine: Engine,
    callbacks: {
      onDebugToggle: () => void;
      onAdvanceDay: () => void;
      onReseed: (seed: string) => void;
      onCompileSilok: () => void;
    }
  ) {
    this.container = container;
    this.engine = engine;
    this.onDebugToggle = callbacks.onDebugToggle;
    this.onAdvanceDay = callbacks.onAdvanceDay;
    this.onReseed = callbacks.onReseed;
    this.onCompileSilok = callbacks.onCompileSilok;
    this.sound = SoundManager.getInstance();
  }

  public render(isDebugOpen: boolean): void {
    const day = this.engine.timeManager.currentDay;
    const phase = this.engine.timeManager.currentPhase;
    const locName = LOCATIONS[this.engine.playerLocation]?.name || '사정전';
    const sexagenary = getSexagenaryDay(day);
    const isMuted = this.sound.isMuted();
    const isBgmMuted = this.sound.isBgmMuted();

    let phaseText = '처소 선택';
    let btnText = '입조 관찰 ➔';
    let btnClass = 'btn-gold';

    if (phase === 'OBSERVATION_RECORD') {
      phaseText = '사초 집필';
      btnText = '사초 봉인 ➔';
      btnClass = 'btn-primary';
    } else if (phase === 'DAY_COMPLETED') {
      phaseText = '정산 완료';
      btnText = `익일(Day ${day + 1}) ➔`;
      btnClass = 'btn-gold';
    }

    this.container.innerHTML = `
      <div class="app-header">
        <div class="header-brand">
          <img class="seal-emblem-img" src="./favicon.svg" alt="춘추관 인장" width="36" height="36" />
          <div class="title-group">
            <div class="title-row">
              <h1>사초 (史草)</h1>
              <span class="title-tag">: 춘추필법</span>
            </div>
            <div class="subtitle">조선 춘추관 사관 정치 시뮬레이션</div>
          </div>
        </div>

        <div class="header-status-group">
          <div class="day-badge">
            <span class="day-num">Day ${day}</span>
            <span class="day-sexagenary">${sexagenary}</span>
          </div>
          <div class="phase-indicator">
            <span class="hud-val-gold">🏛️ ${locName}</span>
            <span class="hud-sep">·</span>
            <span class="hud-val-text">${phaseText}</span>
          </div>
          <div class="seed-box" title="세계 생성 개벽 시드">
            <span class="seed-label">🌱</span>
            <input type="text" id="seed-input" value="${this.engine.seed}" title="시드를 변경하고 Enter를 누르면 재시작합니다" />
            <button id="btn-seed-apply" class="btn btn-secondary btn-xs" title="새 시드로 세계 재시작">적용</button>
          </div>
        </div>

        <div class="header-divider"></div>

        <div class="header-actions">
          <button id="btn-bgm-toggle" class="btn btn-secondary btn-icon btn-audio" title="${isBgmMuted ? '궁중 정악 풍류음 켜기' : '궁중 정악 풍류음 끄기'}">
            ${isBgmMuted ? '🔇 풍류' : '🎵 풍류'}
          </button>
          <button id="btn-sound-toggle" class="btn btn-secondary btn-icon btn-audio" title="${isMuted ? '궁중 효과음 켜기' : '궁중 효과음 끄기'}">
            ${isMuted ? '🔇 무음' : '🔊 음향'}
          </button>
          <button id="btn-compile-silok" class="btn btn-secondary" title="현재까지의 사초를 바탕으로 실록을 편찬하고 역사의 심판을 받습니다">
            📜 실록 편찬
          </button>
          <button id="btn-advance" class="btn ${btnClass}">
            ${btnText}
          </button>
          <button id="btn-debug-toggle" class="btn btn-debug ${isDebugOpen ? 'active' : ''}">
            ⚙️ 감찰록 ${isDebugOpen ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    `;

    // Event listeners
    const btnBgm = this.container.querySelector('#btn-bgm-toggle');
    btnBgm?.addEventListener('click', () => {
      this.sound.toggleBgm();
      this.render(isDebugOpen);
    });

    const btnSound = this.container.querySelector('#btn-sound-toggle');
    btnSound?.addEventListener('click', () => {
      const nowMuted = this.sound.toggleMute();
      if (!nowMuted) {
        this.sound.playStamp();
      }
      this.render(isDebugOpen);
    });

    const btnCompile = this.container.querySelector('#btn-compile-silok');
    btnCompile?.addEventListener('click', () => {
      this.sound.playStamp();
      this.onCompileSilok();
    });

    const btnAdvance = this.container.querySelector('#btn-advance');
    btnAdvance?.addEventListener('click', () => {
      this.sound.playChime();
      this.onAdvanceDay();
    });

    const btnDebug = this.container.querySelector('#btn-debug-toggle');
    btnDebug?.addEventListener('click', () => {
      this.sound.playScroll();
      this.onDebugToggle();
    });

    const seedInput = this.container.querySelector('#seed-input') as HTMLInputElement;
    const btnSeed = this.container.querySelector('#btn-seed-apply');

    const triggerReseed = () => {
      const val = seedInput?.value.trim();
      if (val) {
        this.sound.playStamp();
        this.onReseed(val);
      }
    };

    btnSeed?.addEventListener('click', triggerReseed);
    seedInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerReseed();
    });
  }
}
