import { Agent } from './Agent.js';
import { RelationshipManager } from './Relationship.js';
import { POSITIONS, type PositionId } from '../../data/positions.js';
import { DEFAULT_PROFILES } from '../../data/names.js';
import type { Random } from '../simulation/Random.js';
import type { AgentGoal } from './Goal.js';

export interface AgentInitializationResult {
  agents: Agent[];
  agentMap: Map<string, Agent>;
  relationshipManager: RelationshipManager;
}

export class AgentFactory {
  public static createAll(random: Random): AgentInitializationResult {
    const rel = new RelationshipManager();
    const agents: Agent[] = [];
    const agentMap = new Map<string, Agent>();

    // 12개 인물 생성 정의
    const configs: {
      id: string;
      positionId: PositionId;
      goal: AgentGoal;
    }[] = [
      {
        id: 'king',
        positionId: 'KING',
        goal: { type: 'MAINTAIN_STABILITY', description: '왕권 강화 및 조정 파벌 균형 유지', priority: 95 },
      },
      {
        id: 'chief_councillor',
        positionId: 'CHIEF_STATE_COUNCILLOR',
        goal: { type: 'MAINTAIN_STABILITY', description: '국정 안정 및 영의정 지위 보전', priority: 90 },
      },
      {
        id: 'left_councillor',
        positionId: 'LEFT_STATE_COUNCILLOR',
        goal: { type: 'SEEK_HIGHER_OFFICE', description: '차기 영의정 승진 및 당여 세력 확대', priority: 95 },
      },
      {
        id: 'right_councillor',
        positionId: 'RIGHT_STATE_COUNCILLOR',
        goal: { type: 'MAINTAIN_STABILITY', description: '유교적 예법 수호 및 권신 전횡 견제', priority: 85 },
      },
      {
        id: 'min_personnel',
        positionId: 'MINISTER_OF_PERSONNEL',
        goal: { type: 'SEEK_HIGHER_OFFICE', description: '인사권 장악 및 의정부 입각', priority: 90 },
      },
      {
        id: 'min_war',
        positionId: 'MINISTER_OF_WAR',
        goal: { type: 'ACCUMULATE_WEALTH', description: '군사권 유지 및 가문 세력 확장', priority: 80 },
      },
      {
        id: 'inspector_general',
        positionId: 'INSPECTOR_GENERAL',
        goal: { type: 'PURGE_CORRUPTION', description: '부패 관리 척결 및 기강 확립', priority: 90 },
      },
      {
        id: 'censor_general',
        positionId: 'CENSOR_GENERAL',
        goal: { type: 'PURGE_CORRUPTION', description: '권신 전횡 탄핵 및 국왕 간쟁', priority: 95 },
      },
      {
        id: 'academy_drafter',
        positionId: 'ACADEMY_DRAFTER',
        goal: { type: 'GAIN_ROYAL_FAVOR', description: '경연에서의 명성 획득 및 정론 주도', priority: 75 },
      },
      {
        id: 'chief_secretary',
        positionId: 'CHIEF_SECRETARY',
        goal: { type: 'GAIN_ROYAL_FAVOR', description: '국왕의 절대적 신임 유지 및 은대 장악', priority: 85 },
      },
      {
        id: 'royal_eunuch',
        positionId: 'ROYAL_EUNUCH',
        goal: { type: 'ACCUMULATE_WEALTH', description: '대전 밀담 정보 독점 및 신변 보전', priority: 70 },
      },
      {
        id: 'court_clerk',
        positionId: 'COURT_CLERK',
        goal: { type: 'ACCUMULATE_WEALTH', description: '궐내 정보 중개 및 이익 도모', priority: 65 },
      },
    ];

    for (const cfg of configs) {
      const pos = POSITIONS[cfg.positionId];
      const profile = DEFAULT_PROFILES[cfg.positionId];

      // 시드에 따른 미세 편차 (±4)
      const jitter = () => random.nextInt(-4, 4);

      const agent = new Agent({
        id: cfg.id,
        name: profile.name,
        positionId: cfg.positionId,
        positionTitle: pos.title,
        rank: pos.rank,
        department: pos.department,
        age: profile.age,
        politicalPower: Math.max(10, Math.min(100, pos.basePower + jitter())),
        ambition: Math.max(10, Math.min(100, profile.ambition + jitter())),
        duty: Math.max(10, Math.min(100, profile.duty + jitter())),
        loyalty: Math.max(10, Math.min(100, profile.loyalty + jitter())),
        riskAversion: Math.max(10, Math.min(100, profile.riskAversion + jitter())),
        honesty: Math.max(10, Math.min(100, profile.honesty + jitter())),
        goal: cfg.goal,
      });

      const westPositions: PositionId[] = ['CHIEF_STATE_COUNCILLOR', 'RIGHT_STATE_COUNCILLOR', 'MINISTER_OF_WAR', 'CENSOR_GENERAL'];
      const eastPositions: PositionId[] = ['LEFT_STATE_COUNCILLOR', 'MINISTER_OF_PERSONNEL', 'INSPECTOR_GENERAL', 'ACADEMY_DRAFTER'];

      if (westPositions.includes(cfg.positionId)) {
        agent.faction = 'WEST';
      } else if (eastPositions.includes(cfg.positionId)) {
        agent.faction = 'EAST';
      } else {
        agent.faction = 'NEUTRAL';
      }

      agents.push(agent);
      agentMap.set(agent.id, agent);
    }

    // 12x12 기본 관계 설정 (조선 궁중의 고유한 정치 지형)
    // 1) 왕과 신하들
    rel.setRelation('king', 'chief_councillor', 50, '노련한 재상에 대한 신뢰');
    rel.setRelation('chief_councillor', 'king', 85, '국왕에 대한 충의');

    rel.setRelation('king', 'left_councillor', 15, '능력은 있으나 야심을 경계');
    rel.setRelation('left_councillor', 'king', 60, '왕권에 대한 복종과 인정 욕구');

    rel.setRelation('king', 'right_councillor', 45, '원칙을 고수하는 도학자에 대한 신뢰');
    rel.setRelation('right_councillor', 'king', 80, '성리학적 군신유의');

    rel.setRelation('king', 'chief_secretary', 65, '명령을 신속히 받드는 비서실장 신임');
    rel.setRelation('chief_secretary', 'king', 90, '어명에 대한 무조건적 충성');

    rel.setRelation('king', 'censor_general', 30, '직언이 뼈아프나 언로를 열어둠');
    rel.setRelation('censor_general', 'king', 75, '임금을 바른길로 인도하려는 충정');

    rel.setRelation('king', 'min_war', 40, '무관으로서의 충직성 신뢰');
    rel.setRelation('min_war', 'king', 75, '왕권 호위');

    // 2) 대신들 간의 알력 및 붕당
    // 좌의정 vs 영의정 (권력 대립)
    rel.setRelation('left_councillor', 'chief_councillor', -35, '영의정의 자리를 대신하려는 야심');
    rel.setRelation('chief_councillor', 'left_councillor', -20, '좌의정의 급진적인 세력 확장을 경계');

    // 좌의정과 이조판서 (정치적 동맹)
    rel.setRelation('left_councillor', 'min_personnel', 45, '조정 인사를 장악하기 위한 맹우');
    rel.setRelation('min_personnel', 'left_councillor', 50, '차기 영의정 줄타기 맹우');

    // 우의정 vs 좌의정 & 이조판서 (원칙파 vs 권력파)
    rel.setRelation('right_councillor', 'left_councillor', -40, '권세를 남용하고 당여를 모으는 처신 비판');
    rel.setRelation('left_councillor', 'right_councillor', -30, '공리공론으로 발목을 잡는 고루한 노론');
    rel.setRelation('right_councillor', 'min_personnel', -35, '편향된 인사 전횡을 의심');
    rel.setRelation('min_personnel', 'right_councillor', -25, '원칙만 따지며 사사건건 시비');

    // 우의정과 영의정 (온건파 연대)
    rel.setRelation('right_councillor', 'chief_councillor', 35, '조정의 안정을 위한 협력');
    rel.setRelation('chief_councillor', 'right_councillor', 30, '원로 간의 상호 존중');

    // 3) 대간(사헌부 대사헌, 사간원 대사간)과 대신들
    // 대사헌/대사간의 상호 연대
    rel.setRelation('inspector_general', 'censor_general', 55, '양사(兩司) 합동 감찰 및 언론 연대');
    rel.setRelation('censor_general', 'inspector_general', 50, '풍헌과 간원의 굳건한 동맹');

    // 대간들의 이조판서/병조판서 감시
    rel.setRelation('inspector_general', 'min_personnel', -45, '인사 비리 및 정실 채용 의혹 감시');
    rel.setRelation('min_personnel', 'inspector_general', -40, '사사건건 흠집을 잡으려는 대사헌 반감');

    rel.setRelation('censor_general', 'min_war', -35, '군수 납품 및 관직 매관 소문 경계');
    rel.setRelation('min_war', 'censor_general', -30, '먹물 든 선비들의 탁상공론에 대한 적대');

    // 4) 홍문관, 승정원
    rel.setRelation('academy_drafter', 'right_councillor', 40, '도학적 학풍 계승');
    rel.setRelation('academy_drafter', 'censor_general', 35, '조정의 공론 형성 동지');
    rel.setRelation('chief_secretary', 'left_councillor', 10, '어느 쪽에도 치우치지 않으려는 외줄타기');

    // 5) 내관과 서리 (정보원)
    rel.setRelation('court_clerk', 'min_personnel', 20, '이조의 눈치를 보며 뇌물 첩보 거래');
    rel.setRelation('min_personnel', 'court_clerk', 10, '필요할 때 부려먹는 하급 서리');
    rel.setRelation('royal_eunuch', 'chief_secretary', 25, '승정원과 침전 사이의 정보 교류');
    rel.setRelation('court_clerk', 'royal_eunuch', 30, '궐내 사정과 뒷소문을 교환하는 동료');
    rel.setRelation('royal_eunuch', 'court_clerk', 25, '외조 소식을 묻는 관계');

    return { agents, agentMap, relationshipManager: rel };
  }
}
