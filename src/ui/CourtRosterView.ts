import type { Engine } from '../core/simulation/Engine.js';
import type { Agent } from '../core/agents/Agent.js';

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

        return `
          <div class="official-card ${isSelected ? 'selected' : ''}" data-agent-id="${a.id}">
            <div class="official-header">
              <span class="official-name">${a.name} (${a.age}세)</span>
              <span class="official-rank">${a.rank}</span>
            </div>
            <div class="official-pos">${a.positionTitle} · ${a.department}</div>
            <div class="official-status-row">
              <span style="color:var(--text-muted); font-size:11px;">지향: ${a.goal.description.slice(0, 14)}...</span>
              <span class="status-badge ${isAlert ? 'alert' : ''}">${a.currentStatus}</span>
            </div>
          </div>
        `;
      })
      .join('');

    // Selected agent profile detail preview
    const selectedAgent: Agent | undefined = this.selectedAgentId ? this.engine.agentMap.get(this.selectedAgentId) : undefined;
    let detailSection = '';
    if (selectedAgent) {
      detailSection = `
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-gold); padding:12px; margin:10px; border-radius:var(--radius-md); font-size:12px;">
          <div style="font-weight:bold; color:var(--text-gold); font-size:13px; margin-bottom:4px;">
            ${selectedAgent.name} (${selectedAgent.positionTitle})
          </div>
          <div style="color:var(--text-secondary); margin-bottom:6px;">
            소속: ${selectedAgent.department} (${selectedAgent.rank})
          </div>
          <div style="color:var(--text-main); margin-bottom:4px;">
            <strong>명분과 목표:</strong> ${selectedAgent.goal.description}
          </div>
          <div style="color:var(--text-muted); font-size:11px; margin-top:6px; border-top:1px dashed var(--border-subtle); padding-top:4px;">
            * 내부 성향 및 실제 관계값은 <strong>[디버그 모드]</strong>에서 열람 가능합니다.
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="sidebar-officials">
        <div class="panel-header">
          <h2>조정 관원 일람 (12인)</h2>
          <span style="font-size:11px; color:var(--text-muted);">주요 인물</span>
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
        this.render();
      });
    });
  }
}
