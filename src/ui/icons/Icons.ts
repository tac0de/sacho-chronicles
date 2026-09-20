export type IconName =
  | 'palace'
  | 'scroll'
  | 'brush'
  | 'users'
  | 'book'
  | 'console'
  | 'music'
  | 'music-off'
  | 'volume'
  | 'volume-x'
  | 'scale'
  | 'flame'
  | 'coins'
  | 'crown'
  | 'sprout'
  | 'candle'
  | 'moon'
  | 'sunrise'
  | 'sword'
  | 'zap'
  | 'search'
  | 'key'
  | 'copy'
  | 'image'
  | 'refresh'
  | 'check'
  | 'arrow-right'
  | 'close'
  | 'shield';

export interface IconOptions {
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

const ICON_SVGS: Record<IconName, string> = {
  // 전각 / 처소 (조선 궁궐 팔작지붕과 기둥)
  palace: `
    <path d="M2 9l10-6 10 6v1H2V9z" />
    <path d="M4 10v10h16V10" />
    <path d="M9 20V13h6v7" />
    <path d="M7 10v10" />
    <path d="M17 10v10" />
    <path d="M1 20h22" />
  `,

  // 사초 / 교지 / 두루마리 (전통 서책 스크롤)
  scroll: `
    <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1z" />
    <path d="M4 3a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h6" />
    <path d="M8 7h7" />
    <path d="M8 11h5" />
  `,

  // 모필 / 붓 (사관의 붓끝)
  brush: `
    <path d="M18 2l4 4-10 10H8v-4L18 2z" />
    <path d="M14 6l4 4" />
    <path d="M8 16c-2 0-4 1-5 4 2 0 4-1 5-4z" />
  `,

  // 조정 백관 (문무 백관 형상)
  users: `
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  `,

  // 실록 서책 (전통 5침 안정법 서책)
  book: `
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="14" y2="10" />
    <circle cx="7" cy="4" r="0.5" fill="currentColor" />
    <circle cx="7" cy="8" r="0.5" fill="currentColor" />
    <circle cx="7" cy="12" r="0.5" fill="currentColor" />
    <circle cx="7" cy="16" r="0.5" fill="currentColor" />
  `,

  // 감찰록 / 디버그 콘솔 (사헌부 감찰패 및 슬라이더)
  console: `
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <path d="M7 8l3 3-3 3" />
    <line x1="12" y1="14" x2="16" y2="14" />
  `,

  // 궁중 정악 풍류음 (가야금/피리 선율)
  music: `
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  `,

  // 풍류 음소거
  'music-off': `
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v9" />
    <path d="M9 5l12-2v5" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 16.5a3 3 0 0 0-3-3" />
  `,

  // 효과음
  volume: `
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  `,

  // 효과음 무음
  'volume-x': `
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  `,

  // 직필 신념 (천하의 형평 저울)
  scale: `
    <path d="M12 3v18" />
    <path d="M5 6h14" />
    <path d="M2 12l3-6 3 6a3 3 0 0 1-6 0z" />
    <path d="M16 12l3-6 3 6a3 3 0 0 1-6 0z" />
    <path d="M9 21h6" />
  `,

  // 사화 위기 (타오르는 불길)
  flame: `
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
  `,

  // 가문 재력 (상평통보 엽전)
  coins: `
    <circle cx="12" cy="12" r="9" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
  `,

  // 국왕 (조선 익선관 / 군주 보관)
  crown: `
    <path d="M2 18l3-13 4 5 3-7 3 7 4-5 3 13H2z" />
    <path d="M2 18h20v3H2v-3z" />
    <circle cx="12" cy="5" r="1" />
  `,

  // 개벽 시드 (싹트는 새싹)
  sprout: `
    <path d="M7 20h10" />
    <path d="M12 20v-8" />
    <path d="M12 12a5 5 0 0 0 5-5c0-2-1-3-3-3-3 0-5 3-5 5" />
    <path d="M12 12a5 5 0 0 1-5-5c0-2 1-3 3-3 3 0 5 3 5 5" />
  `,

  // 촛불 (심야 침소)
  candle: `
    <path d="M8 10h8v12H8V10z" />
    <path d="M12 2c-1.5 1.5-2 3-2 4 0 1.1.9 2 2 2s2-.9 2-2c0-1-.5-2.5-2-4z" />
    <path d="M6 22h12" />
  `,

  // 달 (심야 삼경)
  moon: `
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  `,

  // 여명 / 일출 (동트는 새벽)
  sunrise: `
    <path d="M12 2v6" />
    <path d="M4.93 10.93l4.24-4.24" />
    <path d="M19.07 10.93l-4.24-4.24" />
    <path d="M2 18h20" />
    <path d="M6 18a6 6 0 0 1 12 0" />
  `,

  // 환도 / 비수 (멸문 협박)
  sword: `
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" />
    <line x1="19" y1="21" x2="21" y2="19" />
  `,

  // 나비효과 / 벼락 (정치적 파문)
  zap: `
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  `,

  // 탐문 / 첩보 (돋보기)
  search: `
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  `,

  // 비전사고 열쇠
  key: `
    <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l1 1-6.5 6.5a4.95 4.95 0 1 1-1.41-1.41L10.5 8.5 9 7.5 10.5 6l1.5 1.5 3.5-3.5" />
    <circle cx="5.5" cy="18.5" r="1.5" />
  `,

  // 복사
  copy: `
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  `,

  // 이미지 / 족자
  image: `
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  `,

  // 갱신 / 새 치세
  refresh: `
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  `,

  // 확인
  check: `
    <polyline points="20 6 9 17 4 12" />
  `,

  // 닫기
  close: `
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  `,

  // 화살표
  'arrow-right': `
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  `,

  // 사헌부 방패
  shield: `
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  `,
};

export function renderIcon(name: IconName, options?: IconOptions): string {
  const content = ICON_SVGS[name] || ICON_SVGS.scroll;
  const size = options?.size ?? '1em';
  const sizeAttr = typeof size === 'number' ? `${size}px` : size;
  const className = options?.className ? `ui-icon ui-icon-${name} ${options.className}` : `ui-icon ui-icon-${name}`;
  const strokeWidth = options?.strokeWidth ?? 1.8;
  const colorStyle = options?.color ? `style="color: ${options.color};"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" width="${sizeAttr}" height="${sizeAttr}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ${colorStyle} aria-hidden="true">${content.trim()}</svg>`;
}
