import type { PoliticalEventType } from './EventTypes.js';
import type { LocationId } from '../../data/locations.js';

export interface RelationChangeRecord {
  fromId: string;
  toId: string;
  delta: number;
  reason: string;
}

export interface PoliticalEvent {
  id: string;
  day: number;
  type: PoliticalEventType;
  locationId: LocationId;
  instigatorId: string;       // 사건의 주도자/행위자
  targetId?: string;          // 사건의 대상자
  thirdPartyId?: string;      // 제3자/참여자/증인
  title: string;
  summary: string;
  causationReason: string;    // 시뮬레이션 인과 추적: 이 사건이 왜 발생했는가?
  relatedMemoryEventId?: string; // 과거 어떤 사건의 기억에 기인했는가?
  worldFactId?: string;       // 실제 세계 진실 ID
  generatedInfoIds: string[]; // 이 사건으로 파생된 정보 ID 목록
  relationChanges: RelationChangeRecord[];
}
