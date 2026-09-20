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
          <div class="debug-header-top">
            <div class="debug-title">
              <span class="debug-title-text">⚖️ 사헌부 은밀 감찰록 (司憲府 隱密 監察錄)</span>
              <span class="debug-seed-info">[개벽 시드: ${this.engine.seed} · 재위: ${this.engine.timeManager.currentDay}일차]</span>
            </div>
            <button id="btn-debug-close" class="btn btn-secondary btn-sm debug-close-btn" title="감찰록 닫기">비록 봉인 ✕</button>
          </div>

          <div class="debug-toolbar">
            <div class="debug-tabs">
              ${tabButtons}
            </div>
            <div class="debug-actions">
              <button id="btn-ff-5" class="btn btn-secondary btn-xs" title="5일간 궐내 정쟁 속진">⚡ 5일 속진 (五日)</button>
              <button id="btn-ff-30" class="btn btn-secondary btn-xs" title="한 달간 궐내 정쟁 속진">⚡ 한 달 속진 (一月)</button>
            </div>
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
      return `
        <div class="debug-empty-state">
          <span class="empty-symbol">空</span>
          <p class="empty-main">현재 사헌부에 등록된 은밀한 비록(WorldFact)이 없습니다.</p>
          <p class="empty-sub">궁궐 내에서 관원들의 밀담, 상소, 탄핵 등 정쟁이 발생하면 사건의 숨겨진 참과 거짓이 이곳에 기록됩니다.</p>
        </div>
      `;
    }

    const rows = facts
      .map((f) => {
        const subject = this.engine.agentMap.get(f.subjectId);
        const truthBadge = f.isActuallyGuilty
          ? `<span class="truth-badge guilty">유책 혐의 (참·實)</span>`
          : `<span class="truth-badge innocent">결백 무고 (거짓·僞)</span>`;

        return `
          <tr>
            <td class="col-nowrap" style="color:#dfba6c; font-weight:700;">Day ${f.day}</td>
            <td class="col-nowrap" style="color:#bda688; font-family:var(--font-mono); font-size:11px;">${f.id}</td>
            <td class="col-nowrap"><strong>${subject?.name || f.subjectId}</strong> <span style="font-size:11px; color:#a3907c;">(${subject?.positionTitle || ''})</span></td>
            <td class="col-nowrap"><span class="debug-category-tag">${f.type}</span></td>
            <td class="col-nowrap">${truthBadge}</td>
            <td class="col-desc">${f.description}</td>
            <td class="col-context">${f.underlyingContext}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <div class="debug-table-scroll">
        <table class="debug-table">
          <thead>
            <tr>
              <th>발생 일자</th>
              <th>비록 식별자</th>
              <th>연루 관원</th>
              <th>정쟁 유형</th>
              <th>실제 진위(眞僞)</th>
              <th>은밀한 실상 (사실 관계)</th>
              <th>발단 배경 및 맥락</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderAgentsDebug(): string {
    const rows = this.engine.agents
      .map((a) => {
        const grudgesList = Array.from(a.grudges.entries());
        const grudgesHtml = grudgesList.length > 0
          ? grudgesList
              .map(([tId, g]) => {
                const targetName = this.engine.agentMap.get(tId)?.name || tId;
                return `<span class="grudge-chip" title="${targetName}에 대한 원한 수치: ${g}">${targetName} <strong style="color:#ff7b7b;">-${g}</strong></span>`;
              })
              .join(' ')
          : `<span style="color:#6d5b4a; font-size:11px;">원한 없음</span>`;

        return `
          <tr>
            <td class="col-nowrap" style="color:#dfba6c; font-weight:bold;">${a.name}</td>
            <td class="col-nowrap" style="font-size:11px;">${a.positionTitle}</td>
            <td class="col-stat" style="color:#c5a059; font-weight:700;">${a.politicalPower}</td>
            <td class="col-stat" style="color:${a.ambition >= 75 ? '#ff7b7b' : '#eae0cb'};">${a.ambition}</td>
            <td class="col-stat">${a.duty}</td>
            <td class="col-stat">${a.loyalty}</td>
            <td class="col-stat">${a.riskAversion}</td>
            <td class="col-stat" style="color:${a.honesty <= 40 ? '#ff7b7b' : '#8ce6b0'}; font-weight:700;">${a.honesty}</td>
            <td class="col-nowrap"><span class="status-badge">${a.currentStatus}</span></td>
            <td class="col-nowrap" style="font-size:11px;">
              <span style="color:#bda688;">${a.knownInfoIds.size}건 인지</span> · <span style="color:#8ce6b0;">${a.believedInfoIds.size}건 신뢰</span>
            </td>
            <td class="col-grudges">${grudgesHtml}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <div class="debug-table-scroll">
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
      </div>
    `;
  }

  private renderRelationsMatrix(): string {
    const agents = this.engine.agents;
    const rel = this.engine.relationships;

    const headers = agents
      .map((a) => `<th class="matrix-col-header" title="${a.name} (${a.positionTitle})">${a.name.slice(0, 2)}</th>`)
      .join('');

    const rows = agents
      .map((rowAgent) => {
        const cells = agents
          .map((colAgent) => {
            if (rowAgent.id === colAgent.id) {
              return `<td class="matrix-cell self">-</td>`;
            }
            const val = rel.getRelation(rowAgent.id, colAgent.id);
            const valClass = val < -20 ? 'negative' : val > 20 ? 'positive' : 'neutral';
            const sign = val > 0 ? `+${val}` : `${val}`;
            return `<td class="matrix-cell ${valClass}" title="${rowAgent.name} → ${colAgent.name}: ${sign}">${sign}</td>`;
          })
          .join('');

        return `
          <tr>
            <td class="matrix-row-header" title="${rowAgent.name} (${rowAgent.positionTitle})">
              ${rowAgent.name} <span class="matrix-pos-small">(${rowAgent.positionTitle.slice(0, 3)})</span>
            </td>
            ${cells}
          </tr>
        `;
      })
      .join('');

    return `
      <div class="debug-relation-info">
        <p class="matrix-desc">
          * 궐내 백관 12인 상호 간의 은밀한 <strong>친소(親疎) 및 원한 수치(-100 ~ +100)</strong>입니다. 행(발신 관원)에서 열(수신 관원)을 향한 호오를 뜻하며, 숫자에 마우스를 올리면 상세 정보가 표시됩니다.
        </p>
      </div>
      <div class="debug-table-scroll">
        <table class="debug-table matrix-table">
          <thead>
            <tr>
              <th class="matrix-origin-header">발신 관원 \\ 수신 관원</th>
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
      return `
        <div class="debug-empty-state">
          <span class="empty-symbol">空</span>
          <p class="empty-main">현재까지 발생한 정쟁 사건이 없습니다.</p>
          <p class="empty-sub">궁궐의 날이 흐르면 탄핵, 비리 고발, 인사 청탁, 파벌 결탁 등의 인과 관계가 이곳에 기록됩니다.</p>
        </div>
      `;
    }

    const rows = events
      .map((ev) => {
        const instigator = this.engine.agentMap.get(ev.instigatorId);
        const target = ev.targetId ? this.engine.agentMap.get(ev.targetId) : undefined;
        const targetText = target ? `${target.name} (${target.positionTitle})` : '조정 전체';

        return `
          <tr>
            <td class="col-nowrap" style="color:#dfba6c; font-weight:700;">Day ${ev.day}</td>
            <td class="col-nowrap"><span class="debug-category-tag">${ev.type}</span></td>
            <td class="col-nowrap"><strong>${ev.title}</strong></td>
            <td class="col-nowrap">
              <span style="color:#e5dac5;">${instigator?.name || ev.instigatorId}</span>
              <span style="color:#dfba6c; margin:0 4px;">➔</span>
              <span style="color:#f5b08c;">${targetText}</span>
            </td>
            <td class="col-causation">${ev.causationReason}</td>
            <td class="col-summary">${ev.summary}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <div class="debug-table-scroll">
        <table class="debug-table">
          <thead>
            <tr>
              <th>발생 일자</th>
              <th>정쟁 범주</th>
              <th>사건 표제</th>
              <th>발의자 ➔ 피탄자</th>
              <th>발동 원인 및 은밀한 동기</th>
              <th>조정 파급 결과 요약</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderLogs(): string {
    const logs = [...this.engine.simulationLogs].reverse().slice(0, 60);

    if (logs.length === 0) {
      return `
        <div class="debug-empty-state">
          <span class="empty-symbol">空</span>
          <p class="empty-main">기록된 감찰 비기(로그)가 없습니다.</p>
        </div>
      `;
    }

    const lines = logs
      .map((l) => {
        const isHighlight = l.includes('탄핵') || l.includes('질책') || l.includes('모함') || l.includes('뇌물') || l.includes('사화');
        return `
          <div class="debug-log-line ${isHighlight ? 'highlight' : ''}">
            <span class="log-bullet">${isHighlight ? '⚡' : '•'}</span>
            <span class="log-text">${l}</span>
          </div>
        `;
      })
      .join('');

    return `
      <div class="debug-logs-wrapper">
        <div class="debug-logs-header">
          <span>📜 사헌부 실록청 실시간 정쟁 시뮬레이션 로그 (최근 60건)</span>
        </div>
        <div class="debug-logs-content">
          ${lines}
        </div>
      </div>
    `;
  }
}

