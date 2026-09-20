export type PositionId =
  | 'KING'                     // 주상 전하 (국왕)
  | 'CHIEF_STATE_COUNCILLOR'   // 영의정
  | 'LEFT_STATE_COUNCILLOR'    // 좌의정
  | 'RIGHT_STATE_COUNCILLOR'   // 우의정
  | 'MINISTER_OF_PERSONNEL'    // 이조판서
  | 'MINISTER_OF_WAR'          // 병조판서
  | 'INSPECTOR_GENERAL'        // 사헌부 대사헌
  | 'CENSOR_GENERAL'           // 사간원 대사간
  | 'ACADEMY_DRAFTER'          // 홍문관 수찬
  | 'CHIEF_SECRETARY'          // 승정원 도승지
  | 'ROYAL_EUNUCH'             // 대전 상선 (내관)
  | 'COURT_CLERK';             // 승정원 서리

export interface PositionDef {
  id: PositionId;
  title: string;          // 관직명 (예: '영의정', '이조판서')
  rank: string;           // 품계 (예: '정1품', '정2품')
  department: string;     // 소속 기관 (예: '의정부', '이조', '사헌부')
  basePower: number;      // 기본 정치적 영향력
  description: string;    // 관직 설명
  isRoyalty?: boolean;    // 군주 여부
}

export const POSITIONS: Record<PositionId, PositionDef> = {
  KING: {
    id: 'KING',
    title: '주상 (전하)',
    rank: '군주',
    department: '조정 (어좌)',
    basePower: 100,
    description: '조선의 국왕. 신하들의 충성과 반목을 저울질하며 왕권을 지키려 한다.',
    isRoyalty: true,
  },
  CHIEF_STATE_COUNCILLOR: {
    id: 'CHIEF_STATE_COUNCILLOR',
    title: '영의정',
    rank: '정1품',
    department: '의정부',
    basePower: 90,
    description: '일인지하 만인지상의 재상. 조정의 안정과 균형을 수호하려 한다.',
  },
  LEFT_STATE_COUNCILLOR: {
    id: 'LEFT_STATE_COUNCILLOR',
    title: '좌의정',
    rank: '정1품',
    department: '의정부',
    basePower: 85,
    description: '의정부의 2인자. 차기 영의정을 노리며 당여를 규합하는 야심가.',
  },
  RIGHT_STATE_COUNCILLOR: {
    id: 'RIGHT_STATE_COUNCILLOR',
    title: '우의정',
    rank: '정1품',
    department: '의정부',
    basePower: 80,
    description: '의정부 3상 중 한 사람. 유교적 예법과 원칙을 앞세워 대신들을 견제한다.',
  },
  MINISTER_OF_PERSONNEL: {
    id: 'MINISTER_OF_PERSONNEL',
    title: '이조판서',
    rank: '정2품',
    department: '이조',
    basePower: 75,
    description: '문관의 인사권을 총괄하는 실세. 누구를 등용하고 내칠지 결정하는 자리.',
  },
  MINISTER_OF_WAR: {
    id: 'MINISTER_OF_WAR',
    title: '병조판서',
    rank: '정2품',
    department: '병조',
    basePower: 75,
    description: '군사권과 무관 인사를 총괄하는 무관의 수장. 군부의 지지를 등에 업고 있다.',
  },
  INSPECTOR_GENERAL: {
    id: 'INSPECTOR_GENERAL',
    title: '사헌부 대사헌',
    rank: '종2품',
    department: '사헌부',
    basePower: 70,
    description: '백관의 비리와 규율을 감찰하는 풍헌의 수장. 성역 없는 탄핵을 휘두른다.',
  },
  CENSOR_GENERAL: {
    id: 'CENSOR_GENERAL',
    title: '사간원 대사간',
    rank: '정3품 당상',
    department: '사간원',
    basePower: 68,
    description: '국왕의 잘못을 간쟁하고 권신의 전횡을 규탄하는 언론의 총수.',
  },
  ACADEMY_DRAFTER: {
    id: 'ACADEMY_DRAFTER',
    title: '홍문관 수찬',
    rank: '정5품',
    department: '홍문관',
    basePower: 50,
    description: '경연과 서적을 관장하는 문한관. 여론을 모으고 명분을 이론적으로 뒷받침한다.',
  },
  CHIEF_SECRETARY: {
    id: 'CHIEF_SECRETARY',
    title: '승정원 도승지',
    rank: '정3품 당상',
    department: '승정원',
    basePower: 65,
    description: '왕의 은대(銀臺) 수장. 국왕의 모든 명령과 상소가 거쳐가는 정보의 관문.',
  },
  ROYAL_EUNUCH: {
    id: 'ROYAL_EUNUCH',
    title: '대전 상선 (내관)',
    rank: '종2품',
    department: '내시부',
    basePower: 45,
    description: '왕의 침전을 밀착 보필하는 환관의 수장. 대전의 은밀한 분위기를 꿰뚫고 있다.',
  },
  COURT_CLERK: {
    id: 'COURT_CLERK',
    title: '승정원 서리',
    rank: '이속 (서리)',
    department: '승정원',
    basePower: 30,
    description: '궁중 공문서를 필사하고 잡무를 보는 하급 실무자. 온갖 뜬소문의 발원지.',
  },
};
