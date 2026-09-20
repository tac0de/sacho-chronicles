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
          <h2>관찰 장소 선택</h2>
          <span style="font-size:11px; color:var(--text-muted);">
            ${isSelectionLocked ? '관찰 진행 중' : '하루 1곳 선택'}
          </span>
        </div>
        <div class="location-list">
          ${locationCards}
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
