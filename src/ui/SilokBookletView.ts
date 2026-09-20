import type { SilokShareData } from '../core/sharing/SilokCodec.js';
import { SoundManager } from '../core/audio/SoundManager.js';
import { renderIcon } from './icons/Icons.js';
import { exportScrollCanvas } from './ScrollCanvasExporter.js';

export interface SilokBookletCallbacks {
  onClose: () => void;
  onStartNewDynasty?: () => void;
  onRestartNewGame?: () => void;
}

export class SilokBookletView {
  private container: HTMLElement;
  private data: SilokShareData;
  private callbacks: SilokBookletCallbacks;
  private activePage: 'SUMMARY' | 'CHRONICLE' | 'SECRET' | 'FACTIONS' = 'SUMMARY';

  constructor(
    container: HTMLElement,
    data: SilokShareData,
    callbacks: SilokBookletCallbacks
  ) {
    this.container = container;
    this.data = data;
    this.callbacks = callbacks;
  }

  public render(): void {
    const d = this.data;
    const evalGrade = d.evaluation?.grade || 'A';
    const evalTitle = d.evaluation?.title || '만고직필의 사관';
    const evalScore = d.evaluation?.score || 85;
    const evalSummary = d.evaluation?.summary || '어떠한 권력의 겁박에도 흔들리지 않고 사실을 직필하였다.';

    this.container.innerHTML = `
      <div class="silok-booklet-backdrop">
        <div class="silok-booklet-modal">
          <!-- Silk Book Header -->
          <div class="booklet-header">
            <div class="booklet-emblem">
              <span class="dragon-seal">國朝實錄</span>
              <div>
                <h2 class="booklet-title">${d.kingName} 실록초본 (實錄草本)</h2>
                <span class="booklet-dynasty-badge">조선 제${d.generation}대 치세록 · 총 ${d.day}일간의 기록</span>
              </div>
            </div>
            <div class="booklet-header-actions">
              <button id="btn-booklet-share-twitter" class="btn btn-secondary btn-sm" title="트위터(X)에 이 실록 공유">
                ${renderIcon('zap')} X 공유
              </button>
              <button id="btn-booklet-download-scroll" class="btn btn-secondary btn-sm" title="조선왕조실록 고화질 족자 이미지 저장">
                ${renderIcon('image')} 족자 저장
              </button>
              <button id="btn-booklet-copy-url" class="btn btn-secondary btn-sm" title="이 실록 서책을 누구에게나 열람 가능한 URL로 복사">
                ${renderIcon('copy')} 링크 복사
              </button>
              <button id="btn-booklet-close" class="modal-close-btn" title="닫기" style="display:inline-flex; align-items:center; justify-content:center;">${renderIcon('close', { size: 16 })}</button>
            </div>
          </div>

          <!-- Booklet Navigation Tabs -->
          <div class="booklet-tabs">
            <button class="booklet-tab ${this.activePage === 'SUMMARY' ? 'active' : ''}" data-page="SUMMARY">
              ${renderIcon('scroll')} 묘호 및 어제 총평
            </button>
            <button class="booklet-tab ${this.activePage === 'CHRONICLE' ? 'active' : ''}" data-page="CHRONICLE">
              ${renderIcon('book')} 사초 편년기 (${d.records.length}건)
            </button>
            <button class="booklet-tab ${this.activePage === 'SECRET' ? 'active' : ''}" data-page="SECRET">
              ${renderIcon('key')} 사가 비밀 사초록 (${d.secretArchive.length}편)
            </button>
            <button class="booklet-tab ${this.activePage === 'FACTIONS' ? 'active' : ''}" data-page="FACTIONS">
              ${renderIcon('zap')} 붕당 환국과 나비효과 (${d.butterflies.length}건)
            </button>
          </div>

          <!-- Booklet Main Content -->
          <div class="booklet-body">
            ${this.renderActivePage()}
          </div>

          <!-- Booklet Footer -->
          <div class="booklet-footer">
            <div class="booklet-footer-stats">
              <span>사관 신념: <strong>${d.scribeStats.integrity}점</strong></span>
              <span>·</span>
              <span>사화 위기: <strong>${d.scribeStats.peril}%</strong></span>
              <span>·</span>
              <span>가문 재력: <strong>${d.scribeStats.wealth}냥</strong></span>
            </div>
            <div class="booklet-footer-actions">
              ${
                this.callbacks.onStartNewDynasty
                  ? `
                <button id="btn-booklet-next-reign" class="btn btn-gold btn-lg">
                  ${renderIcon('crown')} 신왕 즉위 및 가문 사필록 계승 ${renderIcon('arrow-right')}
                </button>
              `
                  : `
                <button id="btn-booklet-new-game" class="btn btn-gold btn-lg">
                  ${renderIcon('sprout')} 새로운 역사 시작하기 (신규 게임)
                </button>
              `
              }
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderActivePage(): string {
    const d = this.data;

    if (this.activePage === 'SUMMARY') {
      const evalGrade = d.evaluation?.grade || 'A';
      const evalTitle = d.evaluation?.title || '만고직필의 사관';
      const evalScore = d.evaluation?.score || 85;
      const evalSummary = d.evaluation?.summary || '치세의 굴곡 속에서도 붓을 꺾지 않고 사관의 직필을 남겼다.';

      return `
        <div class="booklet-page-content page-summary">
          <div class="booklet-eval-hero">
            <div class="eval-ribbon">
              <span class="eval-grade-large">${evalGrade}</span>
              <span class="eval-score-label">${evalScore}점</span>
            </div>
            <div class="eval-info">
              <h3 class="eval-title-gold">${evalTitle}</h3>
              <p class="eval-summary-text">${evalSummary}</p>
            </div>
          </div>

          <div class="booklet-summary-grid">
            <div class="summary-col-card">
              <h4>${renderIcon('palace')} 국왕 묘호 및 치세</h4>
              <p><strong>묘호:</strong> ${d.kingName}</p>
              <p><strong>재위 일수:</strong> ${d.day}일간의 편년</p>
              <p><strong>기록된 사초 총수:</strong> ${d.records.length}건</p>
              <p><strong>궁중 변혁 나비효과:</strong> ${d.butterflies.length}회</p>
            </div>
            <div class="summary-col-card">
              <h4>${renderIcon('scroll')} 사관 가문 가풍(家風)</h4>
              <p><strong>가문 대수:</strong> 조선 ${d.generation}대 사관</p>
              <p><strong>최종 직필 신념:</strong> ${d.scribeStats.integrity} / 100</p>
              <p><strong>최종 사화 위기:</strong> ${d.scribeStats.peril}%</p>
              <p><strong>가문 비전 사가사초:</strong> ${d.secretArchive.length}편 보존</p>
            </div>
          </div>
        </div>
      `;
    }

    if (this.activePage === 'CHRONICLE') {
      if (d.records.length === 0) {
        return `
          <div class="booklet-page-content page-chronicle">
            <div class="empty-booklet-msg">
              <span class="empty-icon">${renderIcon('book', { size: '2em' })}</span>
              <h4>아직 봉안된 사초가 없습니다</h4>
              <p>날이 흐르고 일과를 거치며 사초가 기록되면 이곳에 30일 편년기가 펼쳐집니다.</p>
            </div>
          </div>
        `;
      }

      const rows = d.records
        .map(
          (r) => `
        <div class="chronicle-row-item">
          <div class="chronicle-meta">
            <span class="chronicle-day">Day ${r.day}</span>
            <span class="chronicle-subject">${r.subjectName}</span>
            <span class="chronicle-cert cert-${r.certainty.toLowerCase()}">${r.certainty}</span>
          </div>
          <p class="chronicle-statement">${r.statement}</p>
        </div>
      `
        )
        .join('');

      return `<div class="booklet-page-content page-chronicle">${rows}</div>`;
    }

    if (this.activePage === 'SECRET') {
      if (d.secretArchive.length === 0) {
        return `
          <div class="empty-booklet-msg">
            <span class="empty-icon">${renderIcon('key', { size: '2em' })}</span>
            <h4>은닉된 사가 비밀사초가 없습니다</h4>
            <p>심야의 내방자 회유나 협박 시 비밀 사가사초를 숨기는 결단을 내리면 이곳에 비망록이 봉인 해제됩니다.</p>
          </div>
        `;
      }

      const secretsHtml = d.secretArchive
        .map(
          (s) => `
        <div class="secret-archive-card">
          <div class="secret-archive-header">
            <span class="secret-day-badge">Day ${s.day} 심야 밀록</span>
            <strong class="secret-title">${s.title}</strong>
          </div>
          <div class="secret-content-body">${s.content}</div>
        </div>
      `
        )
        .join('');

      return `<div class="booklet-page-content page-secret">${secretsHtml}</div>`;
    }

    if (this.activePage === 'FACTIONS') {
      if (d.butterflies.length === 0) {
        return `
          <div class="empty-booklet-msg">
            <span class="empty-icon">${renderIcon('zap', { size: '2em' })}</span>
            <h4>발생한 정치적 나비효과가 없습니다</h4>
            <p>사관의 심야 결단이나 강경한 직필이 조정 탄핵과 옥사로 이어지면 이곳에 조정 변혁록이 남겨집니다.</p>
          </div>
        `;
      }

      const butterfliesHtml = d.butterflies
        .map(
          (b) => `
        <div class="butterfly-history-card">
          <div class="butterfly-history-day">Day ${b.day} 黎明 朝報</div>
          <h4 class="butterfly-history-headline">${b.headline}</h4>
          <p class="butterfly-history-detail">${b.detail}</p>
        </div>
      `
        )
        .join('');

      return `<div class="booklet-page-content page-factions">${butterfliesHtml}</div>`;
    }

    return '';
  }

  private attachEventListeners(): void {
    // Tab switching
    this.container.querySelectorAll('.booklet-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const page = (e.currentTarget as HTMLElement).getAttribute('data-page') as any;
        if (page && page !== this.activePage) {
          SoundManager.getInstance().playScroll();
          this.activePage = page;
          this.render();
        }
      });
    });

    // Close button
    this.container.querySelector('#btn-booklet-close')?.addEventListener('click', () => {
      this.callbacks.onClose();
    });

    // Twitter (X) share
    this.container.querySelector('#btn-booklet-share-twitter')?.addEventListener('click', () => {
      SoundManager.getInstance().playStamp();
      const d = this.data;
      const evalTitle = d.evaluation?.title || '만고직필의 사관';
      const evalGrade = d.evaluation?.grade || 'A';
      const shareText = `📜 [조선왕조실록 사관 총평]\n국왕 묘호: ${d.kingName}\n사관 칭호: ${evalTitle} (${evalGrade}등급)\n재위 일수: ${d.day}일 | 봉안 사초: ${d.records.length}편\n\n나만의 조선왕조실록을 편찬하고 영구 보존해보세요! #조선사관 #사초춘추필법 #SachoChronicles`;
      const url = window.location.href;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
    });

    // Scroll image download
    this.container.querySelector('#btn-booklet-download-scroll')?.addEventListener('click', () => {
      SoundManager.getInstance().playStamp();
      const d = this.data;
      exportScrollCanvas({
        kingName: d.kingName,
        generation: d.generation,
        day: d.day,
        evalGrade: d.evaluation?.grade || 'A',
        evalTitle: d.evaluation?.title || '만고직필의 사관',
        evalSummary: d.evaluation?.summary || '치세의 굴곡 속에서도 붓을 꺾지 않고 사관의 직필을 남겼다.',
        recordsCount: d.records.length,
        integrity: d.scribeStats.integrity,
        peril: d.scribeStats.peril,
        wealth: d.scribeStats.wealth,
      });
    });

    // Copy URL permalink button
    this.container.querySelector('#btn-booklet-copy-url')?.addEventListener('click', () => {
      SoundManager.getInstance().playStamp();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          const btn = this.container.querySelector('#btn-booklet-copy-url');
          if (btn) {
            btn.innerHTML = `${renderIcon('check')} 복사 완료!`;
            setTimeout(() => {
              btn.innerHTML = `${renderIcon('copy')} 링크 복사`;
            }, 2500);
          }
        });
      }
    });

    // Next reign or new game
    this.container.querySelector('#btn-booklet-next-reign')?.addEventListener('click', () => {
      SoundManager.getInstance().playStamp();
      this.callbacks.onStartNewDynasty?.();
    });

    this.container.querySelector('#btn-booklet-new-game')?.addEventListener('click', () => {
      SoundManager.getInstance().playStamp();
      this.callbacks.onRestartNewGame?.();
    });
  }
}
