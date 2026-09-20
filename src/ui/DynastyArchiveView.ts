import type { DynastyManager, ReignRecord, HeirloomTrait } from '../core/dynasty/DynastyManager.js';
import { SoundManager } from '../core/audio/SoundManager.js';
import { renderIcon } from './icons/Icons.js';

export interface DynastyArchiveCallbacks {
  onClose: () => void;
  onResetArchive?: () => void;
}

export class DynastyArchiveView {
  private container: HTMLElement;
  private dynastyManager: DynastyManager;
  private callbacks: DynastyArchiveCallbacks;
  private activeTab: 'REIGNS' | 'HEIRLOOMS' = 'REIGNS';

  constructor(
    container: HTMLElement,
    dynastyManager: DynastyManager,
    callbacks: DynastyArchiveCallbacks
  ) {
    this.container = container;
    this.dynastyManager = dynastyManager;
    this.callbacks = callbacks;
  }

  public render(): void {
    const pastReigns = this.dynastyManager.getPastReigns();
    const heirlooms = this.dynastyManager.getHeirlooms();
    const currentGen = this.dynastyManager.getGeneration();
    const unlockedCount = heirlooms.filter((h) => h.isUnlocked).length;

    this.container.innerHTML = `
      <div class="dynasty-archive-backdrop">
        <div class="dynasty-archive-modal">
          <!-- Modal Header -->
          <div class="archive-modal-header">
            <div class="archive-header-title">
              <span class="archive-seal-badge">${renderIcon('book')}</span>
              <div>
                <h2>춘추관 역대 실록 서고 및 가문 전승록 (歷代 實錄 書庫)</h2>
                <span class="archive-subtitle">조선 ${currentGen}대 사관 가문 가풍 · 선대왕 봉안 실록 ${pastReigns.length}권 · 해금 가보 ${unlockedCount}/${heirlooms.length}종</span>
              </div>
            </div>
            <button id="btn-archive-close" class="modal-close-btn" title="닫기">${renderIcon('close', { size: 16 })}</button>
          </div>

          <!-- Navigation Tabs -->
          <div class="archive-tabs">
            <button class="archive-tab ${this.activeTab === 'REIGNS' ? 'active' : ''}" data-tab="REIGNS">
              ${renderIcon('scroll')} 역대 봉안 실록 (${pastReigns.length}권)
            </button>
            <button class="archive-tab ${this.activeTab === 'HEIRLOOMS' ? 'active' : ''}" data-tab="HEIRLOOMS">
              ${renderIcon('crown')} 가문 가보 및 전승 업적 (${unlockedCount}/${heirlooms.length})
            </button>
          </div>

          <!-- Main Content Body -->
          <div class="archive-body">
            ${this.activeTab === 'REIGNS' ? this.renderReignsContent(pastReigns) : this.renderHeirloomsContent(heirlooms)}
          </div>

          <!-- Modal Footer -->
          <div class="archive-modal-footer">
            <div class="archive-footer-info">
              <span>현재 당대 군주: <strong>${this.dynastyManager.getCurrentKing().templeName}</strong></span>
              <span>·</span>
              <span>가문 계보: <strong>조선 ${currentGen}대 사관</strong></span>
            </div>
            <div class="archive-footer-actions">
              ${pastReigns.length > 0 ? `
                <button id="btn-archive-reset" class="btn btn-secondary btn-xs" title="가문 계보와 과거 실록 데이터를 초기화하고 1대로 복귀합니다">
                  가문 계보 초기화
                </button>
              ` : ''}
              <button id="btn-archive-confirm" class="btn btn-gold btn-sm">
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderReignsContent(reigns: ReignRecord[]): string {
    if (reigns.length === 0) {
      return `
        <div class="archive-empty-state">
          <div class="empty-seal">${renderIcon('scroll', { size: '3em' })}</div>
          <h3>아직 봉안된 선대왕의 실록이 없습니다</h3>
          <p>
            재위 30일을 완주하거나 [실록 편찬]을 단행하면 역사의 심판을 거쳐<br/>
            선대 군주의 치세와 사관의 직필이 이곳 가문 서고에 영구 봉안됩니다.
          </p>
        </div>
      `;
    }

    const cards = reigns
      .map((r) => {
        const gradeColor =
          r.evaluationGrade === 'S'
            ? '#e5c178'
            : r.evaluationGrade === 'A'
            ? '#79d2a6'
            : r.evaluationGrade === 'B'
            ? '#8bc34a'
            : '#e57373';

        return `
          <div class="reign-silok-card">
            <div class="reign-card-header">
              <div class="reign-king-badge">
                <span class="reign-gen-tag">제${r.reignNumber}대</span>
                <h4 class="reign-king-name">${r.kingName}</h4>
                <span class="reign-king-trait">[${r.kingPersonality}]</span>
              </div>
              <div class="reign-eval-pill" style="border-color: ${gradeColor};">
                <span class="reign-grade" style="color: ${gradeColor};">${r.evaluationGrade}</span>
                <span class="reign-title">${r.evaluationTitle}</span>
              </div>
            </div>

            <div class="reign-stats-row">
              <div class="reign-stat-item">
                <span class="stat-k">봉안 사초</span>
                <strong class="stat-v">${r.archiveCount}편</strong>
              </div>
              <div class="reign-stat-item">
                <span class="stat-k">직필 신념</span>
                <strong class="stat-v" style="color:#79d2a6;">${r.finalIntegrity}점</strong>
              </div>
              <div class="reign-stat-item">
                <span class="stat-k">사화 위기</span>
                <strong class="stat-v" style="color:#ff8a8a;">${r.finalPeril}%</strong>
              </div>
              <div class="reign-stat-item">
                <span class="stat-k">조정 판세</span>
                <strong class="stat-v">${r.winningFaction === 'WEST' ? '서인 집권' : r.winningFaction === 'EAST' ? '동인 집권' : '탕평 중립'}</strong>
              </div>
            </div>

            <div class="reign-date-footer">
              <span>편찬 일시: ${r.recordedDate}</span>
            </div>
          </div>
        `;
      })
      .reverse()
      .join('');

    return `<div class="reigns-grid">${cards}</div>`;
  }

  private renderHeirloomsContent(heirlooms: HeirloomTrait[]): string {
    const cards = heirlooms
      .map((h) => {
        const isUnlocked = h.isUnlocked;
        return `
          <div class="heirloom-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="heirloom-header">
              <div class="heirloom-title-group">
                <span class="heirloom-icon">${renderIcon(isUnlocked ? 'crown' : 'key', { size: 20 })}</span>
                <div>
                  <h4 class="heirloom-name">${h.name} (${h.hanja})</h4>
                  <span class="heirloom-status">${isUnlocked ? '해금 완료 (가풍 전승)' : '미해금 (조건 미달)'}</span>
                </div>
              </div>
              <span class="heirloom-badge-tag ${isUnlocked ? 'badge-gold' : 'badge-dim'}">
                ${isUnlocked ? '전승 활성화' : '봉인됨'}
              </span>
            </div>
            <p class="heirloom-desc">${h.description}</p>
            <div class="heirloom-effect-box">
              <span class="effect-label">${renderIcon('zap', { size: 14 })} 가문 계승 혜택:</span>
              <span class="effect-text">${h.effect}</span>
            </div>
          </div>
        `;
      })
      .join('');

    return `<div class="heirlooms-grid">${cards}</div>`;
  }

  private attachEventListeners(): void {
    this.container.querySelectorAll('.archive-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const t = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
        if (t && t !== this.activeTab) {
          SoundManager.getInstance().playScroll();
          this.activeTab = t;
          this.render();
        }
      });
    });

    const closeHandler = () => {
      SoundManager.getInstance().playScroll();
      this.callbacks.onClose();
    };

    this.container.querySelector('#btn-archive-close')?.addEventListener('click', closeHandler);
    this.container.querySelector('#btn-archive-confirm')?.addEventListener('click', closeHandler);

    this.container.querySelector('#btn-archive-reset')?.addEventListener('click', () => {
      if (confirm('정말로 가문 서고와 계보를 초기화하시겠습니까? 역대 실록 편찬 기록과 해금된 가보가 모두 초기화됩니다.')) {
        this.dynastyManager.resetAllProgress();
        SoundManager.getInstance().playStamp();
        this.callbacks.onResetArchive?.();
        this.render();
      }
    });
  }
}
