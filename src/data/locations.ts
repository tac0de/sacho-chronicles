import type { PositionId } from './positions.js';

export type LocationId =
  | 'ROYAL_HALL'           // 사정전 (思政殿 · 편전)
  | 'ROYAL_SECRETARIAT'   // 은대 (銀臺 · 승정원)
  | 'OFFICE_OF_INSPECTOR'  // 백부 (柏府 · 사헌부)
  | 'OFFICE_OF_CENSORS'    // 미원 (薇垣 · 사간원)
  | 'PALACE_CORRIDOR';     // 궐내 천랑 (闕內 千廊 · 회랑)

export interface LocationDef {
  id: LocationId;
  name: string;
  hanja: string;
  alias: string;
  atmosphere: string;
  description: string;
  primaryVisitors: PositionId[];
}

export const LOCATIONS: Record<LocationId, LocationDef> = {
  ROYAL_HALL: {
    id: 'ROYAL_HALL',
    name: '사정전 (편전)',
    hanja: '思政殿',
    alias: '상참 편전',
    atmosphere: '어좌 앞 촛불 아래 삼공육경의 서슬 퍼런 조참과 상참',
    description: '국왕이 신하들과 경연(經筵)을 열고 정사를 논하는 편전. 공개적인 탄핵 상소와 격렬한 대신들의 설전, 국왕의 질책이 공식적으로 하달되는 장소.',
    primaryVisitors: ['KING', 'CHIEF_STATE_COUNCILLOR', 'LEFT_STATE_COUNCILLOR', 'RIGHT_STATE_COUNCILLOR', 'MINISTER_OF_PERSONNEL', 'MINISTER_OF_WAR', 'CHIEF_SECRETARY'],
  },
  ROYAL_SECRETARIAT: {
    id: 'ROYAL_SECRETARIAT',
    name: '은대 (승정원)',
    hanja: '銀臺 承政院',
    alias: '후설(喉舌)의 관',
    atmosphere: '도승지의 급박한 전령과 쉴 새 없이 오가는 상소문 궤짝',
    description: '왕의 비서 관청. 어명과 사방에서 올라온 상소가 거쳐가는 대궐의 목구멍(喉舌)으로, 궐내의 가장 내밀한 소식과 문서가 가장 먼저 집약되는 곳.',
    primaryVisitors: ['CHIEF_SECRETARY', 'ROYAL_EUNUCH', 'COURT_CLERK', 'ACADEMY_DRAFTER'],
  },
  OFFICE_OF_INSPECTOR: {
    id: 'OFFICE_OF_INSPECTOR',
    name: '백부 (사헌부)',
    hanja: '柏府 司憲府',
    alias: '풍헌(風憲) 감찰청',
    atmosphere: '잣나무 숲처럼 차가운 침묵과 백관의 혐의를 적은 첩보 장부',
    description: '풍속을 바로잡고 백관의 비리를 규찰하는 사헌부. 대사헌과 감찰들이 관리들의 뇌물, 부당한 천거, 월권 행위를 엄밀히 내사하고 탄핵을 기안하는 곳.',
    primaryVisitors: ['INSPECTOR_GENERAL', 'COURT_CLERK', 'CENSOR_GENERAL'],
  },
  OFFICE_OF_CENSORS: {
    id: 'OFFICE_OF_CENSORS',
    name: '미원 (사간원)',
    hanja: '薇垣 司諫院',
    alias: '언관(諫官) 간쟁청',
    atmosphere: '피를 토하듯 결연한 간관들의 연명 차자(箚子) 작성과 붓소리',
    description: '임금의 그릇된 정사를 바로잡고 권신의 전횡을 공박하는 사간원. 대사간과 정언들이 촛불을 밝히고 죽음을 무릅쓴 간쟁과 탄핵을 모의하는 언론의 총부.',
    primaryVisitors: ['CENSOR_GENERAL', 'ACADEMY_DRAFTER', 'INSPECTOR_GENERAL'],
  },
  PALACE_CORRIDOR: {
    id: 'PALACE_CORRIDOR',
    name: '궐내 천랑 (회랑)',
    hanja: '闕內 千廊',
    alias: '처마 밑 밀담 회랑',
    atmosphere: '회랑 기둥 뒤 드리운 긴 그림자와 낮게 귓속말하는 모의의 숨결',
    description: '전각과 전각 사이를 미로처럼 연결하는 깊은 행랑. 관원들이 은밀한 야간 비밀 회동을 갖거나, 서리와 내관이 뒷돈과 뜬소문을 주고받는 은밀한 공간.',
    primaryVisitors: ['LEFT_STATE_COUNCILLOR', 'MINISTER_OF_PERSONNEL', 'MINISTER_OF_WAR', 'ROYAL_EUNUCH', 'COURT_CLERK'],
  },
};
