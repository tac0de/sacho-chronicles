import type { Engine } from '../core/simulation/Engine.js';
import { LOCATIONS, type LocationId } from '../data/locations.js';
import { POSITIONS } from '../data/positions.js';
import { SoundManager } from '../core/audio/SoundManager.js';

export const LOCATION_IMAGES: Record<LocationId, string> = {
  ROYAL_HALL: './assets/locations/sajeongjeon.jpg',
  ROYAL_SECRETARIAT: './assets/locations/eundae.jpg',
  OFFICE_OF_INSPECTOR: './assets/locations/baekbu.jpg',
  OFFICE_OF_CENSORS: './assets/locations/miwon.jpg',
  PALACE_CORRIDOR: './assets/locations/cheonrang.jpg',
};

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
        const imgUrl = LOCATION_IMAGES[loc.id] || './assets/locations/sajeongjeon.svg';
        const visitors = loc.primaryVisitors
          .slice(0, 3)
          .map((pId) => `<span class="visitor-tag">${POSITIONS[pId]?.title || pId}</span>`)
          .join('');

        const omen = this.engine.dailyLocationOmens.get(loc.id) || '처소에 고요한 기운이 감돕니다.';

        return `
          <div class="location-card ${isSelected ? 'selected' : ''}" data-id="${loc.id}">
            <div class="location-card-layout">
              <img class="location-thumbnail" src="${imgUrl}" alt="${loc.name}" width="54" height="54" />
              <div class="location-info">
                <div class="location-card-title">
                  <span class="name">${loc.name}</span>
                  <span class="hanja">(${loc.hanja})</span>
                </div>
                <div class="location-alias">
                  ${loc.alias}
                </div>
              </div>
            </div>
            <div class="location-omen">
              <span class="omen-badge">氣流</span>
              <span class="omen-text">${omen}</span>
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
          <span class="panel-header-badge">
            ${isSelectionLocked ? '관찰 중' : '일일 1처 선택'}
          </span>
        </div>
        <div class="location-list">
          ${locationCards}
        </div>

        <div class="scribe-dossier">
          <div class="scribe-dossier-header">
            <img src="./assets/seal_stamp.svg" width="22" height="22" alt="사관 인장" style="vertical-align:middle; margin-right:4px;" />
            <span>춘추관 사관 (春秋館 史官)</span>
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
            SoundManager.getInstance().playScroll();
            this.onSelectLocation(locId);
          }
        });
      });
    }
  }
}
