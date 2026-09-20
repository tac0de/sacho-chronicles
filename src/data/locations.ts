import type { PositionId } from './positions.js';

export type LocationId =
  | 'ROYAL_HALL'           // 편전 (便殿)
  | 'ROYAL_SECRETARIAT'   // 승정원 (承政院)
  | 'OFFICE_OF_INSPECTOR'  // 사헌부 (司憲府)
  | 'OFFICE_OF_CENSORS'    // 사간원 (司諫院)
  | 'PALACE_CORRIDOR';     // 궐내 회랑 (闕內 回廊)

export interface LocationDef {
  id: LocationId;
  name: string;
  hanja: string;
  atmosphere: string;
  description: string;
  primaryVisitors: PositionId[];
}

export const LOCATIONS: Record<LocationId, LocationDef> = {
  ROYAL_HALL: {
    id: 'ROYAL_HALL',
    name: '편전',
    hanja: '便殿',
    atmosphere: '조정 대신들의 엄숙한 입조와 어좌 앞 팽팽한 설전',
    description: '국왕이 신하들과 조참을 열고 국정을 논하는 대청. 공개 논쟁, 어명, 탄핵 상소가 공식적으로 울려 퍼지는 장소.',
    primaryVisitors: ['KING', 'CHIEF_STATE_COUNCILLOR', 'LEFT_STATE_COUNCILLOR', 'RIGHT_STATE_COUNCILLOR', 'MINISTER_OF_PERSONNEL', 'MINISTER_OF_WAR', 'CHIEF_SECRETARY'],
  },
  ROYAL_SECRETARIAT: {
    id: 'ROYAL_SECRETARIAT',
    name: '승정원',
    hanja: '承政院',
    atmosphere: '분주한 붓 놀림과 급박하게 오가는 상소문 궤짝들',
    description: '왕의 비서실. 왕에게 올라가는 모든 상소와 어명이 출납되며, 도승지와 내관, 서리들이 궐내 주요 소식을 가장 먼저 접하는 곳.',
    primaryVisitors: ['CHIEF_SECRETARY', 'ROYAL_EUNUCH', 'COURT_CLERK', 'ACADEMY_DRAFTER'],
  },
  OFFICE_OF_INSPECTOR: {
    id: 'OFFICE_OF_INSPECTOR',
    name: '사헌부',
    hanja: '司憲府',
    atmosphere: '차갑게 내려앉은 긴장감과 관원들의 비리 혐의 수첩',
    description: '백관의 풍기와 비리를 감찰하는 풍헌의 관청. 대사헌과 지평들이 관리들의 뒷조사, 뇌물 첩보를 입수하고 탄핵안을 검토하는 곳.',
    primaryVisitors: ['INSPECTOR_GENERAL', 'COURT_CLERK', 'CENSOR_GENERAL'],
  },
  OFFICE_OF_CENSORS: {
    id: 'OFFICE_OF_CENSORS',
    name: '사간원',
    hanja: '司諫院',
    atmosphere: '피를 토하듯 격앙된 간관들의 상소 토론과 촛불',
    description: '임금의 과오를 간하고 권신의 전횡을 공박하는 언론 관청. 대사간과 정언들이 모여 인사 비리와 권력 남용에 대한 연명 상소를 작성하는 곳.',
    primaryVisitors: ['CENSOR_GENERAL', 'ACADEMY_DRAFTER', 'INSPECTOR_GENERAL'],
  },
  PALACE_CORRIDOR: {
    id: 'PALACE_CORRIDOR',
    name: '궐내 회랑',
    hanja: '闕內 回廊',
    atmosphere: '기둥 뒤에 어리는 그림자와 낮게 속삭이는 음모의 기운',
    description: '궁궐 전각 사이를 잇는 미로 같은 긴 회랑. 관리들이 은밀한 비밀 회동을 갖거나, 서리와 내관이 뒷돈과 뜬소문을 주고받는 장소.',
    primaryVisitors: ['LEFT_STATE_COUNCILLOR', 'MINISTER_OF_PERSONNEL', 'MINISTER_OF_WAR', 'ROYAL_EUNUCH', 'COURT_CLERK'],
  },
};
