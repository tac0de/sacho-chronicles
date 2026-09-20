import { Engine, type PendingSachoChoice } from '../core/simulation/Engine.js';
import { HeaderView } from './HeaderView.js';
import { LocationView } from './LocationView.js';
import { ObservationView } from './ObservationView.js';
import { CourtRosterView } from './CourtRosterView.js';
import { SachoArchiveView } from './SachoArchiveView.js';
import { DebugPanelView } from './DebugPanelView.js';
import { SilokEndingView } from './SilokEndingView.js';
import type { LocationId } from '../data/locations.js';
import { SoundManager } from '../core/audio/SoundManager.js';

type MainTab = 'OBSERVATION' | 'SACHO_BOOK' | 'EVENT_LOG';

export class UIManager {
  private root: HTMLElement;
  private engine: Engine;

  private isDebugOpen: boolean = false;
  private isEndingOpen: boolean = false;
  private activeMainTab: MainTab = 'OBSERVATION';

  // Subviews
  private headerView!: HeaderView;
  private locationView!: LocationView;
  private observationView!: ObservationView;
  private courtRosterView!: CourtRosterView;
  private sachoArchiveView!: SachoArchiveView;
  private debugPanelView!: DebugPanelView;
  private endingView: SilokEndingView | null = null;

  constructor(root: HTMLElement, initialSeed: number | string = 12345) {
    this.root = root;
    this.engine = new Engine(initialSeed);
  }

  public init(): void {
    this.root.innerHTML = `
      <div id="header-root"></div>
      <div class="app-body">
        <div id="location-root"></div>
        <div class="main-stage">
          <div class="stage-nav">
            <button class="nav-tab active" id="tab-obs">오늘의 관찰 및 사초</button>
            <button class="nav-tab" id="tab-sacho">사초 기록부 (史草)</button>
            <button class="nav-tab" id="tab-events">최근 조정 사건록</button>
          </div>
          <div id="stage-body"></div>
        </div>
        <div id="roster-root"></div>
        <div id="debug-root"></div>
      </div>
      <div id="ending-root"></div>
    `;

    const headerEl = this.root.querySelector('#header-root') as HTMLElement;
    const locationEl = this.root.querySelector('#location-root') as HTMLElement;
    const stageBodyEl = this.root.querySelector('#stage-body') as HTMLElement;
    const rosterEl = this.root.querySelector('#roster-root') as HTMLElement;
    const debugEl = this.root.querySelector('#debug-root') as HTMLElement;

    // Initialize subviews
    this.headerView = new HeaderView(headerEl, this.engine, {
      onDebugToggle: () => this.toggleDebug(),
      onAdvanceDay: () => this.handleAdvanceButton(),
      onReseed: (seed) => this.handleReseed(seed),
      onCompileSilok: () => this.openSilokEnding(),
    });

    this.locationView = new LocationView(locationEl, this.engine, (loc: LocationId) => {
      this.engine.setPlayerLocation(loc);
      this.render();
    });

    this.observationView = new ObservationView(stageBodyEl, this.engine, (choices: PendingSachoChoice[]) => {
      this.engine.commitSacho(choices);
      const nextDay = this.engine.proceedToNextDay();
      this.activeMainTab = 'OBSERVATION';
      if (nextDay > 30) {
        this.openSilokEnding();
        return;
      }
      this.render();
    });

    this.courtRosterView = new CourtRosterView(rosterEl, this.engine);
    this.sachoArchiveView = new SachoArchiveView(stageBodyEl, this.engine);

    this.debugPanelView = new DebugPanelView(debugEl, this.engine, {
      onClose: () => this.toggleDebug(),
      onFastForward: (days) => this.handleFastForward(days),
    });

    // Main nav tab listeners
    this.root.querySelector('#tab-obs')?.addEventListener('click', () => {
      this.setTab('OBSERVATION');
    });
    this.root.querySelector('#tab-sacho')?.addEventListener('click', () => {
      this.setTab('SACHO_BOOK');
    });
    this.root.querySelector('#tab-events')?.addEventListener('click', () => {
      this.setTab('EVENT_LOG');
    });

    this.render();
  }

  private setTab(tab: MainTab): void {
    if (this.activeMainTab !== tab) {
      SoundManager.getInstance().playScroll();
    }
    this.activeMainTab = tab;
    this.render();
  }

  private toggleDebug(): void {
    this.isDebugOpen = !this.isDebugOpen;
    this.render();
  }

  private handleAdvanceButton(): void {
    const phase = this.engine.timeManager.currentPhase;

    if (phase === 'LOCATION_SELECTION') {
      this.engine.executeDay();
      this.activeMainTab = 'OBSERVATION';
    } else if (phase === 'OBSERVATION_RECORD') {
      this.engine.proceedToNextDay();
      this.activeMainTab = 'OBSERVATION';
    } else if (phase === 'DAY_COMPLETED') {
      const nextDay = this.engine.proceedToNextDay();
      this.activeMainTab = 'OBSERVATION';
      if (nextDay > 30) {
        this.openSilokEnding();
        return;
      }
    }
    this.render();
  }

  private handleReseed(seed: string): void {
    this.engine.initWorld(seed);
    this.activeMainTab = 'OBSERVATION';
    this.render();
  }

  private handleFastForward(days: number): void {
    this.engine.runAutoDays(days);
    this.render();
  }

  private openSilokEnding(): void {
    this.isEndingOpen = true;
    const endingResult = this.engine.compileSilok();
    const endingRoot = this.root.querySelector('#ending-root') as HTMLElement;
    this.endingView = new SilokEndingView(endingRoot, endingResult, {
      onRestart: (newSeed) => {
        this.isEndingOpen = false;
        endingRoot.innerHTML = '';
        this.handleReseed(newSeed || '12345');
      },
      onClose: () => {
        this.isEndingOpen = false;
        endingRoot.innerHTML = '';
        this.setTab('SACHO_BOOK');
      },
    });
    this.endingView.render();
  }

  public render(): void {
    // 1. Header
    this.headerView.render(this.isDebugOpen);

    // 2. Locations sidebar
    this.locationView.render();

    // 3. Main Stage Body according to tab
    this.updateTabStyles();
    const stageBodyEl = this.root.querySelector('#stage-body') as HTMLElement;

    if (this.activeMainTab === 'OBSERVATION') {
      this.observationView.render();
    } else if (this.activeMainTab === 'SACHO_BOOK') {
      this.sachoArchiveView.render();
    } else if (this.activeMainTab === 'EVENT_LOG') {
      this.renderRecentEventsTab(stageBodyEl);
    }

    // 4. Officials roster
    this.courtRosterView.render();

    // 5. Debug panel
    this.debugPanelView.render(this.isDebugOpen);
  }

  private updateTabStyles(): void {
    const tabObs = this.root.querySelector('#tab-obs');
    const tabSacho = this.root.querySelector('#tab-sacho');
    const tabEvents = this.root.querySelector('#tab-events');

    tabObs?.classList.toggle('active', this.activeMainTab === 'OBSERVATION');
    tabSacho?.classList.toggle('active', this.activeMainTab === 'SACHO_BOOK');
    tabEvents?.classList.toggle('active', this.activeMainTab === 'EVENT_LOG');
  }

  private renderRecentEventsTab(stageBody: HTMLElement): void {
    const events = [...this.engine.allEventsHistory].slice(-25).reverse();

    if (events.length === 0) {
      stageBody.innerHTML = `
        <div class="stage-content">
          <div class="observation-banner">
            <h3>최근 조정 사건록 (最近 朝廷 事件錄)</h3>
            <p>궐내에서 발생한 주요 정치적 사건들의 공식 기록입니다.</p>
          </div>
          <div class="empty-observation">
            <h4>아직 기록된 공식 사건이 없습니다</h4>
            <p>날이 흐르면 조정의 암투와 국왕의 치도에 관한 사건들이 이곳에 일자별로 남겨집니다.</p>
          </div>
        </div>
      `;
      return;
    }

    const itemsHtml = events
      .map((ev) => {
        return `
          <div class="sacho-archive-item" style="border-left-color: var(--border-gold);">
            <div class="sacho-archive-meta">
              <span class="sacho-archive-day">Day ${ev.day}</span>
              <span>|</span>
              <span style="color:var(--text-gold); font-weight:600;">${ev.title}</span>
              <span style="margin-left:auto; font-size:11px; color:var(--text-muted);">${ev.type}</span>
            </div>
            <div class="sacho-archive-text" style="font-size:14px; color:var(--text-main);">
              ${ev.summary}
            </div>
          </div>
        `;
      })
      .join('');

    stageBody.innerHTML = `
      <div class="stage-content">
        <div class="observation-banner">
          <h3>최근 조정 사건록 (最近 朝廷 事件錄) — 총 ${events.length}건</h3>
          <p>궐내에 공식적으로 알려진 사건들입니다. 은밀한 진실은 사관의 관찰과 디버그 모드를 통해 드러납니다.</p>
        </div>
        <div class="sacho-archive-view">
          ${itemsHtml}
        </div>
      </div>
    `;
  }
}
