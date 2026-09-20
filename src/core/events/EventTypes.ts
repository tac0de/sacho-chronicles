export type PoliticalEventType =
  | 'APPOINTMENT_RECOMMENDATION' // 1. 인사 추천
  | 'PROMOTION_RIVALRY'          // 2. 승진 경쟁
  | 'IMPEACHMENT'                 // 3. 탄핵 상소
  | 'ROYAL_REPRIMAND'            // 4. 왕의 질책
  | 'PUBLIC_DEBATE'              // 5. 대신 간 공개 논쟁
  | 'SECRET_MEETING'             // 6. 비밀 회동
  | 'BRIBERY_ALLEGATION'         // 7. 뇌물 의혹
  | 'RUMOR_INCEPTION'            // 8. 소문 발생
  | 'POLITICAL_ALLIANCE'         // 9. 정치적 지원
  | 'SLANDER';                   // 10. 특정 인물 모함

export interface EventMeta {
  type: PoliticalEventType;
  title: string;
  defaultLocation: 'ROYAL_HALL' | 'ROYAL_SECRETARIAT' | 'OFFICE_OF_INSPECTOR' | 'OFFICE_OF_CENSORS' | 'PALACE_CORRIDOR';
  description: string;
}

export const EVENT_METAS: Record<PoliticalEventType, EventMeta> = {
  APPOINTMENT_RECOMMENDATION: {
    type: 'APPOINTMENT_RECOMMENDATION',
    title: '인사 추천 (천거)',
    defaultLocation: 'ROYAL_HALL',
    description: '조정 대신이 주요 요직에 자신의 당여나 신임하는 인물을 천거함',
  },
  PROMOTION_RIVALRY: {
    type: 'PROMOTION_RIVALRY',
    title: '승진 경쟁 선언',
    defaultLocation: 'ROYAL_HALL',
    description: '고위 관직을 두고 두 관원이 노골적으로 세력을 다투며 대립각을 세움',
  },
  IMPEACHMENT: {
    type: 'IMPEACHMENT',
    title: '대간 탄핵 상소',
    defaultLocation: 'ROYAL_HALL',
    description: '사헌부 또는 사간원이 관원의 비리, 실책, 전횡을 들어 파직을 주청함',
  },
  ROYAL_REPRIMAND: {
    type: 'ROYAL_REPRIMAND',
    title: '국왕의 공개 질책',
    defaultLocation: 'ROYAL_HALL',
    description: '임금이 조정 대신의 실정이나 당파 싸움을 엄히 꾸짖어 위신을 깎음',
  },
  PUBLIC_DEBATE: {
    type: 'PUBLIC_DEBATE',
    title: '대신 간 공개 논쟁',
    defaultLocation: 'ROYAL_HALL',
    description: '편전 회의 중 두 대신이 정책이나 인사를 두고 정면으로 충돌함',
  },
  SECRET_MEETING: {
    type: 'SECRET_MEETING',
    title: '밀실 비밀 회동',
    defaultLocation: 'PALACE_CORRIDOR',
    description: '위기에 처하거나 야심을 품은 관리들이 은밀히 만나 결탁을 모의함',
  },
  BRIBERY_ALLEGATION: {
    type: 'BRIBERY_ALLEGATION',
    title: '뇌물 수수 의혹',
    defaultLocation: 'PALACE_CORRIDOR',
    description: '상인이나 청탁자가 관원의 사택이나 회랑에서 재물을 건넸다는 정황',
  },
  RUMOR_INCEPTION: {
    type: 'RUMOR_INCEPTION',
    title: '궁중 풍문 발생',
    defaultLocation: 'ROYAL_SECRETARIAT',
    description: '서리와 내관의 입을 통해 확인되지 않은 추문이 궐내에 퍼져나감',
  },
  POLITICAL_ALLIANCE: {
    type: 'POLITICAL_ALLIANCE',
    title: '정치적 연대 결성',
    defaultLocation: 'PALACE_CORRIDOR',
    description: '공통의 정적을 견제하기 위해 두 세력이 공식·비공식으로 손을 잡음',
  },
  SLANDER: {
    type: 'SLANDER',
    title: '고의적 모함 및 날조',
    defaultLocation: 'PALACE_CORRIDOR',
    description: '정적을 실각시키기 위해 악의적인 허위 사실을 꾸며내어 유포함',
  },
};
