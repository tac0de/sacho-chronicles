/**
 * NPC 간 비대칭 관계 시스템
 * A가 B를 바라보는 태도와 B가 A를 바라보는 태도는 독립적입니다. (-100 ~ +100)
 */
export interface RelationshipRecord {
  fromId: string;
  toId: string;
  value: number;            // -100 (극단적 원수) ~ +100 (혈맹/심복)
  lastChangedDay?: number;
  lastReason?: string;
}

export type RelationshipSentiment =
  | 'DEADLY_ENEMY'    // 철천지원수 (-100 ~ -60)
  | 'HOSTILE'         // 적대/경계 (-59 ~ -20)
  | 'NEUTRAL'         // 중립/공식 관계 (-19 ~ +19)
  | 'FRIENDLY'        // 우호/동맹 (+20 ~ +59)
  | 'SWORN_ALLY';     // 맹우/심복 (+60 ~ +100)

export class RelationshipManager {
  // key format: `${fromId}->${toId}`
  private relations: Map<string, RelationshipRecord> = new Map();

  private makeKey(fromId: string, toId: string): string {
    return `${fromId}->${toId}`;
  }

  public setRelation(fromId: string, toId: string, value: number, reason: string = '초기 관계', day: number = 1): void {
    const clamped = Math.max(-100, Math.min(100, value));
    const key = this.makeKey(fromId, toId);
    this.relations.set(key, {
      fromId,
      toId,
      value: clamped,
      lastChangedDay: day,
      lastReason: reason,
    });
  }

  public getRelation(fromId: string, toId: string): number {
    if (fromId === toId) return 100;
    const key = this.makeKey(fromId, toId);
    const rec = this.relations.get(key);
    return rec ? rec.value : 0;
  }

  public modifyRelation(fromId: string, toId: string, delta: number, reason: string, day: number): number {
    if (fromId === toId) return 100;
    const current = this.getRelation(fromId, toId);
    const newVal = Math.max(-100, Math.min(100, current + delta));
    const key = this.makeKey(fromId, toId);
    this.relations.set(key, {
      fromId,
      toId,
      value: newVal,
      lastChangedDay: day,
      lastReason: reason,
    });
    return newVal;
  }

  public getSentiment(value: number): RelationshipSentiment {
    if (value <= -60) return 'DEADLY_ENEMY';
    if (value <= -20) return 'HOSTILE';
    if (value < 20) return 'NEUTRAL';
    if (value < 60) return 'FRIENDLY';
    return 'SWORN_ALLY';
  }

  public getSentimentText(value: number): string {
    if (value <= -60) return '철천지원수';
    if (value <= -20) return '적대/경계';
    if (value < 20) return '중립/공식';
    if (value < 60) return '우호/동맹';
    return '심복/맹우';
  }

  /**
   * 디버그 패널용: 특정 인물의 모든 대인 관계 목록 반환
   */
  public getOutgoingRelations(fromId: string): { targetId: string; value: number; sentiment: string }[] {
    const result: { targetId: string; value: number; sentiment: string }[] = [];
    for (const [key, rec] of this.relations.entries()) {
      if (key.startsWith(`${fromId}->`)) {
        result.push({
          targetId: rec.toId,
          value: rec.value,
          sentiment: this.getSentimentText(rec.value),
        });
      }
    }
    return result;
  }

  /**
   * 전체 관계 매트릭스 덤프 (12x12)
   */
  public dumpMatrix(agentIds: string[]): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};
    for (const a of agentIds) {
      matrix[a] = {};
      for (const b of agentIds) {
        matrix[a][b] = this.getRelation(a, b);
      }
    }
    return matrix;
  }
}
