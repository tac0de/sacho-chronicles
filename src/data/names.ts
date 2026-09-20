export const SURNAMES = [
  '이', '김', '박', '정', '조', '윤', '강', '최', '서', '한', '신', '권', '홍', '심', '송'
];

export const GIVEN_NAMES = [
  '응서', '형원', '태준', '광필', '무혁', '승현', '문수', '상익', '유진', '성호',
  '종현', '도진', '기원', '선호', '경환', '원익', '병학', '필재', '헌규', '준경'
];

/**
 * 12명의 관직별 초기 기본 인물 데이터 (고정적 원형 및 개성)
 */
export interface DefaultNpcProfile {
  name: string;
  age: number;
  ambition: number;        // 야심 (0~100)
  duty: number;            // 명분/원칙 중시 성향 (0~100)
  loyalty: number;         // 왕에 대한 충성심 (0~100)
  riskAversion: number;    // 위험 회피 성향 (0~100)
  honesty: number;         // 정직성 (0~100)
  basePersonality: string; // 성격 한줄 묘사
}

export const DEFAULT_PROFILES: Record<string, DefaultNpcProfile> = {
  KING: {
    name: '이선',
    age: 38,
    ambition: 70,
    duty: 65,
    loyalty: 100,
    riskAversion: 60,
    honesty: 75,
    basePersonality: '의심이 많으나 조정의 세력 균형을 잡으려는 군주',
  },
  CHIEF_STATE_COUNCILLOR: {
    name: '윤형원',
    age: 63,
    ambition: 50,
    duty: 70,
    loyalty: 85,
    riskAversion: 80,
    honesty: 70,
    basePersonality: '파란을 피하고 현상을 유지하려는 노회한 원로 재상',
  },
  LEFT_STATE_COUNCILLOR: {
    name: '김응서',
    age: 52,
    ambition: 90,
    duty: 40,
    loyalty: 60,
    riskAversion: 40,
    honesty: 35,
    basePersonality: '영의정 자리를 노리고 당여를 규합하는 저돌적 권력자',
  },
  RIGHT_STATE_COUNCILLOR: {
    name: '정태준',
    age: 58,
    ambition: 45,
    duty: 85,
    loyalty: 80,
    riskAversion: 65,
    honesty: 85,
    basePersonality: '원칙과 유교적 예법을 목숨처럼 여기는 도학자 풍의 재상',
  },
  MINISTER_OF_PERSONNEL: {
    name: '조광필',
    age: 49,
    ambition: 85,
    duty: 45,
    loyalty: 70,
    riskAversion: 50,
    honesty: 40,
    basePersonality: '인사권을 쥐고 제 사람을 심는 데 능한 수완가',
  },
  MINISTER_OF_WAR: {
    name: '강무혁',
    age: 51,
    ambition: 65,
    duty: 60,
    loyalty: 75,
    riskAversion: 45,
    honesty: 55,
    basePersonality: '무관 출신으로 직설적이나 재물 관리에 뒷소문이 따름',
  },
  INSPECTOR_GENERAL: {
    name: '이승현',
    age: 46,
    ambition: 70,
    duty: 90,
    loyalty: 80,
    riskAversion: 35,
    honesty: 85,
    basePersonality: '부패한 권신을 쳐내어 이름을 남기려는 서릿발 같은 감찰관',
  },
  CENSOR_GENERAL: {
    name: '박문수',
    age: 42,
    ambition: 65,
    duty: 95,
    loyalty: 75,
    riskAversion: 30,
    honesty: 90,
    basePersonality: '국왕 앞에서도 직언을 굽히지 않는 강직한 언관의 영수',
  },
  ACADEMY_DRAFTER: {
    name: '한상익',
    age: 34,
    ambition: 55,
    duty: 75,
    loyalty: 70,
    riskAversion: 60,
    honesty: 80,
    basePersonality: '조정 안팎의 소문과 정론을 분석하고 기록하는 소장 학자',
  },
  CHIEF_SECRETARY: {
    name: '서유진',
    age: 44,
    ambition: 60,
    duty: 65,
    loyalty: 90,
    riskAversion: 70,
    honesty: 65,
    basePersonality: '왕의 의중을 가장 빠르게 읽으며 줄타기에 능한 측근',
  },
  ROYAL_EUNUCH: {
    name: '김덕만',
    age: 50,
    ambition: 45,
    duty: 30,
    loyalty: 85,
    riskAversion: 85,
    honesty: 45,
    basePersonality: '대전의 은밀한 밀담을 누구보다 잘 엿듣는 눈치 빠른 환관',
  },
  COURT_CLERK: {
    name: '최달식',
    age: 31,
    ambition: 50,
    duty: 35,
    loyalty: 40,
    riskAversion: 60,
    honesty: 30,
    basePersonality: '돈과 연줄에 밝아 궐내 소문을 퍼뜨리고 전달하는 정보상',
  },
};
