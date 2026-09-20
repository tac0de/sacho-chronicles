export type GoalType =
  | 'MAINTAIN_STABILITY'    // 조정 안정 및 현상 유지
  | 'SEEK_HIGHER_OFFICE'    // 승진 (의정부 입각, 판서 등)
  | 'OVERTHROW_RIVAL'       // 정적 탄핵 및 축출
  | 'PURGE_CORRUPTION'      // 부패 척결 및 기강 확립
  | 'GAIN_ROYAL_FAVOR'      // 국왕의 두터운 신임 확보
  | 'ACCUMULATE_WEALTH';    // 가문 번영 및 사리사욕

export interface AgentGoal {
  type: GoalType;
  targetAgentId?: string;   // 특정 대상이 있는 경우 (예: 정적 ID, 추천 대상 ID)
  description: string;      // 목표 한글 설명
  priority: number;         // 우선도 (1~100)
}
