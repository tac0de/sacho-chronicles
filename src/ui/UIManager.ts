import { Engine, type PendingSachoChoice } from '../core/simulation/Engine.js';
import { HeaderView } from './HeaderView.js';
import { LocationView } from './LocationView.js';
import { ObservationView } from './ObservationView.js';
import { NightChamberView } from './NightChamberView.js';
import { CourtRosterView } from './CourtRosterView.js';
import { SachoArchiveView } from './SachoArchiveView.js';
import { DebugPanelView } from './DebugPanelView.js';
import { SilokEndingView } from './SilokEndingView.js';
import { SilokBookletView } from './SilokBookletView.js';
import { DynastyArchiveView } from './DynastyArchiveView.js';
import { SilokCodec, type SilokShareData } from '../core/sharing/SilokCodec.js';
import type { LocationId } from '../data/locations.js';
import { SoundManager } from '../core/audio/SoundManager.js';
import { renderIcon } from './icons/Icons.js';

type MainTab = 'OBSERVATION' | 'SACHO_BOOK' | 'EVENT_LOG';
type MobileView = 'LOCATIONS' | 'STAGE' | 'ROSTER' | 'ARCHIVE';

export class UIManager {
  private root: HTMLElement;
  private engine: Engine;

  private isDebugOpen: boolean = false;
  private isEndingOpen: boolean = false;
  private isBookletOpen: boolean = false;
  private isDynastyArchiveOpen: boolean = false;
  private activeMainTab: MainTab = 'OBSERVATION';
  private activeMobileView: MobileView = 'STAGE';

  // Subviews
  private headerView!: HeaderView;
  private locationView!: LocationView;
  private observationView!: ObservationView;
  private nightChamberView!: NightChamberView;
  private courtRosterView!: CourtRosterView;
  private sachoArchiveView!: SachoArchiveView;
  private debugPanelView!: DebugPanelView;
  private endingView: SilokEndingView | null = null;
  private silokBookletView: SilokBookletView | null = null;
  private dynastyArchiveView: DynastyArchiveView | null = null;

  constructor(root: HTMLElement, initialSeed: number | string = 12345) {
    this.root = root;
    this.engine = new Engine(initialSeed);
  }

  public init(): void {
    this.root.innerHTML = `
      <div id="header-root"></div>
      <div class="app-body" data-mobile-view="STAGE">
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
      <div class="mobile-nav-bar">
        <button class="mobile-nav-btn" data-mview="LOCATIONS">
          <span class="m-icon">${renderIcon('palace')}</span>
          <span class="m-text">처소 행차</span>
        </button>
        <button class="mobile-nav-btn active" data-mview="STAGE">
          <span class="m-icon">${renderIcon('scroll')}</span>
          <span class="m-text">정무 관찰</span>
        </button>
        <button class="mobile-nav-btn" data-mview="ROSTER">
          <span class="m-icon">${renderIcon('users')}</span>
          <span class="m-text">조정 백관</span>
        </button>
        <button class="mobile-nav-btn" data-mview="ARCHIVE">
          <span class="m-icon">${renderIcon('book')}</span>
          <span class="m-text">사초록</span>
        </button>
      </div>
      <div id="ending-root"></div>
      <div id="archive-modal-root"></div>
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
      onOpenDynastyArchive: () => this.openDynastyArchive(),
    });

    this.locationView = new LocationView(locationEl, this.engine, (loc: LocationId) => {
      this.engine.setPlayerLocation(loc);
      this.activeMobileView = 'STAGE';
      this.activeMainTab = 'OBSERVATION';
      this.render();
    });

    this.observationView = new ObservationView(
      stageBodyEl,
      this.engine,
      (choices: PendingSachoChoice[]) => {
        this.engine.commitSacho(choices);
        this.activeMainTab = 'OBSERVATION';
        this.activeMobileView = 'STAGE';
        this.render();
      },
      () => this.handleAdvanceButton()
    );

    this.nightChamberView = new NightChamberView(stageBodyEl, this.engine, (choiceId: string) => {
      this.engine.resolveNightChoice(choiceId);
      const nextDay = this.engine.proceedToNextDay();
      this.activeMainTab = 'OBSERVATION';
      this.activeMobileView = 'STAGE';
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

    // Hash check for serverless shared Silok booklet on URL load
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#silok=')) {
      const shareData = SilokCodec.decode(window.location.hash);
      if (shareData) {
        this.openSilokBooklet(shareData);
      }
    }

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

    // Mobile nav bar listeners
    this.root.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-mview') as MobileView;
        if (targetView) {
          this.setMobileView(targetView);
        }
      });
    });

    this.render();
  }

  private setMobileView(view: MobileView): void {
    SoundManager.getInstance().playScroll();
    this.activeMobileView = view;
    if (view === 'ARCHIVE') {
      this.activeMainTab = 'SACHO_BOOK';
    } else if (view === 'STAGE') {
      this.activeMainTab = 'OBSERVATION';
    }
    this.render();
  }

  private setTab(tab: MainTab): void {
    if (this.activeMainTab !== tab) {
      SoundManager.getInstance().playScroll();
    }
    this.activeMainTab = tab;
    if (tab === 'OBSERVATION' || tab === 'EVENT_LOG') {
      this.activeMobileView = 'STAGE';
    } else if (tab === 'SACHO_BOOK') {
      this.activeMobileView = 'ARCHIVE';
    }
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
      this.engine.commitSacho([]);
      this.activeMainTab = 'OBSERVATION';
    } else if (phase === 'NIGHT_VISITATION') {
      const fallback = this.engine.currentDilemma?.choices[0]?.id || '';
      this.engine.resolveNightChoice(fallback);
      const nextDay = this.engine.proceedToNextDay();
      this.activeMainTab = 'OBSERVATION';
      if (nextDay > 30) {
        this.openSilokEnding();
        return;
      }
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
      onStartDynasty: () => {
        this.isEndingOpen = false;
        endingRoot.innerHTML = '';
        this.engine.startNewDynastyReign();
        this.setTab('OBSERVATION');
      },
      onOpenBooklet: () => {
        this.isEndingOpen = false;
        endingRoot.innerHTML = '';
        this.openSilokBookletFromCurrent();
      },
      onCopyShareUrl: () => {
        const url = this.engine.getShareableSilokUrl();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(() => {
            alert('실록 공유 URL이 클립보드에 복사되었습니다!\n누구에게나 링크를 전달하여 웹에서 서책을 열람할 수 있습니다.');
          });
        }
      },
    }, {
      kingName: this.engine.dynastyManager.getCurrentKing().templeName,
      generation: this.engine.dynastyManager.getGeneration(),
      day: this.engine.timeManager.currentDay,
      scribeStats: {
        integrity: this.engine.scribeStats.integrity,
        peril: this.engine.scribeStats.peril,
        wealth: this.engine.scribeStats.wealth,
      },
    });
    this.endingView.render();
  }

  public openSilokBooklet(data: SilokShareData): void {
    this.isBookletOpen = true;
    const endingRoot = this.root.querySelector('#ending-root') as HTMLElement;
    this.silokBookletView = new SilokBookletView(endingRoot, data, {
      onClose: () => {
        this.isBookletOpen = false;
        endingRoot.innerHTML = '';
      },
      onStartNewDynasty: () => {
        this.isBookletOpen = false;
        endingRoot.innerHTML = '';
        this.engine.startNewDynastyReign();
        this.setTab('OBSERVATION');
      },
      onRestartNewGame: () => {
        this.isBookletOpen = false;
        endingRoot.innerHTML = '';
        if (typeof window !== 'undefined') {
          window.location.hash = '';
        }
        this.handleReseed('12345');
      },
    });
    this.silokBookletView.render();
  }

  public openDynastyArchive(): void {
    this.isDynastyArchiveOpen = true;
    const modalRoot = this.root.querySelector('#archive-modal-root') as HTMLElement;
    this.dynastyArchiveView = new DynastyArchiveView(modalRoot, this.engine.dynastyManager, {
      onClose: () => {
        this.isDynastyArchiveOpen = false;
        modalRoot.innerHTML = '';
      },
      onResetArchive: () => {
        this.render();
      },
    });
    this.dynastyArchiveView.render();
  }

  private openSilokBookletFromCurrent(): void {
    const evaluation = this.engine.compileSilok();
    const currentKing = this.engine.dynastyManager.getCurrentKing();
    const shareData: SilokShareData = {
      version: 1,
      seed: this.engine.seed,
      day: this.engine.timeManager.currentDay,
      generation: this.engine.dynastyManager.getGeneration(),
      kingName: currentKing.templeName,
      scribeStats: {
        integrity: this.engine.scribeStats.integrity,
        peril: this.engine.scribeStats.peril,
        wealth: this.engine.scribeStats.wealth,
      },
      records: this.engine.sachoBook.getAll().map((r) => ({
        day: r.day,
        subjectName: r.subjectName,
        certainty: r.certainty,
        statement: r.statement,
        witnessType: r.witnessType,
      })),
      secretArchive: this.engine.scribeStats.secretArchive,
      butterflies: this.engine.butterflyHistory.map((b) => ({
        day: this.engine.timeManager.currentDay,
        headline: b.newsHeadline,
        detail: b.newsDetail,
      })),
      evaluation: {
        grade: evaluation.grade,
        title: evaluation.title,
        score: evaluation.score,
        summary: evaluation.evaluationSummary,
      },
    };
    this.openSilokBooklet(shareData);
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
      if (this.engine.timeManager.currentPhase === 'NIGHT_VISITATION') {
        this.nightChamberView.render();
      } else {
        this.observationView.render();
      }
    } else if (this.activeMainTab === 'SACHO_BOOK') {
      this.sachoArchiveView.render();
    } else if (this.activeMainTab === 'EVENT_LOG') {
      this.renderRecentEventsTab(stageBodyEl);
    }

    // 4. Officials roster
    this.courtRosterView.render();

    // 5. Debug panel
    this.debugPanelView.render(this.isDebugOpen);

    // 6. Mobile view state sync
    const appBody = this.root.querySelector('.app-body');
    appBody?.setAttribute('data-mobile-view', this.activeMobileView);

    this.root.querySelectorAll('.mobile-nav-btn').forEach((btn) => {
      const v = btn.getAttribute('data-mview');
      btn.classList.toggle('active', v === this.activeMobileView);
    });
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
