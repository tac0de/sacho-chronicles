import type { Engine } from '../core/simulation/Engine.js';
import { LOCATIONS, type LocationId } from '../data/locations.js';
import { POSITIONS } from '../data/positions.js';

export class LocationView {
  private container: HTMLElement;
  private engine: Engine;
  private onSelectLocation: (loc: LocationId) => void;

  constructor(container: HTMLElement, engine: Engine, onSelectLocation: (loc: LocationId) => void) {
    this.container = container;
    this.engine = engine;
    this.onSelectLocation = onSelectLocation;
  }

  public render(): void {
    const isSelectionLocked = this.engine.timeManager.currentPhase !== 'LOCATION_SELECTION';
    const currentLoc = this.engine.playerLocation;

    const locationCards = Object.values(LOCATIONS)
      .map((loc) => {
        const isSelected = loc.id === currentLoc;
        const visitors = loc.primaryVisitors
          .slice(0, 3)
          .map((pId) => `<span class="visitor-tag">${POSITIONS[pId]?.title || pId}</span>`)
          .join('');

        return `
          <div class="location-card ${isSelected ? 'selected' : ''}" data-id="${loc.id}">
            <div class="location-card-title">
              <span class="name">${loc.name}</span>
              <span class="hanja">(${loc.hanja})</span>
            </div>
            <div style="font-size:11px; color:var(--text-gold); margin-bottom:3px;">
              ${loc.alias}
            </div>
            <div class="desc">${loc.description}</div>
            <div class="location-visitors">
              ${visitors}
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="sidebar-locations">
        <div class="panel-header">
          <h2>궁궐 전각 관찰 (5처)</h2>
          <span style="font-size:11px; color:var(--text-muted);">
            ${isSelectionLocked ? '관찰 중' : '일일 1처 선택'}
          </span>
        </div>
        <div class="location-list">
          ${locationCards}
        </div>

        <div class="scribe-dossier">
          <div class="scribe-dossier-header">
            <span>🖋️ 춘추관 사관 (春秋館 史官)</span>
          </div>
          <div class="scribe-dossier-text">
            "사관은 군주의 좌우에서 직필(直筆)함을 업으로 삼으니, 임금이라도 사초를 볼 수 없으며 오직 훗날의 공론만이 이를 판결할 것이다."
          </div>
          <div class="scribe-seal-row">
            <span>직위: 기사관 (정7품)</span>
            <span style="color:var(--accent-seal-red); font-weight:800;">[춘추관 領印]</span>
          </div>
        </div>
      </div>
    `;

    if (!isSelectionLocked) {
      this.container.querySelectorAll('.location-card').forEach((card) => {
        card.addEventListener('click', () => {
          const locId = card.getAttribute('data-id') as LocationId;
          if (locId) {
            this.onSelectLocation(locId);
          }
        });
      });
    }
  }
}
