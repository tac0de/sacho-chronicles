import type { Engine } from '../core/simulation/Engine.js';
import { LOCATIONS } from '../data/locations.js';

export class SachoArchiveView {
  private container: HTMLElement;
  private engine: Engine;

  constructor(container: HTMLElement, engine: Engine) {
    this.container = container;
    this.engine = engine;
  }

  public render(): void {
    const records = [...this.engine.sachoBook.getAll()].reverse();

    if (records.length === 0) {
      this.container.innerHTML = `
        <div class="stage-content">
          <div class="observation-banner">
            <h3>사초 기록부 (史草 記綠簿)</h3>
            <p>사관이 매일 붓을 들어 먹물로 기록한 조선 조정의 역사입니다.</p>
          </div>
          <div class="empty-observation">
            <h4>아직 집필된 사초가 없습니다</h4>
            <p>매일 사건을 관찰한 후 기록을 선택하면 이곳에 영구적인 연대기로 축적됩니다.</p>
          </div>
        </div>
      `;
      return;
    }

    const itemsHtml = records
      .map((rec) => {
        const badgeClass =
          rec.certainty === 'CAUTIOUS'
            ? 'badge-cautious'
            : rec.certainty === 'MODERATE'
            ? 'badge-moderate'
            : 'badge-assertive';
        const badgeLabel =
          rec.certainty === 'CAUTIOUS'
            ? '신중한 기록'
            : rec.certainty === 'MODERATE'
            ? '비교적 강함'
            : '단정적 기록';

        const locName = LOCATIONS[rec.locationId]?.name || '궐내';

        return `
          <div class="sacho-archive-item">
            <div class="sacho-archive-meta">
              <span class="sacho-archive-day">Day ${rec.day}</span>
              <span>|</span>
              <span style="color:var(--text-main); font-weight:600;">${rec.subjectName} (${rec.subjectTitle})</span>
              <span>|</span>
              <span>장소: ${locName}</span>
              <span class="option-badge ${badgeClass}" style="margin-left:auto;">${badgeLabel}</span>
            </div>
            <div class="sacho-archive-text">
              "${rec.statement}"
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="stage-content">
        <div class="observation-banner">
          <h3>사초 기록부 (史草 記綠簿) — 총 ${records.length}편의 사초</h3>
          <p>사관의 붓끝에서 완성된 기록입니다. 후대 실록 편찬의 유일무이한 기초 사료가 됩니다.</p>
        </div>
        <div class="sacho-archive-view">
          ${itemsHtml}
        </div>
      </div>
    `;
  }
}
