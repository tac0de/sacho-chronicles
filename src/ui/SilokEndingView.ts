import type { SilokEvaluationResult } from '../core/records/SilokEvaluator.js';
import { renderIcon } from './icons/Icons.js';
import { exportScrollCanvas } from './ScrollCanvasExporter.js';

export interface SilokEndingMeta {
  kingName: string;
  generation: number;
  day: number;
  scribeStats: {
    integrity: number;
    peril: number;
    wealth: number;
  };
}

export class SilokEndingView {
  private container: HTMLElement;
  private result: SilokEvaluationResult;
  private meta?: SilokEndingMeta;
  private onRestart: (newSeed?: string) => void;
  private onClose: () => void;
  private onStartDynasty?: () => void;
  private onOpenBooklet?: () => void;
  private onCopyShareUrl?: () => void;

  constructor(
    container: HTMLElement,
    result: SilokEvaluationResult,
    callbacks: {
      onRestart: (newSeed?: string) => void;
      onClose: () => void;
      onStartDynasty?: () => void;
      onOpenBooklet?: () => void;
      onCopyShareUrl?: () => void;
    },
    meta?: SilokEndingMeta
  ) {
    this.container = container;
    this.result = result;
    this.meta = meta;
    this.onRestart = callbacks.onRestart;
    this.onClose = callbacks.onClose;
    this.onStartDynasty = callbacks.onStartDynasty;
    this.onOpenBooklet = callbacks.onOpenBooklet;
    this.onCopyShareUrl = callbacks.onCopyShareUrl;
  }

  public render(): void {
    const r = this.result;

    const verdictsHtml = r.officialVerdicts
      .map((v) => {
        const accuracyColor = v.accuracyScore >= 80 ? '#79d2a6' : v.accuracyScore >= 50 ? '#e5c178' : '#ff8a8a';

        return `
          <div class="verdict-item">
            <div class="verdict-header">
              <span class="verdict-name">${v.name}</span>
              <span class="verdict-pos">${v.positionTitle} (${v.rank})</span>
              <span class="verdict-score" style="color: ${accuracyColor}; margin-left:auto;">
                사초 부합도: ${v.accuracyScore}%
              </span>
            </div>
            <div class="verdict-truth-row">
              <span style="color:var(--text-muted); font-size:11px;">실제 진실:</span>
              <span style="color:var(--text-paper); font-size:12px;">${v.actualTruthSummary}</span>
            </div>
            <div class="verdict-sacho-row">
              <span style="color:var(--text-muted); font-size:11px;">사초 묘사:</span>
              <span style="color:var(--text-gold); font-size:12px;">${v.sachoDepiction}</span>
            </div>
            <div class="verdict-commentary">
              "${v.verdictText}"
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="ending-modal-overlay">
        <div class="ending-scroll-container">
          <div class="scroll-roller-top"></div>
          
          <div class="scroll-body">
            <div class="ending-header">
              <div class="ending-seal-large">實錄</div>
              <div class="ending-title-group">
                <h2>조선왕조실록 편찬 완결 (實錄 編纂 完結)</h2>
                <div class="ending-subtitle">사관의 붓끝이 멈추고, 역사의 엄정한 심판이 내려지다</div>
              </div>
              <button id="btn-ending-close-x" class="ending-close-btn" title="닫고 사초 열람" style="display:inline-flex; align-items:center; justify-content:center;">${renderIcon('close', { size: 16 })}</button>
            </div>

            <!-- Title and Evaluation Banner -->
            <div class="evaluation-banner">
              <div class="title-badge-large">
                <span class="hanja">${r.titleHanja}</span>
                <span class="korean">${r.title}</span>
              </div>
              <div class="evaluation-summary-text">
                "${r.evaluationSummary}"
              </div>
            </div>

            <!-- Statistics Grid -->
            <div class="ending-stats-grid">
              <div class="stat-card">
                <div class="stat-label">직필 적중률 (直筆)</div>
                <div class="stat-value" style="color:#79d2a6;">${r.truthRate}%</div>
                <div class="stat-desc">실제 진실을 곧게 밝힘</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">곡필 왜곡률 (曲筆)</div>
                <div class="stat-value" style="color:#ff8a8a;">${r.distortionRate}%</div>
                <div class="stat-desc">모함/소문에 휘둘려 오기</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">궐문 묵살률 (闕文)</div>
                <div class="stat-value" style="color:#e5c178;">${r.omissionRate}%</div>
                <div class="stat-desc">중요 사건을 침묵함</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">총 봉안 사초</div>
                <div class="stat-value" style="color:var(--text-paper);">${r.totalRecordsCount}편</div>
                <div class="stat-desc">사초궤에 영구 보존</div>
              </div>
            </div>

            <!-- Officials Verdict Section -->
            <div class="verdicts-section">
              <div class="verdicts-title">
                <span>${renderIcon('scroll')} 백관 12인의 묘비명 및 사신왈 (史臣曰) 총평</span>
              </div>
              <div class="verdicts-list">
                ${verdictsHtml}
              </div>
            </div>

            <!-- Ending Actions -->
            <div class="ending-actions">
              ${
                this.onStartDynasty
                  ? `
                <button id="btn-dynasty-next" class="btn btn-gold btn-lg" style="grid-column: 1 / -1; font-size: 15px; font-weight: bold; background: linear-gradient(135deg, #c59b27 0%, #8b6508 100%);">
                  ${renderIcon('crown')} 차대 계승: 신왕 즉위 및 가문 사필록 잇기 (500년 루프) ${renderIcon('arrow-right')}
                </button>
              `
                  : ''
              }
              <button id="btn-open-booklet" class="btn btn-secondary">
                ${renderIcon('book')} 비단 실록 서책으로 열람
              </button>
              <button id="btn-share-twitter" class="btn btn-secondary" title="트위터(X)에 이 실록 총평을 바로 공유합니다">
                ${renderIcon('zap')} X (트위터) 공유
              </button>
              <button id="btn-copy-share-url" class="btn btn-secondary">
                ${renderIcon('copy')} 사초 영구 링크 복사
              </button>
              <button id="btn-download-scroll" class="btn btn-secondary" title="고화질 조선왕조실록 족자 이미지를 다운로드합니다">
                ${renderIcon('image')} 실록 족자 이미지 저장 (PNG)
              </button>
              <button id="btn-copy-silok" class="btn btn-secondary">
                ${renderIcon('copy')} 총평 복사
              </button>
              <button id="btn-new-era" class="btn btn-gold">
                ${renderIcon('refresh')} 새 치세로 다시 시작
              </button>
              <button id="btn-inspect-sacho" class="btn btn-primary">
                ${renderIcon('book')} 사초 전권 열람
              </button>
            </div>
          </div>

          <div class="scroll-roller-bottom"></div>
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelector('#btn-ending-close-x')?.addEventListener('click', () => {
      this.onClose();
    });

    this.container.querySelector('#btn-inspect-sacho')?.addEventListener('click', () => {
      this.onClose();
    });

    this.container.querySelector('#btn-dynasty-next')?.addEventListener('click', () => {
      this.onStartDynasty?.();
    });

    this.container.querySelector('#btn-open-booklet')?.addEventListener('click', () => {
      this.onOpenBooklet?.();
    });

    this.container.querySelector('#btn-copy-share-url')?.addEventListener('click', () => {
      this.onCopyShareUrl?.();
    });

    this.container.querySelector('#btn-share-twitter')?.addEventListener('click', () => {
      const shareText = `📜 [조선왕조실록 사관 총평]\n칭호: ${r.title} (${r.titleHanja})\n직필률: ${r.truthRate}% | 곡필률: ${r.distortionRate}%\n"${r.evaluationSummary}"\n\n나만의 조선왕조실록을 편찬하고 역사의 심판을 받아보세요! #사초춘추필법 #SachoChronicles`;
      const url = window.location.href.split('#')[0];
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
    });

    this.container.querySelector('#btn-new-era')?.addEventListener('click', () => {
      const nextSeed = Math.floor(Math.random() * 900000 + 100000).toString();
      this.onRestart(nextSeed);
    });

    this.container.querySelector('#btn-copy-silok')?.addEventListener('click', () => {
      const text = `[조선왕조실록 사관 총평]\n칭호: ${r.title} (${r.titleHanja})\n직필률: ${r.truthRate}% | 곡필률: ${r.distortionRate}% | 묵살률: ${r.omissionRate}%\n총평: "${r.evaluationSummary}"\n\n사초: 춘추필법 (Sacho: The Silent Brush)`;
      navigator.clipboard?.writeText(text).then(() => {
        alert('실록 편찬 결과가 클립보드에 복사되었습니다.');
      });
    });

    this.container.querySelector('#btn-download-scroll')?.addEventListener('click', () => {
      this.exportScrollAsImage();
    });
  }

  private exportScrollAsImage(): void {
    const r = this.result;
    const m = this.meta;
    exportScrollCanvas({
      kingName: m?.kingName || '성종 (成宗)',
      generation: m?.generation || 1,
      day: m?.day || 30,
      evalGrade: r.grade,
      evalTitle: r.title,
      evalSummary: r.evaluationSummary,
      truthRate: r.truthRate,
      distortionRate: r.distortionRate,
      omissionRate: r.omissionRate,
      recordsCount: r.totalRecordsCount,
      integrity: m?.scribeStats?.integrity ?? 85,
      peril: m?.scribeStats?.peril ?? 15,
      wealth: m?.scribeStats?.wealth ?? 50,
      verdicts: r.officialVerdicts.map((v) => ({
        name: v.name,
        positionTitle: v.positionTitle,
        rank: v.rank,
        accuracyScore: v.accuracyScore,
        verdictText: v.verdictText,
      })),
    });
  }
}
