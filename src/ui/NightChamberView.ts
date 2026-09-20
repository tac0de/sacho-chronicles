import type { Engine } from '../core/simulation/Engine.js';
import type { NightDilemma, NightChoice } from '../core/dilemma/NightDilemmaEngine.js';
import { SoundManager } from '../core/audio/SoundManager.js';
import { renderIcon } from './icons/Icons.js';

export class NightChamberView {
  private container: HTMLElement;
  private engine: Engine;
  private onResolveChoice: (choiceId: string) => void;

  constructor(
    container: HTMLElement,
    engine: Engine,
    onResolveChoice: (choiceId: string) => void
  ) {
    this.container = container;
    this.engine = engine;
    this.onResolveChoice = onResolveChoice;
  }

  public render(): void {
    const dilemma = this.engine.currentDilemma;
    const stats = this.engine.scribeStats;

    if (!dilemma) {
      this.container.innerHTML = `
        <div class="stage-content chamber-stage">
          <div class="observation-banner">
            <h3>심야의 춘추관 침소 (深夜 春秋館 寢所)</h3>
            <p>밤이 깊었으나 찾아온 객이 없습니다. 조용히 내일 아침을 맞이합니다.</p>
          </div>
          <button id="btn-night-skip" class="btn btn-gold btn-lg">여명 맞이하기 ${renderIcon('arrow-right')}</button>
        </div>
      `;
      this.container.querySelector('#btn-night-skip')?.addEventListener('click', () => {
        this.onResolveChoice('');
      });
      return;
    }

    const typeBadge =
      dilemma.dilemmaType === 'BRIBERY'
        ? `<span class="night-badge-bribe">${renderIcon('coins')} 뇌물 회유 (賂賂)</span>`
        : dilemma.dilemmaType === 'THREAT'
        ? `<span class="night-badge-threat">${renderIcon('sword')} 멸문 협박 (脅迫)</span>`
        : dilemma.dilemmaType === 'ROYAL_INQUEST'
        ? `<span class="night-badge-royal">${renderIcon('crown')} 어전 밀명 (密命)</span>`
        : `<span class="night-badge-petition">${renderIcon('scroll')} 신진 밀소 (密疏)</span>`;

    const choicesHtml = dilemma.choices
      .map((choice) => {
        const integrityBadge =
          choice.integrityDelta > 0
            ? `<span class="delta-badge plus">${renderIcon('scale')} 직필 +${choice.integrityDelta}</span>`
            : choice.integrityDelta < 0
            ? `<span class="delta-badge minus">${renderIcon('scale')} 직필 ${choice.integrityDelta}</span>`
            : '';

        const perilBadge =
          choice.perilDelta > 0
            ? `<span class="delta-badge danger">${renderIcon('flame')} 사화 위기 +${choice.perilDelta}</span>`
            : choice.perilDelta < 0
            ? `<span class="delta-badge safe">${renderIcon('flame')} 사화 위기 ${choice.perilDelta}</span>`
            : '';

        const wealthBadge =
          choice.wealthDelta > 0
            ? `<span class="delta-badge gold">${renderIcon('coins')} 재력 +${choice.wealthDelta}냥</span>`
            : '';

        const archiveBadge = choice.secretArchiveEntry
          ? `<span class="delta-badge secret">${renderIcon('key')} 사가비밀사초 은닉</span>`
          : '';

        const butterflyBadge = choice.butterflyTrigger
          ? `<span class="delta-badge butterfly">${renderIcon('zap')} 나비효과: ${choice.butterflyTrigger.newsHeadline.slice(0, 24)}...</span>`
          : '';

        return `
          <div class="night-choice-card" data-choice-id="${choice.id}">
            <div class="night-choice-header">
              <div class="night-choice-title-wrap">
                ${choice.hanjaLabel ? `<span class="hanja-tag">${choice.hanjaLabel}</span>` : ''}
                <strong class="night-choice-label">${choice.label}</strong>
              </div>
            </div>

            <p class="night-choice-desc">${choice.description}</p>
            <div class="night-consequence-hint">
              <span class="hint-label">파장 예측:</span> ${choice.consequenceHint}
            </div>

            <div class="night-choice-deltas">
              ${integrityBadge}
              ${perilBadge}
              ${wealthBadge}
              ${archiveBadge}
              ${butterflyBadge}
            </div>

            <button class="btn btn-gold btn-choice-action" data-action-id="${choice.id}">
              이 결단을 단행한다 (決斷) ${renderIcon('arrow-right')}
            </button>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="stage-content night-chamber-stage">
        <div class="night-moon-banner">
          <div class="night-banner-main">
            <div class="night-banner-left">
              <span class="night-moon-icon">${renderIcon('moon')}</span>
              <div>
                <div class="night-banner-title">
                  <h3>심야의 침소 (深夜 史官 寢所) · 삼경(三更, 자정)</h3>
                  ${typeBadge}
                </div>
                <p class="night-banner-subtitle">촛불만이 어른거리는 밤, 사관의 문지방을 넘은 은밀한 방문자가 있습니다.</p>
              </div>
            </div>
          </div>

          <!-- 사관 품격 패 (史官 符牌) : 직필과 사화의 천칭 -->
          <div class="night-scribe-talisman-bar">
            <div class="scribe-talisman-item item-integrity" title="사관의 신념: 낮을수록 훗날 실록 편찬 시 곡필 오명 위험">
              <div class="talisman-icon-wrap">${renderIcon('scale', { size: 18 })}</div>
              <div class="talisman-content">
                <div class="talisman-head">
                  <span class="talisman-hanja">直筆</span>
                  <span class="talisman-title">직필 신념</span>
                </div>
                <div class="talisman-val-row">
                  <strong class="talisman-val ${stats.integrity < 40 ? 'danger' : ''}">${stats.integrity}</strong>
                  <span class="talisman-max">/ 100</span>
                </div>
                <div class="talisman-gauge-track">
                  <div class="talisman-gauge-fill bar-integrity" style="width: ${Math.max(0, Math.min(100, stats.integrity))}%;"></div>
                </div>
              </div>
            </div>

            <div class="scribe-talisman-item item-peril" title="사화 위기: 100% 도달 시 즉시 어전 친국 및 멸문지화">
              <div class="talisman-icon-wrap">${renderIcon('flame', { size: 18 })}</div>
              <div class="talisman-content">
                <div class="talisman-head">
                  <span class="talisman-hanja">士禍</span>
                  <span class="talisman-title">사화 위기</span>
                </div>
                <div class="talisman-val-row">
                  <strong class="talisman-val ${stats.peril >= 70 ? 'danger' : ''}">${stats.peril}%</strong>
                  <span class="talisman-sub ${stats.peril >= 70 ? 'danger-text' : ''}">${stats.peril >= 70 ? '경고' : '안정'}</span>
                </div>
                <div class="talisman-gauge-track">
                  <div class="talisman-gauge-fill bar-peril" style="width: ${Math.max(0, Math.min(100, stats.peril))}%;"></div>
                </div>
              </div>
            </div>

            <div class="scribe-talisman-item item-wealth" title="가문 재력: 자제 과거 천거(60냥) 및 가문 보전에 사용">
              <div class="talisman-icon-wrap">${renderIcon('coins', { size: 18 })}</div>
              <div class="talisman-content">
                <div class="talisman-head">
                  <span class="talisman-hanja">家財</span>
                  <span class="talisman-title">가문 자금</span>
                </div>
                <div class="talisman-val-row">
                  <strong class="talisman-val gold">${stats.wealth}냥</strong>
                  <span class="talisman-sub">비상금</span>
                </div>
                <div class="talisman-subtext">자제 천거 60냥 대비</div>
              </div>
            </div>

            <div class="scribe-talisman-item item-secret" title="벽장에 은닉한 비밀 사가사초(私家史草) 편수">
              <div class="talisman-icon-wrap">${renderIcon('book', { size: 18 })}</div>
              <div class="talisman-content">
                <div class="talisman-head">
                  <span class="talisman-hanja">私草</span>
                  <span class="talisman-title">비밀 사초</span>
                </div>
                <div class="talisman-val-row">
                  <strong class="talisman-val purple">${stats.secretArchive.length}편</strong>
                  <span class="talisman-sub">은닉</span>
                </div>
                <div class="talisman-subtext">사초 서책 봉안용</div>
              </div>
            </div>
          </div>
        </div>

        <div class="night-visitor-card">
          <div class="visitor-meta-row">
            <div class="visitor-identity">
              <span class="visitor-rank-pill">${dilemma.visitorRank}</span>
              <h4 class="visitor-name">${dilemma.visitorName} <span class="visitor-title">(${dilemma.visitorTitle})</span></h4>
            </div>
            <span class="visitor-dilemma-title">${dilemma.title}</span>
          </div>

          <div class="visitor-atmosphere">
            <span class="candle-icon">${renderIcon('candle')}</span>
            <span>${dilemma.atmosphere}</span>
          </div>

          <div class="visitor-speech-bubble">
            <div class="speech-quote-mark">“</div>
            <div class="speech-text">${dilemma.dialogue}</div>
          </div>
        </div>

        <div class="night-choices-wrapper">
          <div class="choices-instruction">
            <span>${renderIcon('scale')} <strong>사관의 양심과 붓끝의 갈림길:</strong> 어떤 선택을 내리시겠습니까? 이 결단은 내일 아침 조정에 돌이킬 수 없는 파장을 부릅니다.</span>
          </div>
          <div class="night-choices-grid">
            ${choicesHtml}
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelectorAll('.btn-choice-action').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const choiceId = (e.currentTarget as HTMLElement).getAttribute('data-action-id') || '';
        SoundManager.getInstance().playStamp();
        this.onResolveChoice(choiceId);
      });
    });
  }
}
