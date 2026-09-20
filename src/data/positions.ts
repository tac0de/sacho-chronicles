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
  hanjaTitle: string;     // 한자 관직명
  rank: string;           // 품계 (예: '정1품', '정2품')
  officialRankName: string; // 품계 정식 명칭 (예: '대광보국숭록대부')
  department: string;     // 소속 기관 (예: '의정부', '이조', '사헌부')
  departmentHanja: string; // 관청 한자
  insignia: string;       // 복색 및 흉배 (예: '홍포 쌍학흉배')
  basePower: number;      // 기본 정치적 영향력
  description: string;    // 관직 고증 설명
  isRoyalty?: boolean;    // 군주 여부
}

export const POSITIONS: Record<PositionId, PositionDef> = {
  KING: {
    id: 'KING',
    title: '주상 (전하)',
    hanjaTitle: '主上 殿下',
    rank: '만기 (군주)',
    officialRankName: '국왕 (國王)',
    department: '대전 (어좌)',
    departmentHanja: '大殿',
    insignia: '곤룡포 오조룡보 (赤色 袞龍袍)',
    basePower: 100,
    description: '조선의 국왕. 삼공육경과 백관의 상소를 재가하며 왕통과 사직을 보전하려 한다.',
    isRoyalty: true,
  },
  CHIEF_STATE_COUNCILLOR: {
    id: 'CHIEF_STATE_COUNCILLOR',
    title: '영의정',
    hanjaTitle: '領議政',
    rank: '정1품',
    officialRankName: '대광보국숭록대부 (大匡輔國崇祿大夫)',
    department: '의정부',
    departmentHanja: '議政府',
    insignia: '홍포 쌍학흉배 (紅袍 雙鶴)',
    basePower: 90,
    description: '일인지하 만인지상의 영수. 백관을 통솔하고 조정의 화평과 사직의 안정을 도모한다.',
  },
  LEFT_STATE_COUNCILLOR: {
    id: 'LEFT_STATE_COUNCILLOR',
    title: '좌의정',
    hanjaTitle: '左議政',
    rank: '정1품',
    officialRankName: '보국숭록대부 (輔國崇祿大夫)',
    department: '의정부',
    departmentHanja: '議政府',
    insignia: '홍포 쌍학흉배 (紅袍 雙鶴)',
    basePower: 85,
    description: '의정부 2인자 재상. 차기 영수를 노리며 당여를 결속하고 정국을 주도하려는 실세.',
  },
  RIGHT_STATE_COUNCILLOR: {
    id: 'RIGHT_STATE_COUNCILLOR',
    title: '우의정',
    hanjaTitle: '右議政',
    rank: '정1품',
    officialRankName: '보국숭록대부 (輔國崇祿大夫)',
    department: '의정부',
    departmentHanja: '議政府',
    insignia: '홍포 쌍학흉배 (紅袍 雙鶴)',
    basePower: 80,
    description: '의정부 3상 중 한 사람. 도학적 명분과 유교 예법을 무기로 권신의 전횡을 견제한다.',
  },
  MINISTER_OF_PERSONNEL: {
    id: 'MINISTER_OF_PERSONNEL',
    title: '이조판서',
    hanjaTitle: '吏曹判書',
    rank: '정2품',
    officialRankName: '자헌대부 (資憲大夫)',
    department: '이조',
    departmentHanja: '吏曹',
    insignia: '홍포 쌍학흉배 (紅袍 雙鶴)',
    basePower: 75,
    description: '문관의 인사권을 장악한 문선(文選)의 수장. 요직의 천거와 삭탈을 쥐고 있는 핵심 권신.',
  },
  MINISTER_OF_WAR: {
    id: 'MINISTER_OF_WAR',
    title: '병조판서',
    hanjaTitle: '兵曹判書',
    rank: '정2품',
    officialRankName: '자헌대부 (資憲大夫)',
    department: '병조',
    departmentHanja: '兵曹',
    insignia: '홍포 호표흉배 (紅袍 虎豹)',
    basePower: 75,
    description: '군사권과 무관 인사를 총괄하는 무선(武選)의 수장. 군부의 물리력을 배경으로 삼는다.',
  },
  INSPECTOR_GENERAL: {
    id: 'INSPECTOR_GENERAL',
    title: '사헌부 대사헌',
    hanjaTitle: '司憲府 大司憲',
    rank: '종2품',
    officialRankName: '가선대부 (嘉善大夫)',
    department: '사헌부 (백부)',
    departmentHanja: '司憲府 (柏府)',
    insignia: '홍포 해치흉배 (紅袍 獬豸)',
    basePower: 70,
    description: '백관의 비리와 규율을 감찰하는 풍헌의 총수. 시비와 사욕을 엄단하는 서릿발 같은 감찰관.',
  },
  CENSOR_GENERAL: {
    id: 'CENSOR_GENERAL',
    title: '사간원 대사간',
    hanjaTitle: '司諫院 大司諫',
    rank: '정3품 당상',
    officialRankName: '통정대부 (通政大夫)',
    department: '사간원 (미원)',
    departmentHanja: '司諫院 (薇垣)',
    insignia: '홍포 단학흉배 (紅袍 單鶴)',
    basePower: 68,
    description: '임금의 과오를 간하고 대신의 전횡을 탄핵하는 언관(諫官)의 영수. 성역 없는 간쟁을 편다.',
  },
  ACADEMY_DRAFTER: {
    id: 'ACADEMY_DRAFTER',
    title: '홍문관 수찬',
    hanjaTitle: '弘文館 修撰',
    rank: '정5품 당하',
    officialRankName: '통덕랑 (通德郞)',
    department: '홍문관 (옥당)',
    departmentHanja: '弘文館 (玉堂)',
    insignia: '청포 단학흉배 (靑袍 單鶴)',
    basePower: 50,
    description: '경연과 장서를 관장하는 옥당의 문한관. 시국의 정론을 형성하고 공론을 이론화한다.',
  },
  CHIEF_SECRETARY: {
    id: 'CHIEF_SECRETARY',
    title: '승정원 도승지',
    hanjaTitle: '承政院 都承旨',
    rank: '정3품 당상',
    officialRankName: '통정대부 지제교 (通政大夫 知製敎)',
    department: '승정원 (은대)',
    departmentHanja: '承政院 (銀臺)',
    insignia: '홍포 단학흉배 (紅袍 單鶴)',
    basePower: 65,
    description: '왕의 은대 수장. 국왕의 모든 명령과 상소가 오가는 대궐의 목구멍이자 귀.',
  },
  ROYAL_EUNUCH: {
    id: 'ROYAL_EUNUCH',
    title: '대전 상선 (내관)',
    hanjaTitle: '大殿 尙膳',
    rank: '종2품',
    officialRankName: '상선 (尙膳)',
    department: '내시부',
    departmentHanja: '內侍府',
    insignia: '녹포 백한흉배 (綠袍 白鷳)',
    basePower: 45,
    description: '침전을 밀착 보필하는 환관의 수장. 대전의 은밀한 어명과 기류를 누구보다 빨리 꿰뚫는다.',
  },
  COURT_CLERK: {
    id: 'COURT_CLERK',
    title: '승정원 서리',
    hanjaTitle: '承政院 書吏',
    rank: '이속 (吏屬)',
    officialRankName: '서리 (書吏)',
    department: '승정원',
    departmentHanja: '承政院',
    insignia: '흑포 무흉배 (黑袍 無胸背)',
    basePower: 30,
    description: '공문서를 필사하고 잡무를 도맡는 하급 실무자. 온갖 문서와 궐내 뜬소문이 거쳐가는 통로.',
  },
};
