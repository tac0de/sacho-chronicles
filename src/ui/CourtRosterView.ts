import type { Engine } from '../core/simulation/Engine.js';
import type { Agent } from '../core/agents/Agent.js';
import { POSITIONS } from '../data/positions.js';
import { SoundManager } from '../core/audio/SoundManager.js';
import { renderIcon } from './icons/Icons.js';

function getInsigniaIcon(posId: string): string {
  switch (posId) {
    case 'KING':
      return './assets/insignia/dragon_gold.jpg';
    case 'CHIEF_STATE_COUNCILLOR':
    case 'LEFT_STATE_COUNCILLOR':
    case 'RIGHT_STATE_COUNCILLOR':
    case 'MINISTER_OF_PERSONNEL':
      return './assets/insignia/crane_double.jpg';
    case 'MINISTER_OF_WAR':
      return './assets/insignia/tiger_double.jpg';
    case 'INSPECTOR_GENERAL':
      return './assets/insignia/haechi.jpg';
    case 'ROYAL_EUNUCH':
      return './assets/insignia/silver_pheasant.jpg';
    case 'CENSOR_GENERAL':
    case 'CHIEF_SECRETARY':
    case 'ACADEMY_DRAFTER':
    case 'COURT_CLERK':
    default:
      return './assets/insignia/crane_single.jpg';
  }
}

export class CourtRosterView {
  private container: HTMLElement;
  private engine: Engine;
  private selectedAgentId: string | null = null;

  constructor(container: HTMLElement, engine: Engine) {
    this.container = container;
    this.engine = engine;
  }

  public render(): void {
    const agents = this.engine.agents;

    const cardsHtml = agents
      .map((a) => {
        const isSelected = a.id === this.selectedAgentId;
        const isAlert = a.currentStatus.includes('위기') || a.currentStatus.includes('근신');
        const isCompete = a.currentStatus.includes('경쟁');
        const pos = POSITIONS[a.positionId];
        const insigniaIcon = getInsigniaIcon(a.positionId);

        const statusClass = isAlert ? 'alert' : isCompete ? 'compete' : '';

        return `
          <div class="official-card ${isSelected ? 'selected' : ''}" data-agent-id="${a.id}">
            <div class="official-card-layout">
              <img class="official-insignia-badge" src="${insigniaIcon}" alt="흉배" width="38" height="38" />
              <div class="official-main-info">
                <div class="official-header">
                  <span class="official-name">${a.name} <span class="official-age">(${a.age}세)</span></span>
                  <span class="official-rank">${pos?.officialRankName || a.rank}</span>
                </div>
                <div class="official-pos">${a.positionTitle} (${pos?.hanjaTitle || ''}) · ${pos?.department || a.department}</div>
              </div>
            </div>
            <div class="official-goal-row">
              <span class="official-goal-label">지향:</span>
              <span class="official-goal-text">${a.goal.description}</span>
            </div>
            <div class="official-status-row">
              <span class="official-insignia">복제: ${pos?.insignia || '관복'}</span>
              <span class="status-badge ${statusClass}">${a.currentStatus}</span>
            </div>
          </div>
        `;
      })
      .join('');

    // Selected agent profile detail preview
    const selectedAgent: Agent | undefined = this.selectedAgentId ? this.engine.agentMap.get(this.selectedAgentId) : undefined;
    let detailSection = '';
    if (selectedAgent) {
      const pos = POSITIONS[selectedAgent.positionId];
      detailSection = `
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-gold); padding:12px 14px; margin:10px 12px; border-radius:var(--radius-md); font-size:12px; flex-shrink:0;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
            <div style="font-weight:800; color:var(--text-gold); font-size:14px;">
              ${selectedAgent.name} <span style="font-size:12px; font-weight:normal; color:var(--text-paper);">[${pos?.hanjaTitle || selectedAgent.positionTitle}]</span>
            </div>
            <button id="btn-close-official-detail" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:12px; display:inline-flex; align-items:center;">${renderIcon('close', { size: 14 })}</button>
          </div>
          <div style="color:var(--text-secondary); margin-bottom:4px; font-size:11px;">
            품계: <span style="color:var(--text-main); font-weight:600;">${pos?.officialRankName || selectedAgent.rank}</span>
          </div>
          <div style="color:var(--text-secondary); margin-bottom:6px; font-size:11px;">
            관청: ${pos?.department} (${pos?.departmentHanja || ''}) | 복식: ${pos?.insignia || ''}
          </div>
          <div style="color:var(--text-paper); margin-bottom:4px; line-height:1.45;">
            <strong>명분과 목표:</strong> ${selectedAgent.goal.description}
          </div>
          <div style="color:var(--text-secondary); margin-top:6px; font-size:11px; line-height:1.4;">
            ${pos?.description || ''}
          </div>
          <div style="color:var(--text-muted); font-size:10px; margin-top:6px; border-top:1px dashed rgba(197, 160, 89, 0.3); padding-top:4px;">
            * 은밀한 속내(야심·정직성·실제 관계)는 <strong>[디버그 모드]</strong>에서 확인 가능합니다.
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="sidebar-officials">
        <div class="panel-header">
          <h2>조정 관원 열람 (12인)</h2>
          <span style="font-size:11px; color:var(--text-gold);">朝廷 百官</span>
        </div>
        ${detailSection}
        <div class="officials-list">
          ${cardsHtml}
        </div>
      </div>
    `;

    this.container.querySelectorAll('.official-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-agent-id');
        this.selectedAgentId = this.selectedAgentId === id ? null : id;
        SoundManager.getInstance().playScroll();
        this.render();
      });
    });

    this.container.querySelector('#btn-close-official-detail')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectedAgentId = null;
      SoundManager.getInstance().playScroll();
      this.render();
    });
  }
}
