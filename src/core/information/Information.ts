import type { LocationId } from '../../data/locations.js';

export type WitnessType = 'DIRECT' | 'HEARSAY' | 'RUMOR';
export type DistortionType = 'FACT' | 'MISUNDERSTANDING' | 'INTENTIONAL_LIE' | 'EXAGGERATION';

export interface Information {
  id: string;
  factId?: string;                   // 연결된 실제 세계 사실(WorldFact) ID
  day: number;
  content: string;                   // 정보의 내용 요약
  subjectId: string;                 // 정보가 가리키는 대상 인물 (예: 김판서)
  originalCreatorId: string;         // 최초 발언자 / 최초 목격자
  currentHolderId: string;           // 현재 보유/전달자
  witnessType: WitnessType;          // [직접 목격] / [누구에게 들음] / [궁중 풍문]
  hopCount: number;                  // 거친 전달 단계 (0 = 현장 직접 목격)
  credibility: number;               // 신뢰도 (0 ~ 100)
  distortionType: DistortionType;    // 사실 / 오해 / 의도적 거짓말 / 과장
  locationId: LocationId;            // 정보가 획득된 장소

  // 사관이 사초에 쓸 수 있는 3단계 표현 템플릿
  expressionOptions: {
    cautious: string;                // 1. 신중한 표현: "~라는 말이 있었다", "~라는 풍문이 돌았다"
    moderate: string;                // 2. 비교적 강한 표현: "~한 정황이 포착되었다", "~한 의혹이 짙다"
    assertive: string;               // 3. 단정적 표현: "~가 명백하다", "~가 뇌물을 받았다"
  };
}
