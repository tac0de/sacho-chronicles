import type { LocationId } from '../../data/locations.js';

export type RecordCertainty = 'CAUTIOUS' | 'MODERATE' | 'ASSERTIVE';

export interface SachoRecord {
  id: string;
  day: number;
  subjectId: string;                 // 사초에서 다룬 핵심 인물
  subjectName: string;               // 인물 이름
  subjectTitle: string;              // 인물 관직
  statement: string;                 // 사관이 최종 기록한 사초 문장
  certainty: RecordCertainty;        // 신중한 표현 / 보통 표현 / 단정적 표현
  sourceInformationIds: string[];    // 근거가 된 정보 ID들
  witnessType: string;               // 목격 형태 요약
  locationId: LocationId;            // 기록된 사건 장소
  createdAtDay: number;
}
