import type { Engine } from '../core/simulation/Engine.js';
import { LOCATIONS } from '../data/locations.js';

export class HeaderView {
  private container: HTMLElement;
  private engine: Engine;
  private onDebugToggle: () => void;
  private onAdvanceDay: () => void;
  private onReseed: (seed: string) => void;

  constructor(
    container: HTMLElement,
    engine: Engine,
    callbacks: {
      onDebugToggle: () => void;
      onAdvanceDay: () => void;
      onReseed: (seed: string) => void;
    }
  ) {
    this.container = container;
    this.engine = engine;
    this.onDebugToggle = callbacks.onDebugToggle;
    this.onAdvanceDay = callbacks.onAdvanceDay;
    this.onReseed = callbacks.onReseed;
  }

  public render(isDebugOpen: boolean): void {
    const day = this.engine.timeManager.currentDay;
    const phase = this.engine.timeManager.currentPhase;
    const locName = LOCATIONS[this.engine.playerLocation]?.name || '편전';

    let phaseText = '장소 선택';
    let btnText = '당일 정무 관찰 시작';
    let btnClass = 'btn-gold';

    if (phase === 'OBSERVATION_RECORD') {
      phaseText = '사초 집필 중';
      btnText = '사초 집필 완료';
      btnClass = 'btn-primary';
    } else if (phase === 'DAY_COMPLETED') {
      phaseText = '정산 완료';
      btnText = '다음 날(Day ' + (day + 1) + ')로 진행';
      btnClass = 'btn-gold';
    }

    this.container.innerHTML = `
      <div class="app-header">
        <div class="header-brand">
          <div class="seal-emblem">史</div>
          <div class="title-group">
            <h1>사초 (史草) <span style="font-size:14px; font-weight:normal; color:#c5a059;">: 춘추필법</span></h1>
            <div class="subtitle">조선 사관 정치 시뮬레이션 — The Silent Brush</div>
          </div>
        </div>

        <div class="header-status-group">
          <div class="day-badge">Day ${day}</div>
          <div class="phase-indicator">
            <span style="color:var(--text-muted)">현재 위치:</span> <strong style="color:var(--text-gold)">${locName}</strong>
            <span style="color:var(--border-strong); margin:0 6px;">|</span>
            <span style="color:var(--text-muted)">단계:</span> <span>${phaseText}</span>
          </div>
          <div class="seed-box">
            <span>Seed:</span>
            <input type="text" id="seed-input" value="${this.engine.seed}" title="시드를 변경하고 Enter를 누르면 재시작합니다" />
            <button id="btn-seed-apply" class="btn btn-secondary btn-sm" title="새 시드로 세계 재시작">적용</button>
          </div>
        </div>

        <div class="header-actions">
          <button id="btn-advance" class="btn ${btnClass}">
            ${btnText}
          </button>
          <button id="btn-debug-toggle" class="btn btn-debug ${isDebugOpen ? 'active' : ''}">
            ⚙ 디버그 모드 ${isDebugOpen ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    `;

    // Event listeners
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
