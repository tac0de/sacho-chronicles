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
import { SilokEvaluator, type SilokEvaluationResult } from '../records/SilokEvaluator.js';
import type { LocationId } from '../../data/locations.js';
import { NightDilemmaEngine, type NightDilemma, type ButterflyTrigger } from '../dilemma/NightDilemmaEngine.js';
import { DynastyManager } from '../dynasty/DynastyManager.js';
import { SilokCodec } from '../sharing/SilokCodec.js';

export interface PendingSachoChoice {
  infoId: string;
  recordIt: boolean;
  certainty: RecordCertainty;
}

export interface ScribeStats {
  integrity: number; // 직필 신념 (0~100)
  peril: number;     // 사화 위기 (0~100)
  wealth: number;    // 가문 재력 (냥)
  secretArchive: Array<{
    day: number;
    title: string;
    content: string;
  }>;
}

export interface MorningBulletin {
  day: number;
  headline: string;
  detail: string;
  type: string;
}

export interface RoyalInquisition {
  day: number;
  title: string;
  description: string;
  instigatorName: string;
  choices: Array<{
    id: 'CONFRONT' | 'INFORM' | 'ABDICATE';
    label: string;
    desc: string;
  }>;
}

export class Engine {
  public seed: number;
  public random: Random;
  public isDailyChallenge: boolean = false;
  public currentInquisition: RoyalInquisition | null = null;
  public familySonInOffice: string | null = null;
  public timeManager: TimeManager;
  public dynastyManager: DynastyManager;
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
  public dailyLocationOmens: Map<LocationId, string> = new Map();

  // New Core Systems State
  public scribeStats: ScribeStats = {
    integrity: 75,
    peril: 15,
    wealth: 20,
    secretArchive: [],
  };
  public currentDilemma: NightDilemma | null = null;
  public pendingButterflies: ButterflyTrigger[] = [];
  public butterflyHistory: ButterflyTrigger[] = [];
  public latestMorningBulletin: MorningBulletin | null = null;

  constructor(seed: number | string = 1024) {
    this.seed = typeof seed === 'number' ? seed : 1024;
    this.random = new Random(seed);
    this.timeManager = new TimeManager(1);
    this.dynastyManager = new DynastyManager();
    this.factRegistry = new WorldFactRegistry();
    this.infoNetwork = new InfoNetwork();
    this.eventGenerator = new EventGenerator();
    this.sachoBook = new SachoBook();

    this.initWorld(seed);
  }

  public initWorld(seed: number | string, inheritDynasty: boolean = false): void {
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
    this.dailyLocationOmens.clear();

    const bonuses = inheritDynasty ? this.dynastyManager.getStartingBonusStats() : { bonusIntegrity: 0, bonusPeril: 0, bonusWealth: 0 };
    this.scribeStats = {
      integrity: Math.max(10, Math.min(100, 75 + bonuses.bonusIntegrity)),
      peril: Math.max(0, Math.min(100, 15 + bonuses.bonusPeril)),
      wealth: Math.max(10, 20 + bonuses.bonusWealth),
      secretArchive: [],
    };
    this.currentDilemma = null;
    this.pendingButterflies = [];
    this.butterflyHistory = [];
    this.latestMorningBulletin = null;

    const initResult: AgentInitializationResult = AgentFactory.createAll(this.random);
    this.agents = initResult.agents;
    this.agentMap = initResult.agentMap;
    this.relationships = initResult.relationshipManager;

    this.generateDailyOmens();
    this.simulationLogs.push(`[System] 세계가 초기화되었습니다. (Seed: ${this.random.getSeed()}, 국왕: ${this.dynastyManager.getCurrentKing().templeName})`);
  }

  /**
   * 매일 아침 5대 처소의 기류 징후(Omen/Tell) 생성
   */
  public generateDailyOmens(): void {
    this.dailyLocationOmens.clear();

    // 관원들의 상태 및 관계에 따라 기류 결정
    const troubledCount = this.agents.filter((a) => a.currentStatus.includes('위기') || a.currentStatus.includes('근신')).length;
    const schemerCount = this.agents.filter((a) => a.ambition >= 80).length;

    // 사정전 (편전)
    if (troubledCount > 0) {
      this.dailyLocationOmens.set('ROYAL_HALL', '어전 쪽으로 조참 대신들의 낯빛이 굳어있고 무거운 긴장감이 흐른다.');
    } else {
      this.dailyLocationOmens.set('ROYAL_HALL', '유학관들의 잔잔한 경서 강독 소리와 조정 대신들의 입조가 이어진다.');
    }

    // 은대 (승정원)
    if (this.random.chance(0.5)) {
      this.dailyLocationOmens.set('ROYAL_SECRETARIAT', '승정원 문간으로 서리와 내관들이 긴박하게 공문서 궤짝을 나르고 있다.');
    } else {
      this.dailyLocationOmens.set('ROYAL_SECRETARIAT', '도승지가 조용히 어제 내린 교지를 정서하며 붓을 말리고 있다.');
    }

    // 백부 (사헌부)
    if (schemerCount > 2 || troubledCount > 0) {
      this.dailyLocationOmens.set('OFFICE_OF_INSPECTOR', '사헌부 감찰관들이 굳은 표정으로 백관들의 혐의 장부를 대조하고 있다.');
    } else {
      this.dailyLocationOmens.set('OFFICE_OF_INSPECTOR', '풍헌 청사 앞뜰에 잣나무 잎만 스칠 뿐 드나드는 발길이 뜸하다.');
    }

    // 미원 (사간원)
    if (this.random.chance(0.6)) {
      this.dailyLocationOmens.set('OFFICE_OF_CENSORS', '사간원 창호지 문 너머로 간관들의 격앙된 연명 차자(箚子) 논의가 들린다.');
    } else {
      this.dailyLocationOmens.set('OFFICE_OF_CENSORS', '간관들이 경연 준비를 위해 성리학 주석서를 조용히 열람하고 있다.');
    }

    // 궐내 천랑 (회랑)
    if (schemerCount > 0 || this.random.chance(0.5)) {
      this.dailyLocationOmens.set('PALACE_CORRIDOR', '회랑 후미진 기둥 그늘 뒤로 갓을 깊이 눌러쓴 인영들이 귓속말을 나눈다.');
    } else {
      this.dailyLocationOmens.set('PALACE_CORRIDOR', '순라군들의 규칙적인 발걸음 소리만이 긴 행랑에 울려 퍼진다.');
    }
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
   * 6 & 7. 사초 기록 완료 및 심야의 내방 단계로 전환
   */
  public commitSacho(choices: PendingSachoChoice[]): void {
    if (this.timeManager.currentPhase !== 'OBSERVATION_RECORD') return;

    const day = this.timeManager.currentDay;
    const todayRecords: SachoRecord[] = [];

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
      todayRecords.push(record);
    }

    // 심야 내방자 및 딜레마 생성
    this.currentDilemma = NightDilemmaEngine.generateDilemma(this, todayRecords);
    this.timeManager.setPhase('NIGHT_VISITATION');
    this.simulationLogs.push(`[Day ${day} 야간] 심야의 내방자 [${this.currentDilemma.visitorName}]이(가) 침소에 당도함.`);
  }

  /**
   * 심야 내방자의 뇌물/겁박/밀명에 대한 사관의 결단
   */
  public resolveNightChoice(choiceId: string): void {
    if (!this.currentDilemma) {
      this.timeManager.setPhase('DAY_COMPLETED');
      return;
    }

    const choice = this.currentDilemma.choices.find((c) => c.id === choiceId) || this.currentDilemma.choices[0];
    if (!choice) {
      this.timeManager.setPhase('DAY_COMPLETED');
      return;
    }

    // 스탯 반영 (0 ~ 100 범위 제한)
    this.scribeStats.integrity = Math.max(0, Math.min(100, this.scribeStats.integrity + choice.integrityDelta));
    this.scribeStats.peril = Math.max(0, Math.min(100, this.scribeStats.peril + choice.perilDelta));
    this.scribeStats.wealth = Math.max(0, this.scribeStats.wealth + choice.wealthDelta);

    // 사가 비밀 사초 은닉
    if (choice.secretArchiveEntry) {
      this.scribeStats.secretArchive.push({
        day: this.timeManager.currentDay,
        title: choice.secretArchiveEntry.title,
        content: choice.secretArchiveEntry.content,
      });
    }

    // 나비효과 트리거 예약
    if (choice.butterflyTrigger) {
      this.pendingButterflies.push(choice.butterflyTrigger);
      this.butterflyHistory.push(choice.butterflyTrigger);
    }

    this.simulationLogs.push(
      `[Day ${this.timeManager.currentDay} 심야 결단] "${choice.label}" 선택 (직필: ${this.scribeStats.integrity}, 위기: ${this.scribeStats.peril}%)`
    );

    this.timeManager.setPhase('DAY_COMPLETED');
  }

  /**
   * 다음 날로 이동 및 나비효과 정치적 파장 실시간 집행
   */
  public proceedToNextDay(): number {
    if (this.timeManager.currentPhase === 'NIGHT_VISITATION') {
      const fallback = this.currentDilemma?.choices[0]?.id || '';
      this.resolveNightChoice(fallback);
    } else if (this.timeManager.currentPhase === 'OBSERVATION_RECORD') {
      this.commitSacho([]);
      if (this.currentDilemma) {
        this.resolveNightChoice(this.currentDilemma.choices[0]?.id || '');
      }
    }

    const dayJustFinished = this.timeManager.currentDay;

    // 나비효과 집행 및 여명 조보 발행
    this.latestMorningBulletin = null;
    if (this.pendingButterflies.length > 0) {
      const primaryTrigger = this.pendingButterflies[0];

      for (const trigger of this.pendingButterflies) {
        const ag = this.agentMap.get(trigger.targetId);
        if (ag) {
          ag.politicalPower = Math.max(5, Math.min(100, ag.politicalPower + trigger.powerDelta));
          if (trigger.type === 'IMPEACHMENT') {
            ag.currentStatus = '사헌부 탄핵 심문';
          } else if (trigger.type === 'COVERUP_EXPOSED') {
            ag.currentStatus = '어전 국문 피의자';
          } else if (trigger.type === 'FACTION_PURGE') {
            ag.currentStatus = '사화 파직 위기';
          } else if (trigger.type === 'ROYAL_PRAISE') {
            ag.currentStatus = '국왕 친전 포상';
          }
        }

        const butterflyEvent: PoliticalEvent = {
          id: `BUTTERFLY_${dayJustFinished + 1}_${trigger.targetId}`,
          day: dayJustFinished + 1,
          type: trigger.type === 'IMPEACHMENT' ? 'IMPEACHMENT' : 'ROYAL_REPRIMAND',
          locationId: 'ROYAL_HALL',
          instigatorId: trigger.instigatorId || 'scribe',
          targetId: trigger.targetId,
          title: trigger.newsHeadline,
          summary: trigger.newsDetail,
          causationReason: `[사관의 사초 및 심야 결단] ${trigger.reason}`,
          generatedInfoIds: [],
          relationChanges: [],
        };
        this.allEventsHistory.push(butterflyEvent);
      }

      this.latestMorningBulletin = {
        day: dayJustFinished + 1,
        headline: primaryTrigger.newsHeadline,
        detail: primaryTrigger.newsDetail,
        type: primaryTrigger.type,
      };

      this.pendingButterflies = [];
    }

    const nextDay = this.timeManager.advanceToNextDay();
    this.generateDailyOmens();

    // 사화 위기 80% 이상 시 의금부 어전 국문 특별 이벤트 발동
    if (this.scribeStats.peril >= 80 && !this.currentInquisition) {
      const hostileAgent = this.agents.find((a) => a.politicalPower >= 60) || this.agents[0];
      this.currentInquisition = {
        day: nextDay,
        title: '의금부 압송 및 어전 국문 (義禁府 鞠問)',
        description: `사화 위기가 극에 달해 의금부 나졸들이 춘추관을 급습하였습니다! ${hostileAgent ? hostileAgent.name : '훈구 권신'}이 사관을 대역부도한 사초 밀람의 죄로 고발하며 왕 앞에서 친국을 청했습니다.`,
        instigatorName: hostileAgent ? hostileAgent.name : '권신',
        choices: [
          {
            id: 'CONFRONT',
            label: '만고직필(萬古直筆)로 어전에서 당당히 항변한다',
            desc: '직필 신념이 70 이상이면 국왕이 감복하여 사화 위기가 -50% 대폭 진화됩니다.',
          },
          {
            id: 'INFORM',
            label: '정적의 이름을 대며 역모 모함으로 위기를 모면한다',
            desc: '사화 위기가 -60% 급감하나, 직필 신념이 -25 깎입니다.',
          },
          {
            id: 'ABDICATE',
            label: '스스로 붓을 꺾고 자복하여 벌금과 사직으로 목숨을 건진다',
            desc: '가문 재력 40냥을 몰수당하지만, 사화 위기가 15%로 안정화됩니다.',
          },
        ],
      };
    }

    return nextDay;
  }

  public static getTodayDateSeed(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  public startDailyChallenge(): void {
    const todaySeed = Engine.getTodayDateSeed();
    this.initWorld(todaySeed);
    this.isDailyChallenge = true;
  }

  public resolveInquisition(choiceId: 'CONFRONT' | 'INFORM' | 'ABDICATE'): { survived: boolean; summary: string } {
    if (!this.currentInquisition) {
      return { survived: true, summary: '국문이 종료되었습니다.' };
    }

    if (choiceId === 'CONFRONT') {
      if (this.scribeStats.integrity >= 70) {
        this.scribeStats.peril = Math.max(10, this.scribeStats.peril - 50);
        this.scribeStats.integrity = Math.min(100, this.scribeStats.integrity + 15);
        this.currentInquisition = null;
        return {
          survived: true,
          summary: '국왕이 사관의 흔들리지 않는 춘추직필에 감복하여 "과인의 눈과 귀를 흐린 자들을 벌하라" 명하고 국문을 파하였습니다! (사화 위기 -50%, 직필 신념 +15)',
        };
      } else {
        this.scribeStats.peril = 40;
        this.scribeStats.integrity = Math.max(10, this.scribeStats.integrity - 20);
        this.scribeStats.wealth = Math.max(0, this.scribeStats.wealth - 30);
        this.currentInquisition = null;
        return {
          survived: true,
          summary: '직필의 기개가 부족하여 권신들의 맹공을 이기지 못하고 변방으로 좌천될 뻔하였습니다. (가문 재력 -30냥, 신념 -20, 위기 40% 조정)',
        };
      }
    } else if (choiceId === 'INFORM') {
      this.scribeStats.peril = Math.max(10, this.scribeStats.peril - 60);
      this.scribeStats.integrity = Math.max(10, this.scribeStats.integrity - 25);
      this.currentInquisition = null;
      return {
        survived: true,
        summary: '어전에서 특정 정적의 이름을 고변하여 참화를 피했습니다. 대신 한 명이 파직되었으나, 사관의 명예에 씻을 수 없는 흠결을 남겼습니다. (사화 위기 -60%, 신념 -25)',
      };
    } else {
      this.scribeStats.peril = 15;
      this.scribeStats.wealth = Math.max(0, this.scribeStats.wealth - 40);
      this.currentInquisition = null;
      return {
        survived: true,
        summary: '소신이 미혹하여 헛소문을 적었다며 스스로 붓을 꺾고 벌금을 바쳤습니다. 목숨은 건졌으나 가문 재산이 몰수되었습니다. (위기 15%로 진화, 재력 -40냥)',
      };
    }
  }

  public sponsorSonForOffice(): { success: boolean; message: string; sonAgentName?: string } {
    if (this.familySonInOffice) {
      return { success: false, message: `이미 사관 가문의 자제 [${this.familySonInOffice}]가 입조하여 집무 중입니다.` };
    }
    if (this.scribeStats.wealth < 60) {
      return { success: false, message: '가문 자제를 과거에 천거하고 훈도하려면 최소 60냥의 재력이 필요합니다.' };
    }

    this.scribeStats.wealth -= 60;
    const sonName = '김후(사관의 자제)';
    this.familySonInOffice = sonName;

    const targetAgent = this.agents.find((a) => a.positionId === 'COURT_CLERK' || a.positionId === 'ACADEMY_DRAFTER') || this.agents[this.agents.length - 1];
    if (targetAgent) {
      targetAgent.name = `김후(사관의 자제)`;
      targetAgent.duty = 95;
      targetAgent.loyalty = 90;
      targetAgent.honesty = 90;
      targetAgent.goal = {
        type: 'MAINTAIN_STABILITY',
        targetAgentId: 'scribe',
        priority: 10,
        description: '사관 아버지를 보필하여 춘추관의 직필을 지키고 가문을 보전함',
      };
    }

    return {
      success: true,
      message: '사관 가문의 장자 [김후]가 문과에 장원급제하여 승정원 주서로 입조하였습니다! (가문 재력 -60냥)',
      sonAgentName: sonName,
    };
  }

  /**
   * N일 자동 진행 (디버그 및 창발적 갈등 검증용)
   */
  public runAutoDays(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.timeManager.currentPhase === 'LOCATION_SELECTION') {
        const locs: LocationId[] = ['ROYAL_HALL', 'ROYAL_SECRETARIAT', 'OFFICE_OF_INSPECTOR', 'OFFICE_OF_CENSORS', 'PALACE_CORRIDOR'];
        this.playerLocation = this.random.pick(locs);
        this.executeDay();
      }
      if (this.timeManager.currentPhase === 'OBSERVATION_RECORD') {
        const choices: PendingSachoChoice[] = this.dailyObservedInfo.map((info) => ({
          infoId: info.id,
          recordIt: this.random.chance(0.7),
          certainty: this.random.pick<RecordCertainty>(['CAUTIOUS', 'MODERATE', 'ASSERTIVE']),
        }));
        this.commitSacho(choices);
      }
      if (this.timeManager.currentPhase === 'NIGHT_VISITATION') {
        const choice = this.currentDilemma?.choices[0];
        if (choice) {
          this.resolveNightChoice(choice.id);
        } else {
          this.timeManager.setPhase('DAY_COMPLETED');
        }
      }
      if (this.timeManager.currentPhase === 'DAY_COMPLETED') {
        this.proceedToNextDay();
      }
    }
  }

  /**
   * 실록 편찬 및 평가 실행
   */
  public compileSilok() {
    return SilokEvaluator.evaluate(
      this.sachoBook.getAll(),
      this.factRegistry.getAll(),
      this.agents,
      this.allEventsHistory
    );
  }

  /**
   * 노백엔드 URL 공유용 압축 해시 생성
   */
  public getShareableSilokUrl(): string {
    const evaluation = this.compileSilok();
    const currentKing = this.dynastyManager.getCurrentKing();
    const shareData = {
      version: 1,
      seed: this.seed,
      day: this.timeManager.currentDay,
      generation: this.dynastyManager.getGeneration(),
      kingName: currentKing.templeName,
      scribeStats: {
        integrity: this.scribeStats.integrity,
        peril: this.scribeStats.peril,
        wealth: this.scribeStats.wealth,
      },
      records: this.sachoBook.getAll().map((r) => ({
        day: r.day,
        subjectName: r.subjectName,
        certainty: r.certainty,
        statement: r.statement,
        witnessType: r.witnessType,
      })),
      secretArchive: this.scribeStats.secretArchive,
      butterflies: this.butterflyHistory.map((b) => ({
        day: this.timeManager.currentDay,
        headline: b.newsHeadline,
        detail: b.newsDetail,
      })),
      evaluation: {
        grade: evaluation.grade,
        title: evaluation.title,
        score: evaluation.score,
        summary: evaluation.evaluationSummary,
      },
    };

    const encoded = SilokCodec.encode(shareData);
    if (typeof window !== 'undefined') {
      const base = window.location.href.split('#')[0];
      return `${base}#silok=${encoded}`;
    }
    return `#silok=${encoded}`;
  }

  /**
   * 신왕 즉위 및 가문 차대 사관 계승 (무한 로그라이트 500년 루프)
   */
  public startNewDynastyReign(): void {
    const evaluation = this.compileSilok();
    const westCount = this.agents.filter((a) => a.faction === 'WEST' && a.politicalPower >= 50).length;
    const eastCount = this.agents.filter((a) => a.faction === 'EAST' && a.politicalPower >= 50).length;
    const winningFaction = westCount >= eastCount ? '서인(西人)' : '동인(東人)';

    this.dynastyManager.recordReignEnd(
      evaluation.grade,
      evaluation.title,
      this.scribeStats.integrity,
      this.scribeStats.peril,
      this.scribeStats.secretArchive.length,
      this.scribeStats.wealth,
      winningFaction
    );

    this.dynastyManager.advanceToNextReign();
    this.initWorld(this.random.nextInt(10000, 99999), true);
  }

  /**
   * 디버그용 전체 스냅샷 반환
   */
  public getDebugSnapshot() {
    return {
      currentDay: this.timeManager.currentDay,
      currentPhase: this.timeManager.currentPhase,
      seed: this.random.getSeed(),
      generation: this.dynastyManager.getGeneration(),
      king: this.dynastyManager.getCurrentKing().templeName,
      scribeStats: this.scribeStats,
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
