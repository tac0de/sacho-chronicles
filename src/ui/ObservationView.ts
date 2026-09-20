import type { Engine, PendingSachoChoice } from '../core/simulation/Engine.js';
import { LOCATIONS } from '../data/locations.js';
import type { RecordCertainty } from '../core/records/SachoRecord.js';

export class ObservationView {
  private container: HTMLElement;
  private engine: Engine;
  private onCommitSacho: (choices: PendingSachoChoice[]) => void;
  private currentChoices: Map<string, PendingSachoChoice> = new Map();

  constructor(container: HTMLElement, engine: Engine, onCommitSacho: (choices: PendingSachoChoice[]) => void) {
    this.container = container;
    this.engine = engine;
    this.onCommitSacho = onCommitSacho;
  }

  public render(): void {
    const phase = this.engine.timeManager.currentPhase;
    const loc = LOCATIONS[this.engine.playerLocation];

    if (phase === 'LOCATION_SELECTION') {
      this.container.innerHTML = `
        <div class="stage-content">
          <div class="observation-banner">
            <h3>오늘의 관찰 처소: ${loc.name} <span style="font-size:13px; font-weight:normal; color:var(--text-gold);">[${loc.hanja}]</span></h3>
            <p>${loc.atmosphere} — 좌측 궁궐 전각 중 한 곳을 택한 후, 상단의 <strong>[당일 정무 관찰 시작]</strong>을 누르십시오.</p>
          </div>
          <div class="empty-observation">
            <h4>사관이 붓을 적시며 입조를 대기하고 있습니다</h4>
            <p>춘추관 사관은 군주의 처소와 신하들의 회랑을 묵묵히 오가며 오늘의 사초(史草)를 남길 준비를 합니다.</p>
          </div>
        </div>
      `;
      return;
    }

    const observedInfos = this.engine.dailyObservedInfo;

    if (observedInfos.length === 0) {
      this.container.innerHTML = `
        <div class="stage-content">
          <div class="observation-banner">
            <h3>오늘의 관찰 처소: ${loc.name} <span style="font-size:13px; font-weight:normal; color:var(--text-gold);">[${loc.hanja}]</span></h3>
            <p>오늘 이 처소에서는 사관의 귀와 눈에 띌 만한 공개 설전이나 은밀한 풍문이 감지되지 않았습니다.</p>
          </div>
          <div class="empty-observation">
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
                <span>📜 사초(史草) 필법 선택 — 춘추관 기록</span>
                ${!isEditable ? '<span style="color:var(--text-gold); font-size:11px; margin-left:auto;">[서책 봉인 완료]</span>' : ''}
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
          <h3>오늘 [${loc.name}]에서 입수한 사초 전언 (${observedInfos.length}건)</h3>
          <p>사관의 붓끝(直筆과 曲筆)에 따라 훗날 실록의 성격이 결정됩니다. 신중하게 전언을 적거나, 엄한 필치로 인물을 평가하십시오.</p>
        </div>

        <div class="info-card-list">
          ${cardsHtml}
        </div>

        ${
          isEditable
            ? `
          <div style="margin-top:24px; text-align:right;">
            <button id="btn-save-sacho" class="btn btn-primary" style="padding:10px 24px; font-size:15px;">
              🖋️ 오늘의 사초(史草) 봉인 및 익일(翌日) 진행
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
        this.onCommitSacho(Array.from(this.currentChoices.values()));
      });
    }
  }
}
