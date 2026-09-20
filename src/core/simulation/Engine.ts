import { Random } from './Random.js';
import { TimeManager } from './TimeManager.js';
import { AgentFactory, type AgentInitializationResult } from '../agents/AgentFactory.js';
import type { Agent } from '../agents/Agent.js';
import type { RelationshipManager } from '../agents/Relationship.js';
import { WorldFactRegistry } from '../information/WorldFact.js';
import { InfoNetwork } from '../information/InfoNetwork.js';
import type { Information } from '../information/Information.js';
import { EventGenerator } from '../events/EventGenerator.js';
import type { PoliticalEvent } from '../events/PoliticalEvent.js';
import { SachoBook } from '../records/SachoBook.js';
import type { SachoRecord, RecordCertainty } from '../records/SachoRecord.js';
import type { LocationId } from '../../data/locations.js';

export interface PendingSachoChoice {
  infoId: string;
  recordIt: boolean;
  certainty: RecordCertainty;
}

export class Engine {
  public seed: number;
  public random: Random;
  public timeManager: TimeManager;
  public agents: Agent[] = [];
  public agentMap: Map<string, Agent> = new Map();
  public relationships!: RelationshipManager;
  public factRegistry: WorldFactRegistry;
  public infoNetwork: InfoNetwork;
  public eventGenerator: EventGenerator;
  public sachoBook: SachoBook;

  public playerLocation: LocationId = 'ROYAL_HALL';
  public dailyEvents: PoliticalEvent[] = [];
  public allEventsHistory: PoliticalEvent[] = [];
  public dailyObservedInfo: Information[] = [];
  public simulationLogs: string[] = [];

  constructor(seed: number | string = 1024) {
    this.seed = typeof seed === 'number' ? seed : 1024;
    this.random = new Random(seed);
    this.timeManager = new TimeManager(1);
    this.factRegistry = new WorldFactRegistry();
    this.infoNetwork = new InfoNetwork();
    this.eventGenerator = new EventGenerator();
    this.sachoBook = new SachoBook();

    this.initWorld(seed);
  }

  public initWorld(seed: number | string): void {
    this.seed = typeof seed === 'number' ? seed : 1024;
    this.random = new Random(seed);
    this.timeManager.reset(1);
    this.factRegistry = new WorldFactRegistry();
    this.infoNetwork = new InfoNetwork();
    this.sachoBook = new SachoBook();
    this.dailyEvents = [];
    this.allEventsHistory = [];
    this.dailyObservedInfo = [];
    this.simulationLogs = [];
    this.playerLocation = 'ROYAL_HALL';

    const initResult: AgentInitializationResult = AgentFactory.createAll(this.random);
    this.agents = initResult.agents;
    this.agentMap = initResult.agentMap;
    this.relationships = initResult.relationshipManager;

    this.simulationLogs.push(`[System] 세계가 초기화되었습니다. (Seed: ${this.random.getSeed()})`);
  }

  public setPlayerLocation(loc: LocationId): void {
    if (this.timeManager.currentPhase !== 'LOCATION_SELECTION') return;
    this.playerLocation = loc;
  }

  /**
   * 하루 턴 시뮬레이션 실행 (단계 1 ~ 5)
   * 1. 세계 시뮬레이션
   * 2. NPC 행동 결정
   * 3. 사건 발생
   * 4. 정보 전파
   * 5. 플레이어 관찰
   */
  public executeDay(): void {
    if (this.timeManager.currentPhase !== 'LOCATION_SELECTION') return;

    const day = this.timeManager.currentDay;
    this.infoNetwork.resetDailyLocations();

    // 1. 세계 시뮬레이션 (원한 미세 감쇠 등)
    for (const a of this.agents) {
      a.decayGrudges(0.95);
    }

    // 2 & 3. 인과적 사건 발생
    this.dailyEvents = this.eventGenerator.generateDailyEvents(
      day,
      this.agents,
      this.agentMap,
      this.relationships,
      this.factRegistry,
      this.infoNetwork,
      this.random,
      this.simulationLogs
    );
    this.allEventsHistory.push(...this.dailyEvents);

    // 4. 정보 전파 시뮬레이션
    // 각 사건에 연결된 정보를 목격한 인물들이 동맹이나 정보상(서리/내관)에게 흘림
    this.simulateInformationSpread(day);

    // 5. 플레이어 관찰 (선택한 장소에 도달한 정보만 획득)
    this.dailyObservedInfo = this.infoNetwork.getDailyInfoAtLocation(this.playerLocation);

    this.simulationLogs.push(
      `[Day ${day}] 사관이 [${this.playerLocation}]에서 ${this.dailyObservedInfo.length}건의 정보를 관찰함 (전체 발생 사건: ${this.dailyEvents.length}건)`
    );

    // 페이즈를 사초 집필 단계로 전환
    this.timeManager.setPhase('OBSERVATION_RECORD');
  }

  /**
   * 정보 전파 시뮬레이션
   */
  private simulateInformationSpread(day: number): void {
    const dailyInfo = this.infoNetwork.getAll().filter((info) => info.day === day && info.hopCount === 0);

    for (const info of dailyInfo) {
      const creator = this.agentMap.get(info.originalCreatorId);
      if (!creator) continue;

      // 발언자와 친한 인물(관계 > 20) 또는 서리/내관에게 정보가 흘러감
      const targets = this.agents.filter(
        (b) => b.id !== creator.id && (this.relationships.getRelation(creator.id, b.id) >= 20 || b.id === 'court_clerk' || b.id === 'royal_eunuch')
      );

      for (const target of targets) {
        if (this.random.chance(0.5)) {
          // 전파될 장소 결정 (전달자의 주 활동 장소)
          const targetLoc: LocationId =
            target.id === 'court_clerk'
              ? 'ROYAL_SECRETARIAT'
              : target.id === 'royal_eunuch'
              ? 'PALACE_CORRIDOR'
              : target.positionId === 'INSPECTOR_GENERAL'
              ? 'OFFICE_OF_INSPECTOR'
              : target.positionId === 'CENSOR_GENERAL'
              ? 'OFFICE_OF_CENSORS'
              : 'PALACE_CORRIDOR';

          this.infoNetwork.propagateInformation(info, creator, target, targetLoc, this.relationships, this.random, day);
        }
      }
    }
  }

  /**
   * 6 & 7. 사초 기록 완료 및 다음 날 전환 준비
   */
  public commitSacho(choices: PendingSachoChoice[]): void {
    if (this.timeManager.currentPhase !== 'OBSERVATION_RECORD') return;

    const day = this.timeManager.currentDay;

    for (const choice of choices) {
      if (!choice.recordIt) continue; // 기록하지 않음 선택

      const info = this.infoNetwork.get(choice.infoId);
      if (!info) continue;

      const subject = this.agentMap.get(info.subjectId);
      let statement = info.expressionOptions.cautious;
      if (choice.certainty === 'MODERATE') {
        statement = info.expressionOptions.moderate;
      } else if (choice.certainty === 'ASSERTIVE') {
        statement = info.expressionOptions.assertive;
      }

      const record: SachoRecord = {
        id: `SACHO_${day}_${this.random.nextInt(1000, 9999)}`,
        day,
        subjectId: info.subjectId,
        subjectName: subject ? subject.name : '미상',
        subjectTitle: subject ? subject.positionTitle : '관원',
        statement,
        certainty: choice.certainty,
        sourceInformationIds: [info.id],
        witnessType: info.witnessType,
        locationId: this.playerLocation,
        createdAtDay: day,
      };

      this.sachoBook.addRecord(record);
    }

    this.timeManager.setPhase('DAY_COMPLETED');
  }

  /**
   * 다음 날로 이동
   */
  public proceedToNextDay(): number {
    if (this.timeManager.currentPhase !== 'DAY_COMPLETED') {
      // 기록 단계에서 기록 없이 그냥 넘길 경우 자동 처리
      if (this.timeManager.currentPhase === 'OBSERVATION_RECORD') {
        this.commitSacho([]);
      }
    }
    const nextDay = this.timeManager.advanceToNextDay();
    return nextDay;
  }

  /**
   * N일 자동 진행 (디버그 및 창발적 갈등 검증용)
   */
  public runAutoDays(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.timeManager.currentPhase === 'LOCATION_SELECTION') {
        // 무작위 장소 선택
        const locs: LocationId[] = ['ROYAL_HALL', 'ROYAL_SECRETARIAT', 'OFFICE_OF_INSPECTOR', 'OFFICE_OF_CENSORS', 'PALACE_CORRIDOR'];
        this.playerLocation = this.random.pick(locs);
        this.executeDay();
      }
      if (this.timeManager.currentPhase === 'OBSERVATION_RECORD') {
        // 관찰 정보 중 일부를 무작위로 사초에 기록
        const choices: PendingSachoChoice[] = this.dailyObservedInfo.map((info) => ({
          infoId: info.id,
          recordIt: this.random.chance(0.7),
          certainty: this.random.pick<RecordCertainty>(['CAUTIOUS', 'MODERATE', 'ASSERTIVE']),
        }));
        this.commitSacho(choices);
      }
      if (this.timeManager.currentPhase === 'DAY_COMPLETED') {
        this.proceedToNextDay();
      }
    }
  }

  /**
   * 디버그용 전체 스냅샷 반환
   */
  public getDebugSnapshot() {
    return {
      currentDay: this.timeManager.currentDay,
      currentPhase: this.timeManager.currentPhase,
      seed: this.random.getSeed(),
      playerLocation: this.playerLocation,
      worldFacts: this.factRegistry.getAll(),
      agents: this.agents.map((a) => a.getProfileSnapshot()),
      relationMatrix: this.relationships.dumpMatrix(this.agents.map((a) => a.id)),
      recentEvents: this.dailyEvents,
      allEventsCount: this.allEventsHistory.length,
      sachoCount: this.sachoBook.getCount(),
      simLogs: [...this.simulationLogs].reverse().slice(0, 50),
    };
  }
}
