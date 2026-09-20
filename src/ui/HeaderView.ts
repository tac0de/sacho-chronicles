import type { Engine } from '../core/simulation/Engine.js';
import { LOCATIONS } from '../data/locations.js';

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
  }

  public render(isDebugOpen: boolean): void {
    const day = this.engine.timeManager.currentDay;
    const phase = this.engine.timeManager.currentPhase;
    const locName = LOCATIONS[this.engine.playerLocation]?.name || '사정전';
    const sexagenary = getSexagenaryDay(day);

    let phaseText = '처소 선택';
    let btnText = '당일 정무 입조 관찰';
    let btnClass = 'btn-gold';

    if (phase === 'OBSERVATION_RECORD') {
      phaseText = '사초 집필(史草 執筆)';
      btnText = '사초 봉인 완료';
      btnClass = 'btn-primary';
    } else if (phase === 'DAY_COMPLETED') {
      phaseText = '당일 정산 완료';
      btnText = `익일(Day ${day + 1})로 진행`;
      btnClass = 'btn-gold';
    }

    this.container.innerHTML = `
      <div class="app-header">
        <div class="header-brand">
          <div class="seal-emblem">史</div>
          <div class="title-group">
            <h1>사초 (史草) <span style="font-size:14px; font-weight:normal; color:#c5a059;">: 춘추필법</span></h1>
            <div class="subtitle">조선 춘추관 사관 정치 시뮬레이션 — The Silent Brush</div>
          </div>
        </div>

        <div class="header-status-group">
          <div class="day-badge">Day ${day} <span style="font-size:11px; font-weight:normal; color:var(--text-paper); margin-left:4px;">${sexagenary}</span></div>
          <div class="phase-indicator">
            <span style="color:var(--text-muted)">입조 처소:</span> <strong style="color:var(--text-gold)">${locName}</strong>
            <span style="color:var(--border-strong); margin:0 6px;">|</span>
            <span style="color:var(--text-muted)">정무 단계:</span> <span>${phaseText}</span>
          </div>
          <div class="seed-box">
            <span>개벽 시드:</span>
            <input type="text" id="seed-input" value="${this.engine.seed}" title="시드를 변경하고 Enter를 누르면 재시작합니다" />
            <button id="btn-seed-apply" class="btn btn-secondary btn-sm" title="새 시드로 세계 재시작">적용</button>
          </div>
        </div>

        <div class="header-actions">
          <button id="btn-compile-silok" class="btn btn-secondary" title="현재까지의 사초를 바탕으로 실록을 편찬하고 역사의 심판을 받습니다">
            📜 실록 편찬 (결산)
          </button>
          <button id="btn-advance" class="btn ${btnClass}">
            ${btnText}
          </button>
          <button id="btn-debug-toggle" class="btn btn-debug ${isDebugOpen ? 'active' : ''}">
            ⚙️ 사헌부 감찰록 (디버그) ${isDebugOpen ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    `;

    // Event listeners
    const btnCompile = this.container.querySelector('#btn-compile-silok');
    btnCompile?.addEventListener('click', () => {
      this.onCompileSilok();
    });

    const btnAdvance = this.container.querySelector('#btn-advance');
    btnAdvance?.addEventListener('click', () => {
      this.onAdvanceDay();
    });

    const btnDebug = this.container.querySelector('#btn-debug-toggle');
    btnDebug?.addEventListener('click', () => {
      this.onDebugToggle();
    });

    const seedInput = this.container.querySelector('#seed-input') as HTMLInputElement;
    const btnSeed = this.container.querySelector('#btn-seed-apply');

    const triggerReseed = () => {
      const val = seedInput?.value.trim();
      if (val) this.onReseed(val);
    };

    btnSeed?.addEventListener('click', triggerReseed);
    seedInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerReseed();
    });
  }
}
