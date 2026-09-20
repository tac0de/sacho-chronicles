import type { SilokEvaluationResult } from '../core/records/SilokEvaluator.js';

export class SilokEndingView {
  private container: HTMLElement;
  private result: SilokEvaluationResult;
  private onRestart: (newSeed?: string) => void;
  private onClose: () => void;

  constructor(
    container: HTMLElement,
    result: SilokEvaluationResult,
    callbacks: {
      onRestart: (newSeed?: string) => void;
      onClose: () => void;
    }
  ) {
    this.container = container;
    this.result = result;
    this.onRestart = callbacks.onRestart;
    this.onClose = callbacks.onClose;
  }

  public render(): void {
    const r = this.result;

    const verdictsHtml = r.officialVerdicts
      .map((v) => {
        const accuracyColor = v.accuracyScore >= 80 ? '#79d2a6' : v.accuracyScore >= 50 ? '#e5c178' : '#ff8a8a';

        return `
          <div class="verdict-item">
            <div class="verdict-header">
              <span class="verdict-name">${v.name}</span>
              <span class="verdict-pos">${v.positionTitle} (${v.rank})</span>
              <span class="verdict-score" style="color: ${accuracyColor}; margin-left:auto;">
                사초 부합도: ${v.accuracyScore}%
              </span>
            </div>
            <div class="verdict-truth-row">
              <span style="color:var(--text-muted); font-size:11px;">실제 진실:</span>
              <span style="color:var(--text-paper); font-size:12px;">${v.actualTruthSummary}</span>
            </div>
            <div class="verdict-sacho-row">
              <span style="color:var(--text-muted); font-size:11px;">사초 묘사:</span>
              <span style="color:var(--text-gold); font-size:12px;">${v.sachoDepiction}</span>
            </div>
            <div class="verdict-commentary">
              "${v.verdictText}"
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = `
      <div class="ending-modal-overlay">
        <div class="ending-scroll-container">
          <div class="scroll-roller-top"></div>
          
          <div class="scroll-body">
            <div class="ending-header">
              <div class="ending-seal-large">實錄</div>
              <div class="ending-title-group">
                <h2>조선왕조실록 편찬 완결 (實錄 編纂 完結)</h2>
                <div class="ending-subtitle">사관의 붓끝이 멈추고, 역사의 엄정한 심판이 내려지다</div>
              </div>
              <button id="btn-ending-close-x" class="ending-close-btn" title="닫고 사초 열람">✕</button>
            </div>

            <!-- Title and Evaluation Banner -->
            <div class="evaluation-banner">
              <div class="title-badge-large">
                <span class="hanja">${r.titleHanja}</span>
                <span class="korean">${r.title}</span>
              </div>
              <div class="evaluation-summary-text">
                "${r.evaluationSummary}"
              </div>
            </div>

            <!-- Statistics Grid -->
            <div class="ending-stats-grid">
              <div class="stat-card">
                <div class="stat-label">직필 적중률 (直筆)</div>
                <div class="stat-value" style="color:#79d2a6;">${r.truthRate}%</div>
                <div class="stat-desc">실제 진실을 곧게 밝힘</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">곡필 왜곡률 (曲筆)</div>
                <div class="stat-value" style="color:#ff8a8a;">${r.distortionRate}%</div>
                <div class="stat-desc">모함/소문에 휘둘려 오기</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">궐문 묵살률 (闕文)</div>
                <div class="stat-value" style="color:#e5c178;">${r.omissionRate}%</div>
                <div class="stat-desc">중요 사건을 침묵함</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">총 봉안 사초</div>
                <div class="stat-value" style="color:var(--text-paper);">${r.totalRecordsCount}편</div>
                <div class="stat-desc">사초궤에 영구 보존</div>
              </div>
            </div>

            <!-- Officials Verdict Section -->
            <div class="verdicts-section">
              <div class="verdicts-title">
                <span>📜 백관 12인의 묘비명 및 사신왈 (史臣曰) 총평</span>
              </div>
              <div class="verdicts-list">
                ${verdictsHtml}
              </div>
            </div>

            <!-- Ending Actions -->
            <div class="ending-actions">
              <button id="btn-download-scroll" class="btn btn-secondary">
                🖼️ 실록 족자 이미지 저장 (PNG)
              </button>
              <button id="btn-copy-silok" class="btn btn-secondary">
                📋 총평 복사
              </button>
              <button id="btn-new-era" class="btn btn-gold">
                🔄 새 치세로 다시 시작
              </button>
              <button id="btn-inspect-sacho" class="btn btn-primary">
                📖 사초 전권 열람
              </button>
            </div>
          </div>

          <div class="scroll-roller-bottom"></div>
        </div>
      </div>
    `;

    // Event listeners
    this.container.querySelector('#btn-ending-close-x')?.addEventListener('click', () => {
      this.onClose();
    });

    this.container.querySelector('#btn-inspect-sacho')?.addEventListener('click', () => {
      this.onClose();
    });

    this.container.querySelector('#btn-new-era')?.addEventListener('click', () => {
      const nextSeed = Math.floor(Math.random() * 900000 + 100000).toString();
      this.onRestart(nextSeed);
    });

    this.container.querySelector('#btn-copy-silok')?.addEventListener('click', () => {
      const text = `[조선왕조실록 사관 총평]\n칭호: ${r.title} (${r.titleHanja})\n직필률: ${r.truthRate}% | 곡필률: ${r.distortionRate}% | 묵살률: ${r.omissionRate}%\n총평: "${r.evaluationSummary}"\n\n사초: 춘추필법 (Sacho: The Silent Brush)`;
      navigator.clipboard?.writeText(text).then(() => {
        alert('실록 편찬 결과가 클립보드에 복사되었습니다.');
      });
    });

    this.container.querySelector('#btn-download-scroll')?.addEventListener('click', () => {
      this.exportScrollAsImage();
    });
  }

  private exportScrollAsImage(): void {
    const r = this.result;
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background
    ctx.fillStyle = '#16140f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Decorative borders
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.strokeStyle = '#4a3d24';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

    // 3. Red Seal (實錄之寶)
    ctx.fillStyle = '#b83232';
    ctx.fillRect(60, 50, 64, 64);
    ctx.strokeStyle = '#ff9999';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 50, 64, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.fillText('實錄', 92, 92);

    // 4. Title
    ctx.fillStyle = '#e5c178';
    ctx.font = 'bold 30px serif';
    ctx.textAlign = 'left';
    ctx.fillText('조선왕조실록 사관 총평 (朝鮮王朝實錄)', 140, 80);
    ctx.fillStyle = '#9ea6b8';
    ctx.font = '16px serif';
    ctx.fillText('사관의 붓끝이 멈추고 역사의 엄정한 심판이 내려지다', 140, 106);

    // 5. Title Badge Box
    ctx.fillStyle = '#261f14';
    ctx.fillRect(60, 140, canvas.width - 120, 100);
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 140, canvas.width - 120, 100);

    ctx.fillStyle = '#e5c178';
    ctx.font = 'bold 22px serif';
    ctx.fillText(`사관 칭호: [${r.titleHanja}] ${r.title}`, 80, 180);

    ctx.fillStyle = '#dfc999';
    ctx.font = 'italic 15px serif';
    ctx.fillText(`"${r.evaluationSummary}"`, 80, 215);

    // 6. Stats Boxes
    const statBoxWidth = 180;
    const statsData = [
      { label: '직필 적중률 (直筆)', val: `${r.truthRate}%`, color: '#79d2a6' },
      { label: '곡필 왜곡률 (曲筆)', val: `${r.distortionRate}%`, color: '#ff8a8a' },
      { label: '궐문 묵살률 (闕文)', val: `${r.omissionRate}%`, color: '#e5c178' },
      { label: '총 봉안 사초', val: `${r.totalRecordsCount}편`, color: '#edeae2' },
    ];

    statsData.forEach((s, idx) => {
      const x = 60 + idx * 200;
      ctx.fillStyle = '#201e18';
      ctx.fillRect(x, 260, statBoxWidth, 90);
      ctx.strokeStyle = '#4a3e29';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, 260, statBoxWidth, 90);

      ctx.fillStyle = '#9ea6b8';
      ctx.font = '13px serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.label, x + statBoxWidth / 2, 290);

      ctx.fillStyle = s.color;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(s.val, x + statBoxWidth / 2, 330);
    });

    // 7. Verdicts Section
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e5c178';
    ctx.font = 'bold 20px serif';
    ctx.fillText('백관 12인의 묘비명 및 사신왈 (史臣曰) 총평', 60, 395);

    ctx.strokeStyle = '#5a492b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 410);
    ctx.lineTo(canvas.width - 60, 410);
    ctx.stroke();

    // Draw top 5 official verdicts
    const sampleVerdicts = r.officialVerdicts.slice(0, 5);
    sampleVerdicts.forEach((v, idx) => {
      const y = 445 + idx * 130;
      ctx.fillStyle = '#1e1c16';
      ctx.fillRect(60, y - 25, canvas.width - 120, 115);
      ctx.strokeStyle = '#3d3525';
      ctx.strokeRect(60, y - 25, canvas.width - 120, 115);

      ctx.fillStyle = '#f5eedb';
      ctx.font = 'bold 16px serif';
      ctx.fillText(`${v.name} (${v.positionTitle} · ${v.rank})`, 80, y);

      ctx.fillStyle = '#79d2a6';
      ctx.font = '13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`사초 부합도: ${v.accuracyScore}%`, canvas.width - 80, y);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#a3abbd';
      ctx.font = '13px serif';
      ctx.fillText(`실제 진실: ${v.actualTruthSummary}`, 80, y + 26);
      ctx.fillText(`사초 묘사: ${v.sachoDepiction}`, 80, y + 50);

      ctx.fillStyle = '#dfc999';
      ctx.font = 'italic 13px serif';
      ctx.fillText(`"${v.verdictText}"`, 80, y + 76);
    });

    // 8. Footer Seal & Date
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9ea6b8';
    ctx.font = '14px serif';
    ctx.fillText('춘추관 편수관 봉안 (春秋館 奉安之印)', canvas.width - 80, canvas.height - 55);

    // Download trigger
    const link = document.createElement('a');
    link.download = `sacho_silok_verdict_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
