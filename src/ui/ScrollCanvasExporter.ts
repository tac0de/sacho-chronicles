export interface ScrollExportData {
  kingName: string;
  generation: number;
  day: number;
  evalGrade: string;
  evalTitle: string;
  evalSummary: string;
  truthRate?: number;
  distortionRate?: number;
  omissionRate?: number;
  recordsCount: number;
  integrity: number;
  peril: number;
  wealth: number;
  userComment?: string;
  isDailyChallenge?: boolean;
  verdicts?: Array<{
    name: string;
    positionTitle: string;
    rank: string;
    accuracyScore: number;
    verdictText: string;
  }>;
}

export function exportScrollCanvas(data: ScrollExportData): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Ancient Silk & Hanji Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#1a140d');
  bgGrad.addColorStop(0.5, '#120d08');
  bgGrad.addColorStop(1, '#0c0805');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Outer Ornamental Borders
  ctx.strokeStyle = '#bfa15f';
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

  ctx.strokeStyle = '#5a4025';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

  // Corner Ornaments
  const cornerSize = 24;
  const corners = [
    [42, 42],
    [canvas.width - 42 - cornerSize, 42],
    [42, canvas.height - 42 - cornerSize],
    [canvas.width - 42 - cornerSize, canvas.height - 42 - cornerSize],
  ];
  ctx.strokeStyle = '#dfba6c';
  ctx.lineWidth = 2;
  corners.forEach(([cx, cy]) => {
    ctx.strokeRect(cx, cy, cornerSize, cornerSize);
  });

  // 3. Red Imperial Seal (實錄之寶)
  const sealX = 70;
  const sealY = 65;
  const sealSize = 72;
  ctx.fillStyle = '#b82828';
  ctx.fillRect(sealX, sealY, sealSize, sealSize);
  ctx.strokeStyle = '#e57373';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(sealX, sealY, sealSize, sealSize);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px serif';
  ctx.textAlign = 'center';
  ctx.fillText('實錄', sealX + sealSize / 2, sealY + 32);
  ctx.fillText('之寶', sealX + sealSize / 2, sealY + 62);

  // 4. Header Titles & Daily Challenge Tag
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e5c178';
  ctx.font = 'bold 32px serif';
  ctx.fillText(`${data.kingName} 실록초본 (實錄草本)`, 165, 95);

  if (data.isDailyChallenge) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#dfba6c';
    ctx.font = 'bold 15px serif';
    ctx.fillText('📅 [오늘의 사초 챌린지 완수]', canvas.width - 70, 75);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#a89885';
  ctx.font = '16px serif';
  ctx.fillText(`조선 제${data.generation}대 사관 가필록 · 재위 ${data.day}일간의 춘추직필 (春秋直筆)`, 165, 126);

  // 5. Historical Verdict Hero Card
  const heroY = 165;
  ctx.fillStyle = '#1c150e';
  ctx.fillRect(70, heroY, canvas.width - 140, 130);
  ctx.strokeStyle = '#755530';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(70, heroY, canvas.width - 140, 130);

  // Grade badge ribbon
  ctx.fillStyle = '#2d1e11';
  ctx.fillRect(90, heroY + 20, 90, 90);
  ctx.strokeStyle = '#dfba6c';
  ctx.lineWidth = 2;
  ctx.strokeRect(90, heroY + 20, 90, 90);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#dfba6c';
  ctx.font = 'bold 44px serif';
  ctx.fillText(data.evalGrade || 'A', 135, heroY + 80);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#dfba6c';
  ctx.font = 'bold 24px serif';
  ctx.fillText(`어제 사관 칭호: ${data.evalTitle}`, 205, heroY + 52);

  ctx.fillStyle = '#e8decb';
  ctx.font = 'italic 16px serif';
  ctx.fillText(`"${data.evalSummary}"`, 205, heroY + 92);

  // 6. Core Historical Metrics (4 Boxes)
  const statY = 320;
  const statW = 205;
  const statH = 95;
  const statGap = 13;

  const statBoxes = [
    {
      k: '직필 적중률 (直筆)',
      v: data.truthRate !== undefined ? `${data.truthRate}%` : `${data.integrity}점`,
      color: '#79d2a6',
    },
    {
      k: '사화 위기율 (士禍)',
      v: data.distortionRate !== undefined ? `${data.distortionRate}% (곡필)` : `${data.peril}%`,
      color: '#ff8a8a',
    },
    {
      k: '봉안 사초 총수',
      v: `${data.recordsCount}편`,
      color: '#dfba6c',
    },
    {
      k: '가문 누적 재력',
      v: `${data.wealth}냥`,
      color: '#f5eedd',
    },
  ];

  statBoxes.forEach((s, idx) => {
    const bx = 70 + idx * (statW + statGap);
    ctx.fillStyle = '#17110b';
    ctx.fillRect(bx, statY, statW, statH);
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, statY, statW, statH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#9e8d7a';
    ctx.font = '13px serif';
    ctx.fillText(s.k, bx + statW / 2, statY + 32);

    ctx.fillStyle = s.color;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(s.v, bx + statW / 2, statY + 72);
  });

  // 7. Hall of Officials / Verdicts Section
  const verdictSectionY = 445;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#dfba6c';
  ctx.font = 'bold 20px serif';
  ctx.fillText('조정 백관 묘비명 및 사신왈 (史臣曰) 엄정 평결', 70, verdictSectionY);

  ctx.strokeStyle = '#5a4025';
  ctx.beginPath();
  ctx.moveTo(70, verdictSectionY + 12);
  ctx.lineTo(canvas.width - 70, verdictSectionY + 12);
  ctx.stroke();

  if (data.verdicts && data.verdicts.length > 0) {
    const maxVerdicts = data.userComment ? 3 : 5;
    const list = data.verdicts.slice(0, maxVerdicts);
    list.forEach((v, idx) => {
      const vy = verdictSectionY + 35 + idx * 115;
      ctx.fillStyle = '#1a130c';
      ctx.fillRect(70, vy, canvas.width - 140, 102);
      ctx.strokeStyle = '#3e2a16';
      ctx.strokeRect(70, vy, canvas.width - 140, 102);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#f5eedd';
      ctx.font = 'bold 16px serif';
      ctx.fillText(`${v.name} (${v.positionTitle} · ${v.rank})`, 90, vy + 28);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#79d2a6';
      ctx.font = '13px monospace';
      ctx.fillText(`직필 부합도: ${v.accuracyScore}%`, canvas.width - 90, vy + 28);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#dfc999';
      ctx.font = 'italic 13.5px serif';
      ctx.fillText(`"${v.verdictText}"`, 90, vy + 64);
    });

    // User's custom Sashinwal comment box
    if (data.userComment) {
      const ucy = verdictSectionY + 35 + list.length * 115 + 10;
      ctx.fillStyle = '#21170e';
      ctx.fillRect(70, ucy, canvas.width - 140, 115);
      ctx.strokeStyle = '#bfa15f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(70, ucy, canvas.width - 140, 115);

      // Scribe Seal (史官之印)
      const sealSize = 52;
      ctx.fillStyle = '#a62626';
      ctx.fillRect(90, ucy + 30, sealSize, sealSize);
      ctx.strokeStyle = '#e57373';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(90, ucy + 30, sealSize, sealSize);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('史官', 90 + sealSize / 2, ucy + 52);
      ctx.fillText('之印', 90 + sealSize / 2, ucy + 74);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#dfba6c';
      ctx.font = 'bold 16px serif';
      ctx.fillText('사신왈 (史臣曰) — 사관 친필 비망 (史官 親筆 備忘)', 158, ucy + 34);

      ctx.fillStyle = '#f5eedd';
      ctx.font = 'italic 15px serif';
      ctx.fillText(`"${data.userComment}"`, 158, ucy + 64);

      ctx.fillStyle = '#a89885';
      ctx.font = '12px serif';
      ctx.fillText('— 후세 역사의 거울이 될지어다. 춘추관 사관 수결 (手決)', 158, ucy + 92);
    }
  } else {
    // Chronicle representation when verdicts are not detailed
    const vy = verdictSectionY + 35;
    ctx.fillStyle = '#1a130c';
    ctx.fillRect(70, vy, canvas.width - 140, 360);
    ctx.strokeStyle = '#3e2a16';
    ctx.strokeRect(70, vy, canvas.width - 140, 360);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#dfba6c';
    ctx.font = 'bold 18px serif';
    ctx.fillText('사관의 붓은 멈추었으나 역사의 물줄기는 영원히 흐른다', canvas.width / 2, vy + 120);

    ctx.fillStyle = '#a89885';
    ctx.font = '15px serif';
    ctx.fillText('권신들의 모함과 왕의 서슬 퍼런 위협 속에서도', canvas.width / 2, vy + 165);
    ctx.fillText('춘추관 사관이 남긴 먹물은 결코 마르지 아니하였다.', canvas.width / 2, vy + 195);

    ctx.fillStyle = '#dfba6c';
    ctx.font = 'italic 16px serif';
    ctx.fillText('「 後世 歷史之鑑 永世不滅 」', canvas.width / 2, vy + 255);
  }

  // 8. Footer Certificate & Viral Link
  const footerY = canvas.height - 110;
  ctx.fillStyle = '#100a06';
  ctx.fillRect(70, footerY, canvas.width - 140, 56);
  ctx.strokeStyle = '#5a4025';
  ctx.strokeRect(70, footerY, canvas.width - 140, 56);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#dfba6c';
  ctx.font = 'bold 14px serif';
  ctx.fillText('春秋館 奉安 (춘추관 정본 봉안지인)', 90, footerY + 34);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#a89885';
  ctx.font = '13px monospace';
  ctx.fillText('https://tac0de.github.io/sacho-chronicles', canvas.width - 90, footerY + 34);

  // Trigger browser download
  const link = document.createElement('a');
  link.download = `조선왕조실록_${data.kingName}_사관총평_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
