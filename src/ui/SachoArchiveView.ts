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
            <h3>춘추관 사초록 (春秋館 史草錄)</h3>
            <p>사관이 직접 보고 들은 바를 묵필(墨筆)로 작성하여 사관 궤짝(史草櫃)에 보관한 기록입니다.</p>
          </div>
          <div class="empty-observation">
            <h4>아직 사초궤에 봉안된 기록이 없습니다</h4>
            <p>매일 사건을 관찰한 후 붓을 들어 기록하면, 훗날 실록 편찬의 귀중한 기초 사료로 남게 됩니다.</p>
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
            ? '直筆 · 신중 직필'
            : rec.certainty === 'MODERATE'
            ? '推斷 · 정황 추단'
            : '極筆 · 단정 극필';

        const loc = LOCATIONS[rec.locationId];
        const locName = loc ? `${loc.name} (${loc.hanja})` : '궐내';

        const commentary =
          rec.certainty === 'ASSERTIVE'
            ? `史臣曰, "${rec.subjectName}의 처신은 조정을 흔들고 도의를 저버렸으니, 역사의 준엄한 필벌을 피하지 못할 것이다."`
            : rec.certainty === 'MODERATE'
            ? `史臣曰, "비록 소문이라 하나 연기가 어찌 불 없이 나겠는가. 마땅히 조정을 바로잡아야 할 것이다."`
            : `史臣曰, "말이 분분하나 아직 흑백이 갈리지 않았으니, 훗날의 공론에 맡겨야 할 것이다."`;

        return `
          <div class="sacho-archive-item">
            <div class="sacho-archive-meta">
              <span class="sacho-archive-day">기사일: Day ${rec.day}</span>
              <span>|</span>
              <span style="color:var(--text-paper); font-weight:700;">기록 대상: ${rec.subjectName} (${rec.subjectTitle})</span>
              <span>|</span>
              <span>처소: ${locName}</span>
              <span class="option-badge ${badgeClass}" style="margin-left:auto;">${badgeLabel}</span>
            </div>
            <div class="sacho-archive-text">
              "${rec.statement}"
            </div>
            <div class="sacho-commentary">
              ${commentary}
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="stage-content">
        <div class="observation-banner">
          <h3>춘추관 사초록 (春秋館 史草錄) — 봉안된 사초 총 ${records.length}편</h3>
          <p>사관의 붓끝으로 기록된 역사의 파편입니다. 오직 훗날 실록청이 열릴 때 비로소 개봉될 것입니다.</p>
        </div>
        <div class="sacho-archive-view">
          ${itemsHtml}
        </div>
      </div>
    `;
  }
}
