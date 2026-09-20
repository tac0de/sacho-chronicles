export type WorldFactType =
  | 'BRIBE_ACCEPTED'          // 실제로 뇌물을 수수함
  | 'BRIBE_REJECTED'          // 뇌물 청탁을 단호히 거절함
  | 'NO_BRIBE_EVENT'          // 뇌물 시도 자체가 없었음 (순수 조작)
  | 'SECRET_CONSPIRACY'       // 실제로 은밀한 당여 결탁 모의가 있었음
  | 'INNOCENT_MEETING'        // 단순 친목 또는 공무 협의였음
  | 'UNQUALIFIED_PROMOTION'   // 자격 미달 친인척을 부당 추천함
  | 'MERIT_PROMOTION'         // 공정하고 합당한 인재 천거였음
  | 'SLANDER_FABRICATED'      // 고의로 날조된 허위 무고
  | 'ROYAL_DISPLEASURE_REAL'; // 실제로 왕이 진노함

export interface WorldFact {
  id: string;
  day: number;
  type: WorldFactType;
  subjectId: string;          // 혐의 또는 행동의 주체 관원 ID
  targetId?: string;          // 피해자 또는 상대방 ID
  locationId: string;         // 발생 장소
  isActuallyGuilty: boolean;  // 객관적 유책/비리 여부 (true=비리 저지름, false=결백/무고)
  description: string;        // 객관적 진실 한 줄 요약
  underlyingContext: string;  // 배후 사유 및 맥락
}

export class WorldFactRegistry {
  private facts: Map<string, WorldFact> = new Map();

  public register(fact: WorldFact): void {
    this.facts.set(fact.id, fact);
  }

  public get(id: string): WorldFact | undefined {
    return this.facts.get(id);
  }

  public getAll(): WorldFact[] {
    return Array.from(this.facts.values());
  }

  public getByDay(day: number): WorldFact[] {
    return Array.from(this.facts.values()).filter((f) => f.day === day);
  }
}
