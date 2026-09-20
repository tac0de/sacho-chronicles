import type { PoliticalEvent, RelationChangeRecord } from './PoliticalEvent.js';
import type { Agent } from '../agents/Agent.js';
import type { RelationshipManager } from '../agents/Relationship.js';
import type { WorldFactRegistry, WorldFact } from '../information/WorldFact.js';
import type { InfoNetwork } from '../information/InfoNetwork.js';
import type { Information } from '../information/Information.js';
import type { Random } from '../simulation/Random.js';

export class EventGenerator {
  /**
   * 하루 동안 발생할 정치적 사건들을 인과적으로 생성하고 세계에 적용합니다.
   * 단순 무작위 추첨이 아닌, NPC들의 상태, 야심, 관계, 최근 기억을 토대로 유력한 행동을 채택합니다.
   */
  public generateDailyEvents(
    day: number,
    agents: Agent[],
    agentMap: Map<string, Agent>,
    rel: RelationshipManager,
    factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent[] {
    const events: PoliticalEvent[] = [];

    // 하루에 보통 2~3개의 핵심 사건이 발생
    const eventCount = random.nextInt(2, 3);
    const candidateGenerators = [
      () => this.tryGeneratePromotionRivalry(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
      () => this.tryGenerateSlander(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
      () => this.tryGenerateBribery(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
      () => this.tryGenerateRumor(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
      () => this.tryGenerateImpeachment(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
      () => this.tryGenerateRoyalReprimand(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
      () => this.tryGenerateSecretMeeting(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
      () => this.tryGeneratePublicDebate(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
      () => this.tryGeneratePoliticalAlliance(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
      () => this.tryGenerateAppointmentRecommendation(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs),
    ];

    // 우선순위가 높은 인과적 사건(탄핵 상소, 질책 등)을 먼저 시도하도록 셔플 및 정렬
    const shuffledGenerators = random.shuffle(candidateGenerators);

    for (const gen of shuffledGenerators) {
      if (events.length >= eventCount) break;
      const ev = gen();
      if (ev) {
        events.push(ev);
        this.applyEventConsequences(ev, agentMap, rel, day);
      }
    }

    // 만약 조건 미달로 2개 미만일 경우 기본 사건 보충
    if (events.length < 2) {
      const fallback = this.generateFallbackEvent(day, agents, agentMap, rel, factRegistry, infoNetwork, random, simLogs);
      if (fallback) {
        events.push(fallback);
        this.applyEventConsequences(fallback, agentMap, rel, day);
      }
    }

    return events;
  }

  /**
   * 1. 승진 경쟁 (PROMOTION_RIVALRY)
   * 원인: 야심이 높은 두 인물이 상호 적대 관계이고 높은 관직을 탐함
   */
  private tryGeneratePromotionRivalry(
    day: number,
    agents: Agent[],
    agentMap: Map<string, Agent>,
    rel: RelationshipManager,
    _factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const ambitiousAgents = agents.filter((a) => a.ambition >= 70 && a.id !== 'king');
    if (ambitiousAgents.length < 2) return null;

    for (const a of ambitiousAgents) {
      for (const b of ambitiousAgents) {
        if (a.id === b.id) continue;
        const relVal = rel.getRelation(a.id, b.id);
        if (relVal < 0 && random.chance(0.45)) {
          const reason = `${a.name}(${a.positionTitle}, 야심:${a.ambition})와 ${b.name}(${b.positionTitle}, 야심:${b.ambition})가 상호 관계(${relVal})가 악화된 가운데 조정 요직을 둘러싸고 정면 경쟁에 돌입함`;
          simLogs.push(`[Day ${day}] [Simulation:승진경쟁] ${reason}`);

          const evId = `EV_${day}_RIVAL_${random.nextInt(100, 999)}`;
          const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;

          a.currentStatus = '승진 경쟁 중';
          b.currentStatus = '승진 경쟁 중';

          const info: Information = {
            id: infoId,
            day,
            content: `${a.name} ${a.positionTitle}와 ${b.name} ${b.positionTitle}가 조정에서 격렬한 알력을 벌이기 시작했다.`,
            subjectId: b.id,
            originalCreatorId: a.id,
            currentHolderId: a.id,
            witnessType: 'DIRECT',
            hopCount: 0,
            credibility: 85,
            distortionType: 'FACT',
            locationId: 'ROYAL_HALL',
            expressionOptions: {
              cautious: `${a.name}와 ${b.name} 사이에 불화의 기미가 있다는 말이 돌았다.`,
              moderate: `${a.name}와 ${b.name}가 조정을 가르고 권력 경쟁을 벌이기 시작했다.`,
              assertive: `${a.name}와 ${b.name}는 사리사욕을 위해 조정의 기강을 무너뜨리는 정적이다.`,
            },
          };
          infoNetwork.addInformation(info);

          const relChanges: RelationChangeRecord[] = [
            { fromId: a.id, toId: b.id, delta: -15, reason: '승진 경쟁으로 인한 적대 심화' },
            { fromId: b.id, toId: a.id, delta: -15, reason: '승진 경쟁 맞대응' },
          ];

          return {
            id: evId,
            day,
            type: 'PROMOTION_RIVALRY',
            locationId: 'ROYAL_HALL',
            instigatorId: a.id,
            targetId: b.id,
            title: `${a.name}와 ${b.name}의 승진 경쟁 격화`,
            summary: `${a.name} ${a.positionTitle}가 ${b.name} ${b.positionTitle}를 강력한 정적으로 규정하고 공개적으로 견제에 나섰습니다.`,
            causationReason: reason,
            generatedInfoIds: [infoId],
            relationChanges: relChanges,
          };
        }
      }
    }
    return null;
  }

  /**
   * 2. 고의적 모함 (SLANDER)
   * 원인: 정직성이 낮고 야심이 높은 인물이 정적에게 치명적 타격을 주기 위해 거짓 추문을 꾸밈
   */
  private tryGenerateSlander(
    day: number,
    agents: Agent[],
    _agentMap: Map<string, Agent>,
    rel: RelationshipManager,
    factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const schemers = agents.filter((a) => a.honesty <= 45 && a.ambition >= 65 && a.id !== 'king');
    if (schemers.length === 0) return null;

    const actor = random.pick(schemers);
    // 적대적인 대상 찾기
    const targets = agents.filter((b) => b.id !== actor.id && b.id !== 'king' && rel.getRelation(actor.id, b.id) <= -10);
    if (targets.length === 0) return null;

    const target = random.pick(targets);
    const reason = `${actor.name}(${actor.positionTitle}, 정직성:${actor.honesty}, 야심:${actor.ambition})가 적대 관계(${rel.getRelation(actor.id, target.id)})인 ${target.name}를 실각시키기 위해 은밀히 모함을 획책함`;
    simLogs.push(`[Day ${day}] [Simulation:모함] ${reason}`);

    // 객관적 사실(WorldFact): 실제로는 무고함!
    const factId = `FACT_${day}_${random.nextInt(1000, 9999)}`;
    const fact: WorldFact = {
      id: factId,
      day,
      type: 'SLANDER_FABRICATED',
      subjectId: target.id,
      targetId: actor.id,
      locationId: 'PALACE_CORRIDOR',
      isActuallyGuilty: false, // 결백함
      description: `${actor.name}가 꾸며낸 무고. ${target.name}는 부정한 행위를 하지 않았다.`,
      underlyingContext: reason,
    };
    factRegistry.register(fact);

    // 날조된 정보 생성 (INTENTIONAL_LIE)
    const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;
    const info: Information = {
      id: infoId,
      factId,
      day,
      content: `${actor.name} 측근의 밀고: "${target.name} ${target.positionTitle}가 사사로이 결탁하여 밀계를 꾸민다."`,
      subjectId: target.id,
      originalCreatorId: actor.id,
      currentHolderId: actor.id,
      witnessType: 'DIRECT',
      hopCount: 0,
      credibility: 60,
      distortionType: 'INTENTIONAL_LIE',
      locationId: 'PALACE_CORRIDOR',
      expressionOptions: {
        cautious: `${target.name}에 대한 불온한 모의가 있다는 말이 은밀히 나돌았다.`,
        moderate: `${target.name}가 당여를 모아 은밀히 정국을 흔든다는 의혹이 제기되었다.`,
        assertive: `${target.name}는 사사로운 도당을 결성하여 조정을 농락하는 무리이다.`,
      },
    };
    infoNetwork.addInformation(info);

    const evId = `EV_${day}_SLAND_${random.nextInt(100, 999)}`;
    return {
      id: evId,
      day,
      type: 'SLANDER',
      locationId: 'PALACE_CORRIDOR',
      instigatorId: actor.id,
      targetId: target.id,
      title: `${actor.name}의 ${target.name}에 대한 은밀한 모함`,
      summary: `${actor.name} ${actor.positionTitle}가 궐내 회랑에서 ${target.name}를 무너뜨리기 위한 헛소문을 유포하기 시작했습니다.`,
      causationReason: reason,
      worldFactId: factId,
      generatedInfoIds: [infoId],
      relationChanges: [
        { fromId: target.id, toId: actor.id, delta: -25, reason: '음해에 대한 잠재적 반감' },
      ],
    };
  }

  /**
   * 3. 뇌물 의혹 (BRIBERY_ALLEGATION)
   * 판서나 관리에게 뇌물 시도가 있었음. 객관적 사실에서 수수 vs 거절이 결정됨.
   */
  private tryGenerateBribery(
    day: number,
    agents: Agent[],
    _agentMap: Map<string, Agent>,
    _rel: RelationshipManager,
    factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const candidates = agents.filter((a) => ['min_personnel', 'min_war', 'court_clerk', 'left_councillor'].includes(a.id));
    if (candidates.length === 0) return null;

    const official = random.pick(candidates);
    // 정직성이 낮으면 실제로 수수, 높으면 거절
    const actuallyTookBribe = official.honesty < 45 && random.chance(0.7);

    const factId = `FACT_${day}_${random.nextInt(1000, 9999)}`;
    const fact: WorldFact = {
      id: factId,
      day,
      type: actuallyTookBribe ? 'BRIBE_ACCEPTED' : 'BRIBE_REJECTED',
      subjectId: official.id,
      locationId: 'PALACE_CORRIDOR',
      isActuallyGuilty: actuallyTookBribe,
      description: actuallyTookBribe
        ? `${official.name} ${official.positionTitle}가 한양 거상에게 은괴 500냥을 은밀히 수수함.`
        : `${official.name} ${official.positionTitle}에게 뇌물 청탁이 들어왔으나 추상같이 호통치며 내쳤음.`,
      underlyingContext: `${official.name}의 정직성 수치(${official.honesty}) 및 위험성향(${official.riskAversion})에 의해 판정`,
    };
    factRegistry.register(fact);

    const reason = `${official.name}(정직성:${official.honesty})에게 거상의 은밀한 청탁이 닿아 뇌물 사건이 발생함 (실제 수수 여부: ${actuallyTookBribe ? '참' : '거짓/결백'})`;
    simLogs.push(`[Day ${day}] [Simulation:뇌물의혹] ${reason}`);

    // 정보 생성 (목격자는 서리 최달식 또는 내관)
    const witnessId = random.pick(['court_clerk', 'royal_eunuch']);
    const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;
    const info: Information = {
      id: infoId,
      factId,
      day,
      content: `[풍문] ${official.name} ${official.positionTitle} 댁에 야밤에 상인의 궤짝이 들어갔다는 말이 파다하다.`,
      subjectId: official.id,
      originalCreatorId: witnessId,
      currentHolderId: witnessId,
      witnessType: 'HEARSAY',
      hopCount: 1,
      credibility: 70,
      distortionType: actuallyTookBribe ? 'FACT' : 'MISUNDERSTANDING',
      locationId: 'PALACE_CORRIDOR',
      expressionOptions: {
        cautious: `${official.name}가 뇌물을 받았다는 풍문이 궐내에 돌았다.`,
        moderate: `${official.name}가 사사로이 재물을 챙겼다는 의혹이 짙다.`,
        assertive: `${official.name}는 뇌물을 탐하여 법도를 어지럽힌 탐관오리이다.`,
      },
    };
    infoNetwork.addInformation(info);

    const evId = `EV_${day}_BRIBE_${random.nextInt(100, 999)}`;
    return {
      id: evId,
      day,
      type: 'BRIBERY_ALLEGATION',
      locationId: 'PALACE_CORRIDOR',
      instigatorId: official.id,
      thirdPartyId: witnessId,
      title: `${official.name} ${official.positionTitle}의 뇌물 수수 의혹`,
      summary: `궐내 회랑에서 ${official.name} 대감에게 은밀한 재물이 건네졌다는 의혹이 불거졌습니다.`,
      causationReason: reason,
      worldFactId: factId,
      generatedInfoIds: [infoId],
      relationChanges: [
        { fromId: 'inspector_general', toId: official.id, delta: -15, reason: '뇌물 의혹에 대한 사헌부의 주시' },
        { fromId: 'censor_general', toId: official.id, delta: -15, reason: '비리 의혹에 대한 간원의 규탄 태세' },
      ],
    };
  }

  /**
   * 4. 대간 탄핵 상소 (IMPEACHMENT)
   * 원인: 대사헌(이승현)이나 대사간(박문수)이 특정 인물의 비리 정보를 믿고 있으며, 명분(duty)이 높을 때
   */
  private tryGenerateImpeachment(
    day: number,
    agents: Agent[],
    _agentMap: Map<string, Agent>,
    rel: RelationshipManager,
    _factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const censors = agents.filter((a) => ['inspector_general', 'censor_general'].includes(a.id));
    const censor = random.pick(censors);

    // 대간이 진실로 믿고 있는 정보 중 비리/모함에 관한 것이 있는지 확인
    const targetCandidates = agents.filter((b) => {
      if (b.id === 'king' || b.id === censor.id) return false;
      const relVal = rel.getRelation(censor.id, b.id);
      return relVal < 0; // 이미 의심하거나 적대적인 대상
    });

    if (targetCandidates.length === 0) return null;
    const target = random.pick(targetCandidates);

    const reason = `${censor.name}(${censor.positionTitle}, 명분:${censor.duty})가 대상 ${target.name}의 비위와 전횡에 대한 풍문을 접하고, 유교적 명분과 적대 관계(${rel.getRelation(censor.id, target.id)})에 의해 탄핵 상소를 결의함`;
    simLogs.push(`[Day ${day}] [Simulation:탄핵상소] ${reason}`);

    target.currentStatus = '탄핵 위기';
    target.addGrudge(censor.id, 45); // 탄핵당한 자는 큰 원한을 품음

    const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;
    const info: Information = {
      id: infoId,
      day,
      content: `${censor.name} ${censor.positionTitle}가 편전에서 ${target.name}의 관직 삭탈을 주청하는 탄핵 상소를 올렸다.`,
      subjectId: target.id,
      originalCreatorId: censor.id,
      currentHolderId: censor.id,
      witnessType: 'DIRECT',
      hopCount: 0,
      credibility: 90,
      distortionType: 'FACT',
      locationId: 'ROYAL_HALL',
      expressionOptions: {
        cautious: `대간에서 ${target.name}의 처신을 탄핵하는 상소가 있었다.`,
        moderate: `${censor.name}가 ${target.name}의 죄상을 열거하며 파직을 강력히 청하였다.`,
        assertive: `${target.name}는 천인공노할 죄를 지어 대간의 엄중한 탄핵을 받아 마땅하다.`,
      },
    };
    infoNetwork.addInformation(info);

    const evId = `EV_${day}_IMPEACH_${random.nextInt(100, 999)}`;
    return {
      id: evId,
      day,
      type: 'IMPEACHMENT',
      locationId: 'ROYAL_HALL',
      instigatorId: censor.id,
      targetId: target.id,
      title: `${censor.name}의 ${target.name} 탄핵 상소`,
      summary: `${censor.name} ${censor.positionTitle}가 편전 어전에서 ${target.name}의 전횡과 비리를 열거하며 즉각 파직을 청했습니다.`,
      causationReason: reason,
      generatedInfoIds: [infoId],
      relationChanges: [
        { fromId: censor.id, toId: target.id, delta: -30, reason: '탄핵으로 인한 공적 단죄' },
        { fromId: target.id, toId: censor.id, delta: -50, reason: '자신을 탄핵한 것에 대한 극심한 원한' },
        { fromId: 'king', toId: target.id, delta: -15, reason: '탄핵 상소로 인한 신뢰 하락' },
      ],
    };
  }

  /**
   * 5. 왕의 질책 (ROYAL_REPRIMAND)
   * 원인: '탄핵 위기'에 처해있거나 왕에 대한 신뢰가 낮은 인물을 국왕이 꾸짖음
   */
  private tryGenerateRoyalReprimand(
    day: number,
    agents: Agent[],
    agentMap: Map<string, Agent>,
    rel: RelationshipManager,
    factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const king = agentMap.get('king')!;
    const reprimandTargets = agents.filter((a) => a.id !== 'king' && (a.currentStatus === '탄핵 위기' || rel.getRelation('king', a.id) < 10));
    if (reprimandTargets.length === 0) return null;

    const target = random.pick(reprimandTargets);
    const reason = `주상 전하가 ${target.name}(${target.positionTitle})의 잇따른 구설과 탄핵 상소에 진노하여 어전에서 엄히 꾸짖음 (국왕 충성도/신뢰: ${rel.getRelation('king', target.id)})`;
    simLogs.push(`[Day ${day}] [Simulation:왕의질책] ${reason}`);

    target.currentStatus = '근신 중';
    target.politicalPower = Math.max(15, target.politicalPower - 10); // 권력 위축

    const factId = `FACT_${day}_${random.nextInt(1000, 9999)}`;
    const fact: WorldFact = {
      id: factId,
      day,
      type: 'ROYAL_DISPLEASURE_REAL',
      subjectId: target.id,
      locationId: 'ROYAL_HALL',
      isActuallyGuilty: true,
      description: `임금이 ${target.name}의 처신을 크게 질책하여 벼루를 던질 정도로 진노함.`,
      underlyingContext: reason,
    };
    factRegistry.register(fact);

    const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;
    const info: Information = {
      id: infoId,
      factId,
      day,
      content: `주상께서 편전에서 ${target.name} ${target.positionTitle}를 거세게 꾸짖으며 문책을 명하셨다.`,
      subjectId: target.id,
      originalCreatorId: king.id,
      currentHolderId: 'chief_secretary',
      witnessType: 'DIRECT',
      hopCount: 0,
      credibility: 95,
      distortionType: 'FACT',
      locationId: 'ROYAL_HALL',
      expressionOptions: {
        cautious: `임금이 ${target.name}에게 유감을 표명했다는 말이 있었다.`,
        moderate: `임금의 엄한 질책이 떨어져 ${target.name}가 곤혹을 치렀다.`,
        assertive: `${target.name}는 임금의 신임을 완전히 잃고 버림받은 신하이다.`,
      },
    };
    infoNetwork.addInformation(info);

    const evId = `EV_${day}_REPRIMAND_${random.nextInt(100, 999)}`;
    return {
      id: evId,
      day,
      type: 'ROYAL_REPRIMAND',
      locationId: 'ROYAL_HALL',
      instigatorId: 'king',
      targetId: target.id,
      title: `주상 전하의 ${target.name} 공개 질책`,
      summary: `주상 전하께서 편전에서 ${target.name} ${target.positionTitle}의 실정을 꾸짖으며 자숙을 명하였습니다.`,
      causationReason: reason,
      worldFactId: factId,
      generatedInfoIds: [infoId],
      relationChanges: [
        { fromId: 'king', toId: target.id, delta: -20, reason: '왕의 진노로 인한 신임 실추' },
        { fromId: target.id, toId: 'king', delta: -10, reason: '질책에 대한 섭섭함과 불안' },
      ],
    };
  }

  /**
   * 6. 비밀 회동 (SECRET_MEETING)
   * 원인: 위기에 처한 인물이나 야심가가 궐내 회랑에서 친밀한 아군과 밀담
   */
  private tryGenerateSecretMeeting(
    day: number,
    agents: Agent[],
    _agentMap: Map<string, Agent>,
    rel: RelationshipManager,
    factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const troubledAgents = agents.filter((a) => a.id !== 'king' && (a.currentStatus === '근신 중' || a.currentStatus === '탄핵 위기' || a.ambition >= 80));
    if (troubledAgents.length === 0) return null;

    const actor = random.pick(troubledAgents);
    // 아군 찾기
    const allies = agents.filter((b) => b.id !== actor.id && b.id !== 'king' && rel.getRelation(actor.id, b.id) >= 20);
    if (allies.length === 0) return null;

    const ally = random.pick(allies);
    const reason = `${actor.name}(상태:${actor.currentStatus}, 야심:${actor.ambition})가 위기 타개 또는 정국 반전을 위해 심복인 ${ally.name}(관계:${rel.getRelation(actor.id, ally.id)})과 궐내 회랑에서 비밀 회동을 가짐`;
    simLogs.push(`[Day ${day}] [Simulation:비밀회동] ${reason}`);

    const factId = `FACT_${day}_${random.nextInt(1000, 9999)}`;
    const fact: WorldFact = {
      id: factId,
      day,
      type: 'SECRET_CONSPIRACY',
      subjectId: actor.id,
      targetId: ally.id,
      locationId: 'PALACE_CORRIDOR',
      isActuallyGuilty: true,
      description: `${actor.name}와 ${ally.name}가 밀담을 나누며 향후 인사와 상소 반격을 모의함.`,
      underlyingContext: reason,
    };
    factRegistry.register(fact);

    const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;
    const info: Information = {
      id: infoId,
      factId,
      day,
      content: `달빛 아래 궐내 회랑에서 ${actor.name}와 ${ally.name}가 은밀히 머리를 맞대고 속삭이는 모습이 목격되었다.`,
      subjectId: actor.id,
      originalCreatorId: 'court_clerk',
      currentHolderId: 'court_clerk',
      witnessType: 'HEARSAY',
      hopCount: 1,
      credibility: 75,
      distortionType: 'FACT',
      locationId: 'PALACE_CORRIDOR',
      expressionOptions: {
        cautious: `${actor.name}와 ${ally.name} 사이에 모종의 대화가 오갔다는 풍문이 돌았다.`,
        moderate: `${actor.name}와 ${ally.name}가 야밤에 당여를 규합하는 밀계를 꾸몄다.`,
        assertive: `${actor.name}와 ${ally.name}는 권세를 지키기 위해 사리사욕의 밀약을 맺은 결탁자들이다.`,
      },
    };
    infoNetwork.addInformation(info);

    const evId = `EV_${day}_SECRET_${random.nextInt(100, 999)}`;
    return {
      id: evId,
      day,
      type: 'SECRET_MEETING',
      locationId: 'PALACE_CORRIDOR',
      instigatorId: actor.id,
      targetId: ally.id,
      title: `${actor.name}와 ${ally.name}의 은밀한 비밀 회동`,
      summary: `어둠이 내린 궐내 회랑 구석에서 두 관원이 긴밀히 밀담을 나누며 결탁을 다졌습니다.`,
      causationReason: reason,
      worldFactId: factId,
      generatedInfoIds: [infoId],
      relationChanges: [
        { fromId: actor.id, toId: ally.id, delta: 15, reason: '비밀 공유로 인한 신뢰 증진' },
        { fromId: ally.id, toId: actor.id, delta: 15, reason: '정치적 연대 결속 강화' },
      ],
    };
  }

  /**
   * 7. 대신 간 공개 논쟁 (PUBLIC_DEBATE)
   */
  private tryGeneratePublicDebate(
    day: number,
    agents: Agent[],
    _agentMap: Map<string, Agent>,
    rel: RelationshipManager,
    _factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const ministers = agents.filter((a) => ['chief_councillor', 'left_councillor', 'right_councillor', 'min_personnel', 'min_war'].includes(a.id));
    for (const a of ministers) {
      for (const b of ministers) {
        if (a.id === b.id) continue;
        if (rel.getRelation(a.id, b.id) <= -20 && random.chance(0.4)) {
          const reason = `${a.name}와 ${b.name}가 편전에서 상호 간의 구원(관계:${rel.getRelation(a.id, b.id)})으로 인해 국정 정책을 빌미로 고성을 주고받으며 정면 충돌함`;
          simLogs.push(`[Day ${day}] [Simulation:공개논쟁] ${reason}`);

          const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;
          const info: Information = {
            id: infoId,
            day,
            content: `편전 회의 중 ${a.name} ${a.positionTitle}와 ${b.name} ${b.positionTitle}가 서로의 실정을 비난하며 격렬히 다투었다.`,
            subjectId: b.id,
            originalCreatorId: a.id,
            currentHolderId: a.id,
            witnessType: 'DIRECT',
            hopCount: 0,
            credibility: 90,
            distortionType: 'FACT',
            locationId: 'ROYAL_HALL',
            expressionOptions: {
              cautious: `편전에서 대신들 간에 언쟁이 오갔다는 말이 전해졌다.`,
              moderate: `${a.name}와 ${b.name}가 조정에서 격렬히 충돌하여 대신들의 눈총을 샀다.`,
              assertive: `${a.name}와 ${b.name}의 사욕에 눈먼 싸움으로 조정이 분열되었다.`,
            },
          };
          infoNetwork.addInformation(info);

          const evId = `EV_${day}_DEBATE_${random.nextInt(100, 999)}`;
          return {
            id: evId,
            day,
            type: 'PUBLIC_DEBATE',
            locationId: 'ROYAL_HALL',
            instigatorId: a.id,
            targetId: b.id,
            title: `${a.name}와 ${b.name}의 편전 설전`,
            summary: `어전 회의에서 두 대신이 정책과 인사를 두고 서로를 맹렬히 비판하며 조정을 긴장시켰습니다.`,
            causationReason: reason,
            generatedInfoIds: [infoId],
            relationChanges: [
              { fromId: a.id, toId: b.id, delta: -10, reason: '공개 설전으로 인한 감정 악화' },
              { fromId: b.id, toId: a.id, delta: -10, reason: '공개 설전 반발' },
            ],
          };
        }
      }
    }
    return null;
  }

  /**
   * 8. 궁중 풍문 발생 (RUMOR_INCEPTION)
   */
  private tryGenerateRumor(
    day: number,
    agents: Agent[],
    _agentMap: Map<string, Agent>,
    _rel: RelationshipManager,
    factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const rumorSources = agents.filter((a) => ['court_clerk', 'royal_eunuch', 'academy_drafter'].includes(a.id));
    const creator = random.pick(rumorSources);
    const prominentAgents = agents.filter((a) => a.id !== 'king' && a.politicalPower >= 70);
    const target = random.pick(prominentAgents);

    const reason = `${creator.name}(${creator.positionTitle})가 궐내에서 떠도는 권세가 ${target.name}에 대한 뜬소문을 수집하여 퍼뜨리기 시작함`;
    simLogs.push(`[Day ${day}] [Simulation:풍문발생] ${reason}`);

    const factId = `FACT_${day}_${random.nextInt(1000, 9999)}`;
    const fact: WorldFact = {
      id: factId,
      day,
      type: 'NO_BRIBE_EVENT',
      subjectId: target.id,
      locationId: 'ROYAL_SECRETARIAT',
      isActuallyGuilty: false,
      description: `단순한 입소문. 실체 없는 궁중 풍문이다.`,
      underlyingContext: reason,
    };
    factRegistry.register(fact);

    const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;
    const info: Information = {
      id: infoId,
      factId,
      day,
      content: `승정원 안팎에서 ${target.name} ${target.positionTitle}에 관한 미확인 소문이 무성하게 퍼지고 있다.`,
      subjectId: target.id,
      originalCreatorId: creator.id,
      currentHolderId: creator.id,
      witnessType: 'RUMOR',
      hopCount: 2,
      credibility: 50,
      distortionType: 'MISUNDERSTANDING',
      locationId: 'ROYAL_SECRETARIAT',
      expressionOptions: {
        cautious: `${target.name}에 대한 풍문이 승정원 주위에 떠돌았다.`,
        moderate: `${target.name}의 행실에 의심스러운 소문이 파다하여 관원들이 수군거렸다.`,
        assertive: `${target.name}는 궐내 추문의 진원지로 비난을 면치 못할 것이다.`,
      },
    };
    infoNetwork.addInformation(info);

    const evId = `EV_${day}_RUMOR_${random.nextInt(100, 999)}`;
    return {
      id: evId,
      day,
      type: 'RUMOR_INCEPTION',
      locationId: 'ROYAL_SECRETARIAT',
      instigatorId: creator.id,
      targetId: target.id,
      title: `${target.name}에 관한 궁중 풍문 확산`,
      summary: `승정원과 회랑을 중심으로 ${target.name}에 대한 확인되지 않은 소문이 급속도로 번지고 있습니다.`,
      causationReason: reason,
      worldFactId: factId,
      generatedInfoIds: [infoId],
      relationChanges: [],
    };
  }

  /**
   * 9. 정치적 지원 (POLITICAL_ALLIANCE)
   */
  private tryGeneratePoliticalAlliance(
    day: number,
    agents: Agent[],
    _agentMap: Map<string, Agent>,
    rel: RelationshipManager,
    _factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const candidates = agents.filter((a) => a.id !== 'king');
    for (const a of candidates) {
      for (const b of candidates) {
        if (a.id === b.id) continue;
        const currentRel = rel.getRelation(a.id, b.id);
        if (currentRel >= 30 && currentRel < 70 && random.chance(0.35)) {
          const reason = `${a.name}와 ${b.name}가 기존의 호감(관계:${currentRel})을 바탕으로 향후 정국에서 한 목소리를 내기로 연대를 확약함`;
          simLogs.push(`[Day ${day}] [Simulation:정치적지원] ${reason}`);

          const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;
          const info: Information = {
            id: infoId,
            day,
            content: `${a.name} ${a.positionTitle}와 ${b.name} ${b.positionTitle}가 조정에서 상호 지원을 표명하며 손을 잡았다.`,
            subjectId: b.id,
            originalCreatorId: a.id,
            currentHolderId: a.id,
            witnessType: 'HEARSAY',
            hopCount: 1,
            credibility: 80,
            distortionType: 'FACT',
            locationId: 'PALACE_CORRIDOR',
            expressionOptions: {
              cautious: `${a.name}와 ${b.name} 사이에 연대의 뜻이 오갔다는 말이 있었다.`,
              moderate: `${a.name}와 ${b.name}가 세력을 합쳐 조정의 큰 당여를 형성했다.`,
              assertive: `${a.name}와 ${b.name}가 당동벌이를 꾀하며 사사로운 붕당을 구축했다.`,
            },
          };
          infoNetwork.addInformation(info);

          const evId = `EV_${day}_ALLY_${random.nextInt(100, 999)}`;
          return {
            id: evId,
            day,
            type: 'POLITICAL_ALLIANCE',
            locationId: 'PALACE_CORRIDOR',
            instigatorId: a.id,
            targetId: b.id,
            title: `${a.name}와 ${b.name}의 정치적 연대 결성`,
            summary: `두 유력 인사가 조정에서 뜻을 같이하기로 약조하며 상호 지원 태세를 굳혔습니다.`,
            causationReason: reason,
            generatedInfoIds: [infoId],
            relationChanges: [
              { fromId: a.id, toId: b.id, delta: 15, reason: '정치적 연대 체결' },
              { fromId: b.id, toId: a.id, delta: 15, reason: '상호 지원 화답' },
            ],
          };
        }
      }
    }
    return null;
  }

  /**
   * 10. 인사 추천 (APPOINTMENT_RECOMMENDATION)
   */
  private tryGenerateAppointmentRecommendation(
    day: number,
    agents: Agent[],
    _agentMap: Map<string, Agent>,
    rel: RelationshipManager,
    factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent | null {
    const recommender = agents.find((a) => a.id === 'min_personnel') || agents.find((a) => a.id === 'chief_councillor');
    if (!recommender) return null;

    const beneficiaries = agents.filter((b) => b.id !== 'king' && b.id !== recommender.id && rel.getRelation(recommender.id, b.id) >= 20);
    if (beneficiaries.length === 0) return null;

    const target = random.pick(beneficiaries);
    const isMerit = target.duty >= 60;

    const factId = `FACT_${day}_${random.nextInt(1000, 9999)}`;
    const fact: WorldFact = {
      id: factId,
      day,
      type: isMerit ? 'MERIT_PROMOTION' : 'UNQUALIFIED_PROMOTION',
      subjectId: target.id,
      targetId: recommender.id,
      locationId: 'ROYAL_HALL',
      isActuallyGuilty: !isMerit,
      description: isMerit
        ? `${recommender.name}의 합당한 인재 천거. ${target.name}는 능력과 명망을 갖추었음.`
        : `${recommender.name}의 정실 인사. 친분으로 부적격 인물을 추천함.`,
      underlyingContext: `${recommender.name}의 호감도(${rel.getRelation(recommender.id, target.id)}) 기반 천거`,
    };
    factRegistry.register(fact);

    const reason = `${recommender.name}(${recommender.positionTitle})가 각별한 관계(${rel.getRelation(recommender.id, target.id)})인 ${target.name}를 조정 중직에 천거함`;
    simLogs.push(`[Day ${day}] [Simulation:인사추천] ${reason}`);

    const infoId = `INFO_${day}_${random.nextInt(1000, 9999)}`;
    const info: Information = {
      id: infoId,
      factId,
      day,
      content: `${recommender.name} ${recommender.positionTitle}가 편전에서 ${target.name} ${target.positionTitle}를 충직한 인재로 크게 천거하였다.`,
      subjectId: target.id,
      originalCreatorId: recommender.id,
      currentHolderId: recommender.id,
      witnessType: 'DIRECT',
      hopCount: 0,
      credibility: 85,
      distortionType: 'FACT',
      locationId: 'ROYAL_HALL',
      expressionOptions: {
        cautious: `${recommender.name}가 ${target.name}를 천거했다는 소식이 전해졌다.`,
        moderate: `${recommender.name}가 사사로운 인맥으로 ${target.name}의 발탁을 주도했다.`,
        assertive: `${recommender.name}는 인사를 농단하여 제 편인 ${target.name}만을 요직에 심었다.`,
      },
    };
    infoNetwork.addInformation(info);

    const evId = `EV_${day}_APPOINT_${random.nextInt(100, 999)}`;
    return {
      id: evId,
      day,
      type: 'APPOINTMENT_RECOMMENDATION',
      locationId: 'ROYAL_HALL',
      instigatorId: recommender.id,
      targetId: target.id,
      title: `${recommender.name}의 ${target.name} 요직 추천`,
      summary: `${recommender.name} 대감이 어전에서 ${target.name}의 현명함을 칭송하며 중책을 맡길 것을 주청했습니다.`,
      causationReason: reason,
      worldFactId: factId,
      generatedInfoIds: [infoId],
      relationChanges: [
        { fromId: target.id, toId: recommender.id, delta: 25, reason: '파격 천거에 대한 보은' },
        { fromId: 'inspector_general', toId: recommender.id, delta: -10, reason: '사헌부의 인사 편중 감시' },
      ],
    };
  }

  /**
   * 폴백 이벤트 (조건에 맞는 격한 사건이 없을 때 일어나는 일상적 궁중 정무)
   */
  private generateFallbackEvent(
    day: number,
    agents: Agent[],
    _agentMap: Map<string, Agent>,
    _rel: RelationshipManager,
    factRegistry: WorldFactRegistry,
    infoNetwork: InfoNetwork,
    random: Random,
    simLogs: string[]
  ): PoliticalEvent {
    const drafter = agents.find((a) => a.id === 'academy_drafter') || agents[0];
    const reason = `조정의 일상 경연 중 학문과 예법을 논하며 여론이 형성됨`;
    simLogs.push(`[Day ${day}] [Simulation:경연논의] ${reason}`);

    const factId = `FACT_${day}_FALLBACK`;
    const fact: WorldFact = {
      id: factId,
      day,
      type: 'HONORABLE_CONDUCT' as any,
      subjectId: drafter.id,
      locationId: 'ROYAL_HALL',
      isActuallyGuilty: false,
      description: '홍문관 교리와 대신들이 경연에서 선현의 도리를 논의함',
      underlyingContext: '통상적인 경연 일정',
    };
    factRegistry.register(fact);

    const infoId = `INFO_${day}_FALLBACK`;
    const info: Information = {
      id: infoId,
      factId,
      day,
      content: `홍문관 ${drafter.name}가 경연에서 군주의 수양과 신하의 절의에 대해 경서 강독을 올렸다.`,
      subjectId: drafter.id,
      originalCreatorId: drafter.id,
      currentHolderId: drafter.id,
      witnessType: 'DIRECT',
      hopCount: 0,
      credibility: 90,
      distortionType: 'FACT',
      locationId: 'ROYAL_HALL',
      expressionOptions: {
        cautious: `경연에서 학문과 치도에 대한 논의가 있었다.`,
        moderate: `홍문관이 직언을 섞어 군왕의 도리를 강론하였다.`,
        assertive: `홍문관 학사들이 군주를 바른길로 인도하고자 예를 다했다.`,
      },
    };
    infoNetwork.addInformation(info);

    return {
      id: `EV_${day}_ROUTINE_${random.nextInt(100, 999)}`,
      day,
      type: 'PUBLIC_DEBATE',
      locationId: 'ROYAL_HALL',
      instigatorId: drafter.id,
      title: `홍문관의 경연 강론과 치도 논의`,
      summary: `편전에서 경연이 열려 학문과 시국의 도리에 대한 강독이 진지하게 진행되었습니다.`,
      causationReason: reason,
      worldFactId: factId,
      generatedInfoIds: [infoId],
      relationChanges: [],
    };
  }

  /**
   * 사건의 결과(관계치 변동, 기억 저장)를 세계에 반영
   */
  private applyEventConsequences(ev: PoliticalEvent, agentMap: Map<string, Agent>, rel: RelationshipManager, day: number): void {
    // 1. 관계치 반영
    for (const chg of ev.relationChanges) {
      rel.modifyRelation(chg.fromId, chg.toId, chg.delta, chg.reason, day);
    }

    // 2. 기억 추가
    const instigator = agentMap.get(ev.instigatorId);
    const target = ev.targetId ? agentMap.get(ev.targetId) : undefined;

    if (instigator) {
      instigator.addMemory({
        id: `MEM_${day}_${ev.id}_INS`,
        day,
        eventId: ev.id,
        eventType: ev.type,
        actorId: instigator.id,
        targetId: target?.id,
        description: ev.title,
        emotionalImpact: 10,
      });
    }

    if (target) {
      const isNegative = ['IMPEACHMENT', 'ROYAL_REPRIMAND', 'SLANDER', 'BRIBERY_ALLEGATION'].includes(ev.type);
      target.addMemory({
        id: `MEM_${day}_${ev.id}_TAR`,
        day,
        eventId: ev.id,
        eventType: ev.type,
        actorId: ev.instigatorId,
        targetId: target.id,
        description: ev.title,
        emotionalImpact: isNegative ? -40 : 20,
      });
    }
  }
}
