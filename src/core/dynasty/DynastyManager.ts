export interface ReignRecord {
  reignNumber: number;
  kingName: string;
  kingTitle: string;
  kingPersonality: '호학성군' | '광기폭군' | '개혁군주' | '유약군주';
  evaluationGrade: string;
  evaluationTitle: string;
  finalIntegrity: number;
  finalPeril: number;
  archiveCount: number;
  winningFaction: string;
  recordedDate: string;
}

export interface HeirloomTrait {
  id: string;
  name: string;
  hanja: string;
  description: string;
  effect: string;
  isUnlocked: boolean;
}

export interface KingProfile {
  name: string;
  templeName: string;
  personality: '호학성군' | '광기폭군' | '개혁군주' | '유약군주';
  traitDescription: string;
  startingFactionBias: 'WEST' | 'EAST' | 'NEUTRAL';
}

const HISTORICAL_KINGS: KingProfile[] = [
  {
    name: '이혈',
    templeName: '성종 (成宗)',
    personality: '호학성군',
    traitDescription: '경연(經筵)을 중시하며 유생과 삼사의 언론을 적극 장려함. 사관의 직필을 온전히 존중하는 명군.',
    startingFactionBias: 'NEUTRAL',
  },
  {
    name: '이융',
    templeName: '연산군 (燕山君)',
    personality: '광기폭군',
    traitDescription: '신하들의 간언을 혐오하고 사초 밀람을 시도함. 사화(士禍)의 위험이 극도로 높아지는 위험한 군주.',
    startingFactionBias: 'WEST',
  },
  {
    name: '이역',
    templeName: '중종 (中宗)',
    personality: '유약군주',
    traitDescription: '훈구 공신들의 위세에 눌려 결단을 내리지 못함. 조정 대신들의 당파 싸움과 권력 암투가 극에 달함.',
    startingFactionBias: 'EAST',
  },
  {
    name: '이환',
    templeName: '명종 (明宗)',
    personality: '개혁군주',
    traitDescription: '외척 세도정치를 타파하고자 신진 사림을 비밀리에 등용함. 은밀한 밀지와 충신의 상소가 빗발침.',
    startingFactionBias: 'NEUTRAL',
  },
  {
    name: '이연',
    templeName: '선조 (宣祖)',
    personality: '호학성군',
    traitDescription: '동인과 서인의 동서분당(東西分黨) 속에 신하들의 충성심을 끊임없이 저울질하는 의심 많은 군주.',
    startingFactionBias: 'EAST',
  },
  {
    name: '이혼',
    templeName: '광해군 (光海君)',
    personality: '개혁군주',
    traitDescription: '실리와 국방을 중시하나 붕당의 역모 고변에 극도로 민감함. 북인의 세도와 옥사가 빈번히 일어남.',
    startingFactionBias: 'WEST',
  },
];

export const ALL_HEIRLOOMS: HeirloomTrait[] = [
  {
    id: 'RIGHTEOUS_FAMILY_LEGACY',
    name: '직필의 가풍',
    hanja: '萬古家風',
    description: '선대 사관이 목숨을 걸고 만고직필을 지켜낸 가문의 드높은 절개입니다.',
    effect: '사관 시작 신념 +15, 첫 번째 암살/협박 위기 시 사화 회피 확률 대폭 증가.',
    isUnlocked: false,
  },
  {
    id: 'MERCHANT_ANCESTRY',
    name: '거상의 후예',
    hanja: '巨商後代',
    description: '선대 사관이 가문의 재력을 축적하여 궁중 승정원과 내관 사이에 은밀한 자금줄을 마련했습니다.',
    effect: '가문 시작 자금 +80냥, 관원들의 비밀 기류 첩보를 사전에 파악 가능.',
    isUnlocked: false,
  },
  {
    id: 'SECRET_ARCHIVE_KEY',
    name: '비전 사고의 열쇠',
    hanja: '秘傳史庫',
    description: '선대 사관들이 대대로 숨겨온 궁중 비망록과 사가사초(私家史草) 비밀 서고의 열쇠입니다.',
    effect: '시작부터 궐내 백관들의 숨겨진 비리와 약점을 1건 즉시 열람 가능.',
    isUnlocked: false,
  },
  {
    id: 'DIPLOMATIC_INTRIGUE',
    name: '환국 조율의 붓',
    hanja: '換局調筆',
    description: '붕당 간의 피 튀기는 정쟁 속에서도 가문을 온전히 보전해 낸 처세의 극의입니다.',
    effect: '사화 위기 게이지 증가량 20% 감소, 탄핵 나비효과 증폭.',
    isUnlocked: false,
  },
];

const STORAGE_KEY = 'sacho_dynasty_v1';

export class DynastyManager {
  private generation: number = 1;
  private currentKingIndex: number = 0;
  private pastReigns: ReignRecord[] = [];
  private unlockedHeirloomIds: Set<string> = new Set();

  constructor() {
    this.loadState();
  }

  public getGeneration(): number {
    return this.generation;
  }

  public getCurrentKing(): KingProfile {
    return HISTORICAL_KINGS[this.currentKingIndex % HISTORICAL_KINGS.length];
  }

  public getPastReigns(): ReignRecord[] {
    return [...this.pastReigns];
  }

  public getHeirlooms(): HeirloomTrait[] {
    return ALL_HEIRLOOMS.map((h) => ({
      ...h,
      isUnlocked: this.unlockedHeirloomIds.has(h.id),
    }));
  }

  public isHeirloomUnlocked(id: string): boolean {
    return this.unlockedHeirloomIds.has(id);
  }

  /**
   * 실록 편찬 완료 시 당대 왕조 기록 저장 및 차대 가문 계승 업적 해금
   */
  public recordReignEnd(
    evaluationGrade: string,
    evaluationTitle: string,
    finalIntegrity: number,
    finalPeril: number,
    archiveCount: number,
    wealth: number,
    winningFaction: string
  ): { newlyUnlockedHeirlooms: HeirloomTrait[] } {
    const currentKing = this.getCurrentKing();
    const newRecord: ReignRecord = {
      reignNumber: this.generation,
      kingName: currentKing.templeName,
      kingTitle: `조선 ${this.generation}대 치세 · ${currentKing.templeName}`,
      kingPersonality: currentKing.personality,
      evaluationGrade,
      evaluationTitle,
      finalIntegrity,
      finalPeril,
      archiveCount,
      winningFaction,
      recordedDate: new Date().toLocaleDateString('ko-KR'),
    };

    this.pastReigns.push(newRecord);

    const newlyUnlocked: HeirloomTrait[] = [];

    // 해금 조건 검사
    if ((evaluationGrade === 'S' || finalIntegrity >= 80) && !this.unlockedHeirloomIds.has('RIGHTEOUS_FAMILY_LEGACY')) {
      this.unlockedHeirloomIds.add('RIGHTEOUS_FAMILY_LEGACY');
      newlyUnlocked.push(ALL_HEIRLOOMS.find((h) => h.id === 'RIGHTEOUS_FAMILY_LEGACY')!);
    }

    if (wealth >= 100 && !this.unlockedHeirloomIds.has('MERCHANT_ANCESTRY')) {
      this.unlockedHeirloomIds.add('MERCHANT_ANCESTRY');
      newlyUnlocked.push(ALL_HEIRLOOMS.find((h) => h.id === 'MERCHANT_ANCESTRY')!);
    }

    if (archiveCount >= 2 && !this.unlockedHeirloomIds.has('SECRET_ARCHIVE_KEY')) {
      this.unlockedHeirloomIds.add('SECRET_ARCHIVE_KEY');
      newlyUnlocked.push(ALL_HEIRLOOMS.find((h) => h.id === 'SECRET_ARCHIVE_KEY')!);
    }

    if (this.generation >= 2 && !this.unlockedHeirloomIds.has('DIPLOMATIC_INTRIGUE')) {
      this.unlockedHeirloomIds.add('DIPLOMATIC_INTRIGUE');
      newlyUnlocked.push(ALL_HEIRLOOMS.find((h) => h.id === 'DIPLOMATIC_INTRIGUE')!);
    }

    this.saveState();
    return { newlyUnlockedHeirlooms: newlyUnlocked };
  }

  /**
   * 차대 신왕 즉위 및 가문 차기 사관 계승
   */
  public advanceToNextReign(): KingProfile {
    this.generation += 1;
    this.currentKingIndex += 1;
    this.saveState();
    return this.getCurrentKing();
  }

  /**
   * 가문 유산 보너스를 사관 초기 스탯에 적용
   */
  public getStartingBonusStats(): { bonusIntegrity: number; bonusPeril: number; bonusWealth: number } {
    let bonusIntegrity = 0;
    let bonusPeril = 0;
    let bonusWealth = 0;

    if (this.unlockedHeirloomIds.has('RIGHTEOUS_FAMILY_LEGACY')) {
      bonusIntegrity += 15;
    }
    if (this.unlockedHeirloomIds.has('MERCHANT_ANCESTRY')) {
      bonusWealth += 80;
    }
    if (this.unlockedHeirloomIds.has('DIPLOMATIC_INTRIGUE')) {
      bonusPeril -= 5;
    }

    return { bonusIntegrity, bonusPeril, bonusWealth };
  }

  public resetAllProgress(): void {
    this.generation = 1;
    this.currentKingIndex = 0;
    this.pastReigns = [];
    this.unlockedHeirloomIds.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }

  private loadState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.generation === 'number') {
            this.generation = parsed.generation;
            this.currentKingIndex = parsed.currentKingIndex || 0;
            this.pastReigns = Array.isArray(parsed.pastReigns) ? parsed.pastReigns : [];
            this.unlockedHeirloomIds = new Set(Array.isArray(parsed.unlockedHeirloomIds) ? parsed.unlockedHeirloomIds : []);
          }
        }
      }
    } catch {
      // Fallback to default
    }
  }

  private saveState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload = {
          generation: this.generation,
          currentKingIndex: this.currentKingIndex,
          pastReigns: this.pastReigns,
          unlockedHeirloomIds: Array.from(this.unlockedHeirloomIds),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {
      // ignore
    }
  }
}
