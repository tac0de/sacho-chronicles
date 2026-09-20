import type { Engine, PendingSachoChoice } from '../core/simulation/Engine.js';
import { LOCATIONS } from '../data/locations.js';
import type { RecordCertainty } from '../core/records/SachoRecord.js';
import { SoundManager } from '../core/audio/SoundManager.js';
import { LOCATION_IMAGES } from './LocationView.js';
import { renderIcon } from './icons/Icons.js';

export class ObservationView {
  private container: HTMLElement;
  private engine: Engine;
  private onCommitSacho: (choices: PendingSachoChoice[]) => void;
  private onStartObservation?: () => void;
  private currentChoices: Map<string, PendingSachoChoice> = new Map();

  constructor(
    container: HTMLElement,
    engine: Engine,
    onCommitSacho: (choices: PendingSachoChoice[]) => void,
    onStartObservation?: () => void
  ) {
    this.container = container;
    this.engine = engine;
    this.onCommitSacho = onCommitSacho;
    this.onStartObservation = onStartObservation;
  }

  public render(): void {
    const phase = this.engine.timeManager.currentPhase;
    const locId = this.engine.playerLocation;
    const loc = LOCATIONS[locId] || LOCATIONS.ROYAL_HALL;
    const locImg = LOCATION_IMAGES[locId] || './assets/locations/sajeongjeon.jpg';

    if (phase === 'LOCATION_SELECTION') {
      const stats = this.engine.scribeStats;
      const king = this.engine.dynastyManager.getCurrentKing();
      const gen = this.engine.dynastyManager.getGeneration();

      // Recent butterflies bulletin
      const recentButterflies = this.engine.butterflyHistory.slice(-2);
      let bulletinHtml = '';
      if (recentButterflies.length > 0) {
        bulletinHtml = `
          <div class="butterfly-alert-banner">
            <div class="butterfly-alert-badge">${renderIcon('zap')} 대궐 파문 (波紋)</div>
            <div class="butterfly-alert-content">
              ${recentButterflies.map((b) => `<div class="butterfly-alert-item"><strong>[환국 징후]</strong> ${b.newsHeadline}: ${b.newsDetail}</div>`).join('')}
            </div>
          </div>
        `;
      }

      this.container.innerHTML = `
        <div class="stage-content chamber-stage">
          ${bulletinHtml}
          <div class="observation-banner">
            <div class="observation-banner-header">
              <img src="${locImg}" class="banner-location-icon" width="56" height="56" alt="${loc.name}" />
              <div class="banner-title-col">
                <h3>오늘의 관찰 처소: ${loc.name} <span class="hanja-gold">[${loc.hanja}]</span></h3>
                <p class="banner-subtext">${loc.alias} · ${loc.atmosphere}</p>
              </div>
            </div>
            <div class="banner-instruction-callout">
              <span class="callout-text">좌측 궁궐 5대 전각 중 행차할 곳을 선택하신 후, 입조 버튼을 누르십시오.</span>
              <button id="btn-enter-chamber" class="btn btn-gold btn-chamber-action">
                ${renderIcon('palace')} ${loc.name} 입조 관찰 시작 ${renderIcon('arrow-right')}
              </button>
            </div>
          </div>

          <div class="chunchugwan-chamber-card">
            <div class="chamber-image-wrapper">
              <img src="./assets/locations/chunchugwan.jpg" alt="춘추관 사관 집무실" class="chamber-hero-img" />
              <div class="chamber-overlay-badge">
                <span class="chamber-seal">春秋館</span>
                <span class="chamber-title">사관의 집무대 (史官 執務臺)</span>
              </div>
            </div>
            <div class="chamber-briefing">
              <div class="chamber-dynasty-badge">
                <span class="badge-gen">조선 ${gen}대 사관</span>
                <span class="badge-king">재위 군주: ${king.templeName} [${king.personality}]</span>
                <span class="badge-stats">${renderIcon('scale')} 직필 ${stats.integrity} · ${renderIcon('flame')} 위기 ${stats.peril}% · ${renderIcon('coins')} 재력 ${stats.wealth}냥 · ${renderIcon('key')} 밀록 ${stats.secretArchive.length}편</span>
              </div>
              <div class="chamber-briefing-title">
                <span>${renderIcon('scroll')} 사관 일과 요강 (史官 日課 要綱)</span>
                <span class="omen-tag">궁중 기류 감지 중</span>
              </div>
              <p class="chamber-text">
                대궐 안에서는 서인과 동인의 파벌 다툼과 권력 암투가 쉼 없이 전개됩니다.
                사관은 처소에 감도는 <strong>[氣流]</strong>를 살펴 의심스러운 현장에 잠입하고, 관원들의 밀담과 풍문을 수집하여 참과 거짓을 가려내야 합니다.
              </p>
              <div class="chamber-tips-grid">
                <div class="chamber-tip-item">
                  <span class="tip-icon">${renderIcon('scale')}</span>
                  <div>
                    <strong>직필(直筆)과 곡필(曲筆)의 갈림길</strong>
                    <p>사실에 충실할수록 만고직필(萬古直筆)의 명예를 얻으나, 편파적으로 기록하면 곡필의 오명을 씁니다.</p>
                  </div>
                </div>
                <div class="chamber-tip-item">
                  <span class="tip-icon">${renderIcon('search')}</span>
                  <div>
                    <strong>소문과 진실의 괴리</strong>
                    <p>전언(傳聞)과 풍문(風聞)은 과장되거나 조작될 수 있으니 첩보 신빙도를 주의 깊게 살피십시오.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.container.querySelector('#btn-enter-chamber')?.addEventListener('click', () => {
        SoundManager.getInstance().playChime();
        this.onStartObservation?.();
      });

      return;
    }

    if (phase === 'DAY_COMPLETED') {
      const nextDayNum = this.engine.timeManager.currentDay + 1;
      this.container.innerHTML = `
        <div class="stage-content chamber-stage">
          <div class="observation-banner">
            <h3>심야의 결단 완료 (決斷 完了)</h3>
            <p>사관의 결단이 역사의 물줄기를 바꾸었습니다. 촛불을 끄고 여명을 맞이할 준비를 마쳤습니다.</p>
          </div>
          <div class="night-completed-card">
            <div class="night-completed-icon">${renderIcon('sunrise', { size: 48 })}</div>
            <h4>대궐에 새로운 여명이 밝아옵니다</h4>
            <p>사관의 붓끝과 어젯밤의 결단에 따른 정치적 파장이 오늘 아침 어전 조참에 서슬 퍼렇게 드러날 것입니다.</p>
            <button id="btn-next-day-dawn" class="btn btn-gold btn-lg" style="margin-top: 20px;">
              ${renderIcon('sunrise')} 여명을 맞이하여 익일(Day ${nextDayNum})로 나아가기 ${renderIcon('arrow-right')}
            </button>
          </div>
        </div>
      `;
      this.container.querySelector('#btn-next-day-dawn')?.addEventListener('click', () => {
        SoundManager.getInstance().playChime();
        this.onStartObservation?.();
      });
      return;
    }

    const observedInfos = this.engine.dailyObservedInfo;

    if (observedInfos.length === 0) {
      this.container.innerHTML = `
        <div class="stage-content">
          <div class="observation-banner">
            <div class="observation-banner-header">
              <img src="${locImg}" class="banner-location-icon" width="48" height="48" alt="${loc.name}" />
              <div>
                <h3>오늘의 관찰 처소: ${loc.name} <span class="hanja-gold">[${loc.hanja}]</span></h3>
                <p class="banner-subtext">${loc.alias}</p>
              </div>
            </div>
            <p class="banner-instruction">오늘 이 처소에서는 사관의 귀와 눈에 띌 만한 공개 설전이나 은밀한 풍문이 감지되지 않았습니다.</p>
          </div>
          <div class="empty-observation">
            <img src="${locImg}" width="56" height="56" alt="고요한 전각" class="empty-icon" />
            <h4>처소가 고요하여 적막이 흐릅니다</h4>
            <p>다른 전각에서는 피 튀기는 탄핵이나 밀담이 벌어졌을지 모르나, 사관이 머문 이곳에는 소식이 닿지 않았습니다.</p>
          </div>
        </div>
      `;
      return;
    }

    // Initialize default choices if not set
    for (const info of observedInfos) {
      if (!this.currentChoices.has(info.id)) {
        this.currentChoices.set(info.id, {
          infoId: info.id,
          recordIt: true,
          certainty: 'CAUTIOUS',
        });
      }
    }

    const isEditable = phase === 'OBSERVATION_RECORD';

    const cardsHtml = observedInfos
      .map((info) => {
        const choice = this.currentChoices.get(info.id) || {
          infoId: info.id,
          recordIt: true,
          certainty: 'CAUTIOUS' as RecordCertainty,
        };

        const witnessBadgeClass =
          info.witnessType === 'DIRECT' ? 'direct' : info.witnessType === 'HEARSAY' ? 'hearsay' : 'rumor';
        const witnessText =
          info.witnessType === 'DIRECT'
            ? '親見 · 직접 목격'
            : info.witnessType === 'HEARSAY'
            ? `傳聞 · ${this.engine.agentMap.get(info.originalCreatorId)?.name || '관원'}의 전언`
            : '風聞 · 궁중 풍문';

        return `
          <div class="info-card" data-info-id="${info.id}">
            <div class="info-card-header">
              <span class="witness-badge ${witnessBadgeClass}">[${witnessText}]</span>
              <div class="credibility-meter">
                <span>첩보 신빙도 ${info.credibility}%</span>
                <div class="credibility-bar">
                  <div class="credibility-fill" style="width: ${info.credibility}%"></div>
                </div>
              </div>
            </div>

            <div class="info-card-body">
              ${info.content}
            </div>

            <div class="sacho-form">
              <div class="sacho-form-title">
                <span class="title-text">
                  <img src="./assets/seal_stamp.svg" width="18" height="18" alt="인장" class="inline-seal" />
                  사초(史草) 필법 선택 — 춘추관 기록
                </span>
                ${!isEditable ? '<span class="sealed-badge">[서책 봉인 완료]</span>' : ''}
              </div>

              <div class="sacho-options">
                <label class="sacho-option ${!choice.recordIt ? 'active' : ''}">
                  <input type="radio" name="opt_${info.id}" value="IGNORE" ${!choice.recordIt ? 'checked' : ''} ${!isEditable ? 'disabled' : ''} />
                  <span class="option-badge badge-ignore">묵살 (闕文)</span>
                  <span class="option-text">사초에 기록하지 않는다 (불확실하거나 사소한 일로 치부하여 누락)</span>
                </label>

                <label class="sacho-option ${choice.recordIt && choice.certainty === 'CAUTIOUS' ? 'active' : ''}">
                  <input type="radio" name="opt_${info.id}" value="CAUTIOUS" ${choice.recordIt && choice.certainty === 'CAUTIOUS' ? 'checked' : ''} ${!isEditable ? 'disabled' : ''} />
                  <span class="option-badge badge-cautious">신중 직필 (直筆)</span>
                  <span class="option-text">"${info.expressionOptions.cautious}"</span>
                </label>

                <label class="sacho-option ${choice.recordIt && choice.certainty === 'MODERATE' ? 'active' : ''}">
                  <input type="radio" name="opt_${info.id}" value="MODERATE" ${choice.recordIt && choice.certainty === 'MODERATE' ? 'checked' : ''} ${!isEditable ? 'disabled' : ''} />
                  <span class="option-badge badge-moderate">정황 추단 (推斷)</span>
                  <span class="option-text">"${info.expressionOptions.moderate}"</span>
                </label>

                <label class="sacho-option ${choice.recordIt && choice.certainty === 'ASSERTIVE' ? 'active' : ''}">
                  <input type="radio" name="opt_${info.id}" value="ASSERTIVE" ${choice.recordIt && choice.certainty === 'ASSERTIVE' ? 'checked' : ''} ${!isEditable ? 'disabled' : ''} />
                  <span class="option-badge badge-assertive">단정 극필 (極筆)</span>
                  <span class="option-text">"${info.expressionOptions.assertive}"</span>
                </label>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="stage-content">
        <div class="observation-banner">
          <div class="observation-banner-header">
            <img src="${locImg}" class="banner-location-icon" width="48" height="48" alt="${loc.name}" />
            <div>
              <h3>오늘 [${loc.name}]에서 입수한 사초 전언 (${observedInfos.length}건)</h3>
              <p class="banner-subtext">사관의 붓끝(直筆과 曲筆)에 따라 훗날 실록의 성격이 결정됩니다. 신중하게 전언을 적거나, 엄한 필치로 인물을 평가하십시오.</p>
            </div>
          </div>
        </div>

        <div class="info-card-list">
          ${cardsHtml}
        </div>

        ${
          isEditable
            ? `
          <div class="observation-bottom-actions">
            <button id="btn-save-sacho" class="btn btn-primary btn-lg">
              ${renderIcon('brush')} 오늘의 사초(史草) 봉인 및 심야 처소 이동 ${renderIcon('arrow-right')}
            </button>
          </div>
        `
            : ''
        }
      </div>
    `;

    // Event listeners for radio choices
    if (isEditable) {
      this.container.querySelectorAll('.sacho-options input[type="radio"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          const infoId = target.name.replace('opt_', '');
          const val = target.value;

          SoundManager.getInstance().playBrush();

          if (val === 'IGNORE') {
            this.currentChoices.set(infoId, {
              infoId,
              recordIt: false,
              certainty: 'CAUTIOUS',
            });
          } else {
            this.currentChoices.set(infoId, {
              infoId,
              recordIt: true,
              certainty: val as RecordCertainty,
            });
          }

          const card = this.container.querySelector(`.info-card[data-info-id="${infoId}"]`);
          card?.querySelectorAll('.sacho-option').forEach((opt) => opt.classList.remove('active'));
          target.closest('.sacho-option')?.classList.add('active');
        });
      });

      const btnSave = this.container.querySelector('#btn-save-sacho');
      btnSave?.addEventListener('click', () => {
        SoundManager.getInstance().playStamp();
        this.onCommitSacho(Array.from(this.currentChoices.values()));
      });
    }
  }
}
