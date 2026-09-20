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
      { id: 'FACTS', label: '1. 궐내 실상 (闕內 實相)' },
      { id: 'AGENTS', label: '2. 백관 심성 (百官 心性)' },
      { id: 'RELATIONS', label: '3. 붕당 연계표 (朋黨 連繫表)' },
      { id: 'EVENTS', label: '4. 정쟁 인과록 (政爭 因果錄)' },
      { id: 'LOGS', label: '5. 감찰 비기 (監察 秘記)' },
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
            <span>⚖️ 사헌부 은밀 감찰록 (司憲府 隱密 監察錄)</span>
            <span style="color:#bda688; font-size:11px; font-family:var(--font-serif);">[개벽 시드: ${this.engine.seed} | 재위: ${this.engine.timeManager.currentDay}일차]</span>
          </div>

          <div class="debug-tabs">
            ${tabButtons}
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <button id="btn-ff-5" class="btn btn-secondary btn-sm" title="5일간 궐내 정쟁 속진">5일 속진 (五日)</button>
            <button id="btn-ff-30" class="btn btn-secondary btn-sm" title="한 달간 궐내 정쟁 속진">한 달 속진 (一月)</button>
            <button id="btn-debug-close" class="btn btn-secondary btn-sm">비록 봉인 ✕</button>
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
          ? `<span class="truth-badge guilty">유책 혐의 (참·實)</span>`
          : `<span class="truth-badge innocent">결백 무고 (거짓·僞)</span>`;

        return `
          <tr>
            <td style="color:#dfba6c;">Day ${f.day}</td>
            <td style="color:#bda688; font-family:var(--font-mono); font-size:10px;">${f.id}</td>
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
            <th>발생 일자</th>
            <th>비록 식별자</th>
            <th>연루 관원</th>
            <th>정쟁 유형</th>
            <th>실제 진위(眞僞)</th>
            <th>은밀한 실상</th>
            <th>발단 배경 및 맥락</th>
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
            <td style="color:#dfba6c; font-weight:bold;">${a.name}</td>
            <td>${a.positionTitle}</td>
            <td style="color:#c5a059;">${a.politicalPower}</td>
            <td style="color:${a.ambition >= 75 ? '#ff7b7b' : '#eae0cb'}">${a.ambition}</td>
            <td>${a.duty}</td>
            <td>${a.loyalty}</td>
            <td>${a.riskAversion}</td>
            <td style="color:${a.honesty <= 40 ? '#ff7b7b' : '#8ce6b0'}">${a.honesty}</td>
            <td><span style="color:#dfba6c;">${a.currentStatus}</span></td>
            <td>${a.knownInfoIds.size}건 인지 / ${a.believedInfoIds.size}건 신뢰</td>
            <td style="font-size:11px; color:#ff9999;">${grudgesText}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <table class="debug-table">
        <thead>
          <tr>
            <th>관원 성명</th>
            <th>품계 관직</th>
            <th>권세(權勢)</th>
            <th>야심(野心)</th>
            <th>대의(大義)</th>
            <th>충절(忠節)</th>
            <th>보신(保身)</th>
            <th>직언(直言)</th>
            <th>조정 동태</th>
            <th>지식과 신념</th>
            <th>사천(私怨) 및 원한</th>
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
            <td style="font-weight:bold; font-size:11px; color:#dfba6c; white-space:nowrap;">${rowAgent.name} (${rowAgent.positionTitle.slice(0, 3)})</td>
            ${cells}
          </tr>
        `;
      })
      .join('');

    return `
      <p style="margin-bottom:8px; color:#bda688; font-size:11px;">
        * 궐내 백관 상호 간의 은밀한 친소(親疎) 및 원한 수치입니다 (-100 ~ +100). 마우스를 올리면 대상이 표시됩니다.
      </p>
      <div style="overflow-x:auto;">
        <table class="debug-table" style="font-size:11px;">
          <thead>
            <tr>
              <th>발신 관원 \\ 수신 관원</th>
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
            <td style="color:#dfba6c;">Day ${ev.day}</td>
            <td style="color:#bda688;">${ev.type}</td>
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
            <th>발생 일자</th>
            <th>정쟁 범주</th>
            <th>사건 표제</th>
            <th>발의자 → 피탄자</th>
            <th>발동 원인 및 동기</th>
            <th>조정 파급 결과</th>
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
