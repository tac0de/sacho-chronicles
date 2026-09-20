import type { Information, WitnessType, DistortionType } from './Information.js';
import type { Agent } from '../agents/Agent.js';
import type { RelationshipManager } from '../agents/Relationship.js';
import type { LocationId } from '../../data/locations.js';
import type { Random } from '../simulation/Random.js';

export class InfoNetwork {
  private allInfo: Map<string, Information> = new Map();
  // locationId -> infoId list for the current day
  private dailyLocationInfo: Map<LocationId, string[]> = new Map();

  constructor() {
    this.resetDailyLocations();
  }

  public resetDailyLocations(): void {
    this.dailyLocationInfo.set('ROYAL_HALL', []);
    this.dailyLocationInfo.set('ROYAL_SECRETARIAT', []);
    this.dailyLocationInfo.set('OFFICE_OF_INSPECTOR', []);
    this.dailyLocationInfo.set('OFFICE_OF_CENSORS', []);
    this.dailyLocationInfo.set('PALACE_CORRIDOR', []);
  }

  public addInformation(info: Information): void {
    this.allInfo.set(info.id, info);
    const list = this.dailyLocationInfo.get(info.locationId) || [];
    list.push(info.id);
    this.dailyLocationInfo.set(info.locationId, list);
  }

  public get(id: string): Information | undefined {
    return this.allInfo.get(id);
  }

  public getAll(): Information[] {
    return Array.from(this.allInfo.values());
  }

  public getDailyInfoAtLocation(loc: LocationId): Information[] {
    const ids = this.dailyLocationInfo.get(loc) || [];
    return ids.map((id) => this.allInfo.get(id)!).filter(Boolean);
  }

  /**
   * 정보 전파 (A -> B로 전달될 때의 변질 및 복제)
   */
  public propagateInformation(
    originalInfo: Information,
    sender: Agent,
    receiver: Agent,
    location: LocationId,
    relManager: RelationshipManager,
    random: Random,
    day: number
  ): Information {
    const relToSubject = relManager.getRelation(sender.id, originalInfo.subjectId);
    let newDistortion: DistortionType = originalInfo.distortionType;
    let newContent = originalInfo.content;
    let newCredibility = Math.max(10, originalInfo.credibility - random.nextInt(5, 15));

    // 전달자의 정직성이 낮고, 대상에게 악감정이 있는 경우 왜곡/과장 발생
    if (sender.honesty < 45 && relToSubject < -10 && random.chance(0.6)) {
      if (originalInfo.distortionType === 'FACT') {
        newDistortion = 'EXAGGERATION';
        newContent = `[과장됨] ${sender.name}의 말: "${originalInfo.content.replace('소문', '명백한 비리')}"`;
      } else if (originalInfo.distortionType === 'EXAGGERATION') {
        newDistortion = 'INTENTIONAL_LIE';
        newContent = `[날조됨] ${sender.name}의 모함: "${originalInfo.content}뿐만 아니라 역모의 조짐까지 있다."`;
      }
    } else if (random.chance(0.2)) {
      // 일반적인 전언 과정에서의 오해 및 와전
      newDistortion = 'MISUNDERSTANDING';
      newContent = `[와전됨] ${originalInfo.content} (세부 정황이 엇갈림)`;
    }

    const nextHop = originalInfo.hopCount + 1;
    let nextWitnessType: WitnessType = 'HEARSAY';
    if (nextHop >= 2) {
      nextWitnessType = 'RUMOR';
    }

    const newId = `INFO_${day}_${random.nextInt(1000, 9999)}`;

    const propagated: Information = {
      id: newId,
      factId: originalInfo.factId,
      day,
      content: newContent,
      subjectId: originalInfo.subjectId,
      originalCreatorId: originalInfo.originalCreatorId,
      currentHolderId: receiver.id,
      witnessType: nextWitnessType,
      hopCount: nextHop,
      credibility: newCredibility,
      distortionType: newDistortion,
      locationId: location,
      expressionOptions: {
        cautious: `${originalInfo.expressionOptions.cautious} (궁중에 말이 무성하다)`,
        moderate: `${originalInfo.expressionOptions.moderate} (여러 관원이 수군거렸다)`,
        assertive: originalInfo.expressionOptions.assertive,
      },
    };

    this.addInformation(propagated);

    // 수신자의 학습 및 신뢰 판단
    const senderRel = relManager.getRelation(receiver.id, sender.id);
    receiver.learnInformation(propagated.id, propagated.credibility, senderRel);

    return propagated;
  }
}
