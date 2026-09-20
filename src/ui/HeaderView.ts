import type { Engine } from '../core/simulation/Engine.js';
import { LOCATIONS } from '../data/locations.js';
import { SoundManager } from '../core/audio/SoundManager.js';
import { renderIcon } from './icons/Icons.js';

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
  private onOpenDynastyArchive?: () => void;
  private sound: SoundManager;

  constructor(
    container: HTMLElement,
    engine: Engine,
    callbacks: {
      onDebugToggle: () => void;
      onAdvanceDay: () => void;
      onReseed: (seed: string) => void;
      onCompileSilok: () => void;
      onOpenDynastyArchive?: () => void;
    }
  ) {
    this.container = container;
    this.engine = engine;
    this.onDebugToggle = callbacks.onDebugToggle;
    this.onAdvanceDay = callbacks.onAdvanceDay;
    this.onReseed = callbacks.onReseed;
    this.onCompileSilok = callbacks.onCompileSilok;
    this.onOpenDynastyArchive = callbacks.onOpenDynastyArchive;
    this.sound = SoundManager.getInstance();
  }

  public render(isDebugOpen: boolean): void {
    const day = this.engine.timeManager.currentDay;
    const phase = this.engine.timeManager.currentPhase;
    const locName = LOCATIONS[this.engine.playerLocation]?.name || '사정전';
    const sexagenary = getSexagenaryDay(day);
    const isMuted = this.sound.isMuted();
    const isBgmMuted = this.sound.isBgmMuted();

    const stats = this.engine.scribeStats;
    const king = this.engine.dynastyManager.getCurrentKing();

    let phaseText = '처소 선택';
    let btnText = `${renderIcon('palace')} 입조 관찰 ${renderIcon('arrow-right')}`;
    let btnClass = 'btn-gold';

    if (phase === 'OBSERVATION_RECORD') {
      phaseText = '사초 집필';
      btnText = `${renderIcon('brush')} 사초 봉인 ${renderIcon('arrow-right')}`;
      btnClass = 'btn-primary';
    } else if (phase === 'NIGHT_VISITATION') {
      phaseText = '심야 결단';
      btnText = `${renderIcon('moon')} 심야 처소 ${renderIcon('arrow-right')}`;
      btnClass = 'btn-gold';
    } else if (phase === 'DAY_COMPLETED') {
      phaseText = '정산 완료';
      btnText = `익일(Day ${day + 1}) ${renderIcon('arrow-right')}`;
      btnClass = 'btn-gold';
    }

    this.container.innerHTML = `
      <div class="app-header">
        <div class="header-main-row">
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

          <div class="day-badge">
            <span class="day-num">Day ${day}</span>
            <span class="day-sexagenary">${sexagenary}</span>
          </div>

          <div class="header-scribe-stats" title="사관 가문 위상 및 당대 군주">
            <span class="hud-stat-chip chip-integrity" title="직필 신념">${renderIcon('scale')} ${stats.integrity}</span>
            <span class="hud-stat-chip chip-peril" title="사화 위기">${renderIcon('flame')} ${stats.peril}%</span>
            <span class="hud-stat-chip chip-wealth" title="가문 재력">${renderIcon('coins')} ${stats.wealth}냥</span>
            <span class="hud-stat-chip chip-king" title="당대 재위 군주">${renderIcon('crown')} ${king.templeName.slice(0, 3)}</span>
          </div>

          <div class="seed-box" title="세계 생성 개벽 시드">
            <span class="seed-label">${renderIcon('sprout')}</span>
            <input type="text" id="seed-input" value="${this.engine.seed}" title="시드를 변경하고 Enter를 누르면 재시작합니다" />
            <button id="btn-seed-apply" class="btn btn-secondary btn-xs" title="새 시드로 세계 재시작">적용</button>
          </div>

          <div class="header-quick-tools">
            <button id="btn-dynasty-archive" class="btn btn-secondary btn-icon btn-archive-quick" title="조선 역대 실록 서고 및 사관 가문 업적 열람">
              ${renderIcon('book')} <span class="btn-text">가문서고</span>
            </button>
            <button id="btn-bgm-toggle" class="btn btn-secondary btn-icon btn-audio" title="${isBgmMuted ? '궁중 정악 풍류음 켜기' : '궁중 정악 풍류음 끄기'}">
              ${renderIcon(isBgmMuted ? 'music-off' : 'music')} <span class="btn-text">풍류</span>
            </button>
            <button id="btn-sound-toggle" class="btn btn-secondary btn-icon btn-audio" title="${isMuted ? '궁중 효과음 켜기' : '궁중 효과음 끄기'}">
              ${renderIcon(isMuted ? 'volume-x' : 'volume')} <span class="btn-text">${isMuted ? '무음' : '음향'}</span>
            </button>
            <button id="btn-debug-toggle" class="btn btn-debug ${isDebugOpen ? 'active' : ''}" title="사헌부 은밀 감찰록 열람">
              ${renderIcon('shield')} <span>감찰록</span> <span class="debug-state-tag">${isDebugOpen ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        <div class="header-divider"></div>

        <div class="header-sub-row">
          <div class="phase-indicator">
            <span class="hud-val-gold">${renderIcon('palace')} ${locName}</span>
            <span class="hud-sep">·</span>
            <span class="hud-val-text">${phaseText}</span>
          </div>

          <div class="header-actions">
            <button id="btn-compile-silok" class="btn btn-secondary btn-compile" title="현재까지의 사초를 바탕으로 실록을 편찬하고 역사의 심판을 받습니다">
              ${renderIcon('scroll')} <span class="btn-compile-text">실록 편찬</span>
            </button>
            <button id="btn-advance" class="btn ${btnClass}">
              ${btnText}
            </button>
          </div>
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

    const btnArchive = this.container.querySelector('#btn-dynasty-archive');
    btnArchive?.addEventListener('click', () => {
      this.sound.playScroll();
      this.onOpenDynastyArchive?.();
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
