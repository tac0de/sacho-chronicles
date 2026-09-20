import type { PositionId } from '../../data/positions.js';
import type { AgentGoal } from './Goal.js';

export interface AgentMemory {
  id: string;
  day: number;
  eventId: string;
  eventType: string;
  actorId: string;
  targetId?: string;
  description: string;
  emotionalImpact: number; // 음수면 분노/원한, 양수면 호감/신뢰
}

export class Agent {
  public readonly id: string;
  public name: string;
  public positionId: PositionId;
  public positionTitle: string;
  public rank: string;
  public department: string;
  public age: number;

  // 주요 내부 성향치 (0 ~ 100)
  public politicalPower: number; // 정치적 영향력
  public ambition: number;       // 야심
  public duty: number;           // 명분/원칙 중시
  public loyalty: number;        // 국왕 충성도
  public riskAversion: number;   // 위험 회피 성향
  public honesty: number;        // 정직성 (낮을수록 모함/왜곡/날조)

  // 심리 상태 및 목표
  public goal: AgentGoal;
  public grudges: Map<string, number> = new Map(); // targetAgentId -> 원한 수치 (0 ~ 100)
  public currentStatus: string = '평온';           // 현재 상태 요약 (예: '승진 경쟁 중', '탄핵 위기', '자중')

  // 정보 및 기억 시스템
  public knownInfoIds: Set<string> = new Set();    // 접해본 정보 ID
  public believedInfoIds: Set<string> = new Set(); // 사실이라고 신뢰/믿는 정보 ID
  public memories: AgentMemory[] = [];             // 개인적 기억 목록

  constructor(params: {
    id: string;
    name: string;
    positionId: PositionId;
    positionTitle: string;
    rank: string;
    department: string;
    age: number;
    politicalPower: number;
    ambition: number;
    duty: number;
    loyalty: number;
    riskAversion: number;
    honesty: number;
    goal: AgentGoal;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.positionId = params.positionId;
    this.positionTitle = params.positionTitle;
    this.rank = params.rank;
    this.department = params.department;
    this.age = params.age;
    this.politicalPower = params.politicalPower;
    this.ambition = params.ambition;
    this.duty = params.duty;
    this.loyalty = params.loyalty;
    this.riskAversion = params.riskAversion;
    this.honesty = params.honesty;
    this.goal = params.goal;
  }

  /**
   * 개인적 원한 조회 및 가산
   */
  public getGrudge(targetId: string): number {
    return this.grudges.get(targetId) || 0;
  }

  public addGrudge(targetId: string, amount: number): void {
    if (this.id === targetId) return;
    const current = this.getGrudge(targetId);
    const nextVal = Math.max(0, Math.min(100, current + amount));
    this.grudges.set(targetId, nextVal);
  }

  public decayGrudges(rate: number = 0.95): void {
    for (const [key, val] of this.grudges.entries()) {
      const decayed = Math.floor(val * rate);
      if (decayed <= 0) {
        this.grudges.delete(key);
      } else {
        this.grudges.set(key, decayed);
      }
    }
  }

  /**
   * 기억 추가
   */
  public addMemory(memory: AgentMemory): void {
    this.memories.push(memory);
    if (this.memories.length > 20) {
      this.memories.shift(); // 오래된 기억 최대 20개 유지
    }
  }

  /**
   * 특정 인물에 관한 최근 기억 검색
   */
  public getRecentMemoriesAbout(targetId: string, limit: number = 3): AgentMemory[] {
    return this.memories
      .filter((m) => m.actorId === targetId || m.targetId === targetId)
      .slice(-limit);
  }

  /**
   * 정보 획득 및 믿음 판별
   */
  public learnInformation(infoId: string, credibility: number, speakerRelation: number): void {
    this.knownInfoIds.add(infoId);
    // 전달자의 관계가 호의적이거나 정보 자체 신뢰도가 높으면 진실로 믿음
    const beliefThreshold = 50 - speakerRelation * 0.3;
    if (credibility >= beliefThreshold) {
      this.believedInfoIds.add(infoId);
    }
  }

  /**
   * 디버그 및 UI용 데이터 직렬화
   */
  public getProfileSnapshot() {
    return {
      id: this.id,
      name: this.name,
      positionTitle: this.positionTitle,
      rank: this.rank,
      department: this.department,
      age: this.age,
      politicalPower: this.politicalPower,
      ambition: this.ambition,
      duty: this.duty,
      loyalty: this.loyalty,
      riskAversion: this.riskAversion,
      honesty: this.honesty,
      goal: this.goal.description,
      status: this.currentStatus,
      knownCount: this.knownInfoIds.size,
      believedCount: this.believedInfoIds.size,
      memoryCount: this.memories.length,
    };
  }
}
