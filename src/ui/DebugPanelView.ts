import type { Engine } from '../core/simulation/Engine.js';

type DebugTab = 'FACTS' | 'AGENTS' | 'RELATIONS' | 'EVENTS' | 'LOGS';

export class DebugPanelView {
  private container: HTMLElement;
  private engine: Engine;
  private activeTab: DebugTab = 'FACTS';
  private onClose: () => void;
  private onFastForward: (days: number) => void;

  constructor(
    container: HTMLElement,
    engine: Engine,
    callbacks: {
      onClose: () => void;
      onFastForward: (days: number) => void;
    }
  ) {
    this.container = container;
    this.engine = engine;
    this.onClose = callbacks.onClose;
    this.onFastForward = callbacks.onFastForward;
  }

  public render(isOpen: boolean): void {
    if (!isOpen) {
      this.container.innerHTML = `<div class="debug-panel hidden"></div>`;
      return;
    }

    const tabs: { id: DebugTab; label: string }[] = [
      { id: 'FACTS', label: '1. World Facts (실제 진실)' },
      { id: 'AGENTS', label: '2. NPC 내부 성향치' },
      { id: 'RELATIONS', label: '3. 12x12 관계 매트릭스' },
      { id: 'EVENTS', label: '4. 사건 인과 사슬' },
      { id: 'LOGS', label: '5. 시뮬레이션 로그' },
    ];

    const tabButtons = tabs
      .map(
        (t) =>
          `<button class="debug-tab ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`
      )
      .join('');

    let contentHtml = '';
    switch (this.activeTab) {
      case 'FACTS':
        contentHtml = this.renderWorldFacts();
        break;
      case 'AGENTS':
        contentHtml = this.renderAgentsDebug();
        break;
      case 'RELATIONS':
        contentHtml = this.renderRelationsMatrix();
        break;
      case 'EVENTS':
        contentHtml = this.renderEventsCausality();
        break;
      case 'LOGS':
        contentHtml = this.renderLogs();
        break;
    }

    this.container.innerHTML = `
      <div class="debug-panel">
        <div class="debug-header">
          <div class="debug-title">
            <span>⚙️ SIMULATION DEBUG CONSOLE</span>
            <span style="color:#6b7280; font-size:11px;">[Seed: ${this.engine.seed} | Day: ${this.engine.timeManager.currentDay}]</span>
          </div>

          <div class="debug-tabs">
            ${tabButtons}
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <button id="btn-ff-5" class="btn btn-secondary btn-sm" title="5일 자동 시뮬레이션">+5일 진행</button>
            <button id="btn-ff-30" class="btn btn-secondary btn-sm" title="30일 자동 시뮬레이션">+30일 진행</button>
            <button id="btn-debug-close" class="btn btn-secondary btn-sm">✕ 닫기</button>
          </div>
        </div>

        <div class="debug-body">
          ${contentHtml}
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelectorAll('.debug-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        this.activeTab = tabBtn.getAttribute('data-tab') as DebugTab;
        this.render(true);
      });
    });

    this.container.querySelector('#btn-debug-close')?.addEventListener('click', () => {
      this.onClose();
    });

    this.container.querySelector('#btn-ff-5')?.addEventListener('click', () => {
      this.onFastForward(5);
    });

    this.container.querySelector('#btn-ff-30')?.addEventListener('click', () => {
      this.onFastForward(30);
    });
  }

  private renderWorldFacts(): string {
    const facts = this.engine.factRegistry.getAll().slice(-25).reverse();

    if (facts.length === 0) {
      return `<p style="color:#6b7280;">아직 등록된 WorldFact가 없습니다.</p>`;
    }

    const rows = facts
      .map((f) => {
        const subject = this.engine.agentMap.get(f.subjectId);
        const truthBadge = f.isActuallyGuilty
          ? `<span class="truth-badge guilty">실제 유책(참)</span>`
          : `<span class="truth-badge innocent">결백/무고(거짓)</span>`;

        return `
          <tr>
            <td style="color:#e5c178;">Day ${f.day}</td>
            <td style="color:#9cd0ff;">${f.id}</td>
            <td><strong>${subject?.name || f.subjectId}</strong> (${subject?.positionTitle || ''})</td>
            <td>${f.type}</td>
            <td>${truthBadge}</td>
            <td>${f.description}</td>
            <td style="color:#8c9cb3; font-size:11px;">${f.underlyingContext}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <table class="debug-table">
        <thead>
          <tr>
            <th>발생일</th>
            <th>Fact ID</th>
            <th>대상 인물</th>
            <th>유형</th>
            <th>객관적 진실</th>
            <th>실제 일어난 사실</th>
            <th>원인 및 맥락</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  private renderAgentsDebug(): string {
    const rows = this.engine.agents
      .map((a) => {
        const grudgesText = Array.from(a.grudges.entries())
          .map(([tId, g]) => `${this.engine.agentMap.get(tId)?.name || tId}: ${g}`)
          .join(', ') || '없음';

        return `
          <tr>
            <td style="color:#e5c178; font-weight:bold;">${a.name}</td>
            <td>${a.positionTitle}</td>
            <td style="color:#9cd0ff;">${a.politicalPower}</td>
            <td style="color:${a.ambition >= 75 ? '#ff7b7b' : '#e6e8ed'}">${a.ambition}</td>
            <td>${a.duty}</td>
            <td>${a.loyalty}</td>
            <td>${a.riskAversion}</td>
            <td style="color:${a.honesty <= 40 ? '#ff7b7b' : '#8ce6b0'}">${a.honesty}</td>
            <td><span style="color:#f2c979;">${a.currentStatus}</span></td>
            <td>${a.knownInfoIds.size}개 알림 / ${a.believedInfoIds.size}개 믿음</td>
            <td style="font-size:11px; color:#ff9999;">${grudgesText}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <table class="debug-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>관직</th>
            <th>정치력</th>
            <th>야심</th>
            <th>명분</th>
            <th>충성</th>
            <th>위험회피</th>
            <th>정직성</th>
            <th>현재 상태</th>
            <th>지식/믿음</th>
            <th>원한 목록</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  private renderRelationsMatrix(): string {
    const agents = this.engine.agents;
    const rel = this.engine.relationships;

    const headers = agents.map((a) => `<th style="font-size:10px; padding:4px;">${a.name.slice(0, 2)}</th>`).join('');

    const rows = agents
      .map((rowAgent) => {
        const cells = agents
          .map((colAgent) => {
            if (rowAgent.id === colAgent.id) {
              return `<td style="background:#171c26; text-align:center; color:#4a5568;">-</td>`;
            }
            const val = rel.getRelation(rowAgent.id, colAgent.id);
            const color = val < -20 ? '#ff7b7b' : val > 20 ? '#8ce6b0' : '#8c9cb3';
            return `<td style="text-align:center; font-size:11px; color:${color}; padding:3px;" title="${rowAgent.name} → ${colAgent.name}: ${val}">${val}</td>`;
          })
          .join('');

        return `
          <tr>
            <td style="font-weight:bold; font-size:11px; color:#e5c178; white-space:nowrap;">${rowAgent.name} (${rowAgent.positionTitle.slice(0, 3)})</td>
            ${cells}
          </tr>
        `;
      })
      .join('');

    return `
      <p style="margin-bottom:8px; color:#8c9cb3; font-size:11px;">
        * 행(A)에서 열(B)을 바라보는 비대칭 관계 수치입니다 (-100 ~ +100). 마우스를 올리면 대상이 표시됩니다.
      </p>
      <div style="overflow-x:auto;">
        <table class="debug-table" style="font-size:11px;">
          <thead>
            <tr>
              <th>행(발신) \\ 열(수신)</th>
              ${headers}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderEventsCausality(): string {
    const events = [...this.engine.allEventsHistory].slice(-30).reverse();

    if (events.length === 0) {
      return `<p style="color:#6b7280;">아직 발생한 정치 사건이 없습니다.</p>`;
    }

    const rows = events
      .map((ev) => {
        const instigator = this.engine.agentMap.get(ev.instigatorId);
        const target = ev.targetId ? this.engine.agentMap.get(ev.targetId) : undefined;

        return `
          <tr>
            <td style="color:#e5c178;">Day ${ev.day}</td>
            <td style="color:#9cd0ff;">${ev.type}</td>
            <td><strong>${ev.title}</strong></td>
            <td>${instigator?.name || ev.instigatorId} → ${target ? target.name : '없음'}</td>
            <td style="color:#f6ad55;">${ev.causationReason}</td>
            <td style="font-size:11px; color:#8c9cb3;">${ev.summary}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <table class="debug-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>유형</th>
            <th>사건명</th>
            <th>주동자 → 대상</th>
            <th>발동 원인 (Causation Reason)</th>
            <th>결과 요약</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  private renderLogs(): string {
    const logs = [...this.engine.simulationLogs].reverse().slice(0, 60);

    if (logs.length === 0) {
      return `<p style="color:#6b7280;">로그가 없습니다.</p>`;
    }

    const lines = logs
      .map((l) => {
        const isHighlight = l.includes('탄핵') || l.includes('질책') || l.includes('모함') || l.includes('뇌물');
        return `<div class="log-entry ${isHighlight ? 'highlight' : ''}">${l}</div>`;
      })
      .join('');

    return `
      <div style="background:#11151f; padding:12px; border-radius:4px; font-family:var(--font-mono); font-size:11px; line-height:1.5;">
        ${lines}
      </div>
    `;
  }
}
