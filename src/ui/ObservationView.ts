import type { Engine, PendingSachoChoice } from '../core/simulation/Engine.js';
import { LOCATIONS } from '../data/locations.js';
import type { RecordCertainty } from '../core/records/SachoRecord.js';

export class ObservationView {
  private container: HTMLElement;
  private engine: Engine;
  private onCommitSacho: (choices: PendingSachoChoice[]) => void;
  // infoId -> PendingSachoChoice
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
            <h3>오늘의 관찰 장소: ${loc.name} (${loc.hanja})</h3>
            <p>${loc.atmosphere} — 좌측 목록에서 원하는 전각을 선택한 후 상단의 <strong>[당일 정무 관찰 시작]</strong>을 누르십시오.</p>
          </div>
          <div class="empty-observation">
            <h4>아직 오늘의 정무가 시작되지 않았습니다</h4>
            <p>사관은 선택한 장소에서 들려오는 목소리와 오가는 눈짓을 묵묵히 지켜볼 것입니다.</p>
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
            <h3>오늘의 관찰 장소: ${loc.name} (${loc.hanja})</h3>
            <p>오늘은 이 전각에서 사관의 눈에 띌 만한 특별한 소란이나 전언이 포착되지 않았습니다.</p>
          </div>
          <div class="empty-observation">
            <h4>궐내가 고요합니다</h4>
            <p>다른 전각에서는 격렬한 암투가 벌어졌을지도 모르나, 이곳까지 소식이 닿지 않았습니다.</p>
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
            ? '직접 목격'
            : info.witnessType === 'HEARSAY'
            ? `${this.engine.agentMap.get(info.originalCreatorId)?.name || '관원'}의 전언`
            : '궁중 풍문';

        return `
          <div class="info-card" data-info-id="${info.id}">
            <div class="info-card-header">
              <span class="witness-badge ${witnessBadgeClass}">[${witnessText}]</span>
              <div class="credibility-meter">
                <span>신뢰도 ${info.credibility}%</span>
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
                <span>📜 사초(史草) 집필 선택</span>
                ${!isEditable ? '<span style="color:var(--text-muted); font-size:11px;">(기록 완료됨)</span>' : ''}
              </div>

              <div class="sacho-options">
                <label class="sacho-option ${!choice.recordIt ? 'active' : ''}">
                  <input type="radio" name="opt_${info.id}" value="IGNORE" ${!choice.recordIt ? 'checked' : ''} ${!isEditable ? 'disabled' : ''} />
                  <span class="option-badge badge-ignore">묵살</span>
                  <span class="option-text">기록하지 않는다 (역사의 장막 뒤로 묻어둠)</span>
                </label>

                <label class="sacho-option ${choice.recordIt && choice.certainty === 'CAUTIOUS' ? 'active' : ''}">
                  <input type="radio" name="opt_${info.id}" value="CAUTIOUS" ${choice.recordIt && choice.certainty === 'CAUTIOUS' ? 'checked' : ''} ${!isEditable ? 'disabled' : ''} />
                  <span class="option-badge badge-cautious">신중한 기록</span>
                  <span class="option-text">"${info.expressionOptions.cautious}"</span>
                </label>

                <label class="sacho-option ${choice.recordIt && choice.certainty === 'MODERATE' ? 'active' : ''}">
                  <input type="radio" name="opt_${info.id}" value="MODERATE" ${choice.recordIt && choice.certainty === 'MODERATE' ? 'checked' : ''} ${!isEditable ? 'disabled' : ''} />
                  <span class="option-badge badge-moderate">비교적 강함</span>
                  <span class="option-text">"${info.expressionOptions.moderate}"</span>
                </label>

                <label class="sacho-option ${choice.recordIt && choice.certainty === 'ASSERTIVE' ? 'active' : ''}">
                  <input type="radio" name="opt_${info.id}" value="ASSERTIVE" ${choice.recordIt && choice.certainty === 'ASSERTIVE' ? 'checked' : ''} ${!isEditable ? 'disabled' : ''} />
                  <span class="option-badge badge-assertive">단정적 기록</span>
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
          <h3>오늘 [${loc.name}]에서 포착한 사실과 소문 (${observedInfos.length}건)</h3>
          <p>사관은 주관적 판단에 따라 신중하게 전언을 기록하거나, 단정적인 필치로 역사를 규정할 수 있습니다.</p>
        </div>

        <div class="info-card-list">
          ${cardsHtml}
        </div>

        ${
          isEditable
            ? `
          <div style="margin-top:24px; text-align:right;">
            <button id="btn-save-sacho" class="btn btn-primary" style="padding:10px 24px; font-size:15px;">
              🖋️ 선택한 내용으로 오늘 사초 집필 완료
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

          // Update active css class on options
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
