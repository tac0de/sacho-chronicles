import type { SachoRecord } from './SachoRecord.js';
import type { WorldFact } from '../information/WorldFact.js';
import type { Agent } from '../agents/Agent.js';
import type { PoliticalEvent } from '../events/PoliticalEvent.js';

export interface OfficialVerdict {
  agentId: string;
  name: string;
  positionTitle: string;
  rank: string;
  sachoDepiction: string;     // 사초에 묘사된 이미지 (간신 / 충신 / 풍문의 대상 / 기록 없음)
  actualTruthSummary: string; // 실제 역사적 진실 (실제 비리 저지름 / 무고한 모함 피해자 / 청렴)
  verdictText: string;        // 실록 편찬 총평 (사신왈)
  accuracyScore: number;      // 0 ~ 100
}

export interface SilokEvaluationResult {
  title: string;              // 사관 칭호 (예: 만고의 직필가)
  titleHanja: string;         // 한자 칭호
  evaluationSummary: string;  // 총평
  truthRate: number;          // 직필율 (0 ~ 100)
  distortionRate: number;     // 곡필율 (0 ~ 100)
  omissionRate: number;       // 묵살율 (0 ~ 100)
  totalRecordsCount: number;  // 기록된 사초 총수
  officialVerdicts: OfficialVerdict[]; // 12인 판결문
}

export class SilokEvaluator {
  public static evaluate(
    sachoRecords: readonly SachoRecord[],
    worldFacts: readonly WorldFact[],
    agents: Agent[],
    _allEvents: PoliticalEvent[]
  ): SilokEvaluationResult {
    let directHits = 0;
    let distortions = 0;
    let omissions = 0;

    const subjectRecordMap = new Map<string, SachoRecord[]>();
    for (const rec of sachoRecords) {
      const list = subjectRecordMap.get(rec.subjectId) || [];
      list.push(rec);
      subjectRecordMap.set(rec.subjectId, list);
    }

    // WorldFact 대조 채점
    for (const fact of worldFacts) {
      const records = subjectRecordMap.get(fact.subjectId) || [];
      const matchingRec = records.find((r) => r.day === fact.day);

      if (!matchingRec) {
        // 중요한 사실인데 사초에 아예 없음
        if (fact.type === 'BRIBE_ACCEPTED' || fact.type === 'SECRET_CONSPIRACY' || fact.type === 'SLANDER_FABRICATED') {
          omissions++;
        }
      } else {
        if (fact.isActuallyGuilty) {
          // 실제로 유책인 경우: 강함/단정적 기록은 직필!
          if (matchingRec.certainty === 'ASSERTIVE' || matchingRec.certainty === 'MODERATE') {
            directHits++;
          } else {
            // 미온적이거나 묵살에 가까우면 감점
            omissions++;
          }
        } else {
          // 실제로는 결백/무고인데 단정적으로 썼다면 심각한 곡필(왜곡)!
          if (matchingRec.certainty === 'ASSERTIVE') {
            distortions += 2;
          } else if (matchingRec.certainty === 'MODERATE') {
            distortions += 1;
          } else {
            // 신중하게 기록했으면 결백한 자를 보호한 직필
            directHits++;
          }
        }
      }
    }

    const totalEvaluated = Math.max(1, directHits + distortions + omissions);
    const truthRate = Math.min(100, Math.round((directHits / totalEvaluated) * 100));
    const distortionRate = Math.min(100, Math.round((distortions / totalEvaluated) * 100));
    const omissionRate = Math.max(0, 100 - truthRate - distortionRate);

    // 사관 칭호 결정
    let title = '춘추의 양사';
    let titleHanja = '春秋良史';
    let summary = '과도한 단정을 삼가고 전언과 소문의 경계를 신중히 관조하며 균형 잡힌 필치를 지켰습니다.';

    if (truthRate >= 65 && distortionRate <= 20) {
      title = '만고의 직필가';
      titleHanja = '萬古直筆';
      summary = '권신의 으름장과 궁중의 헛소문 속에서도 예리하게 진실을 꿰뚫어 사초에 곧게 새긴 불세출의 사관입니다.';
    } else if (distortionRate >= 35) {
      title = '당여의 곡필배';
      titleHanja = '黨與曲筆';
      summary = '확인되지 않은 모함과 뜬소문에 휘둘려 무고한 이를 간신으로 몰고 역사를 어지럽힌 과오를 범했습니다.';
    } else if (omissionRate >= 50) {
      title = '보신주의 필객';
      titleHanja = '保身筆客';
      summary = '자신의 안위만을 도모하여 중대한 권력의 비리 앞에서 붓을 멈추고 침묵으로 일관한 사관입니다.';
    }

    // 12인 관원별 최종 판결문 생성
    const officialVerdicts: OfficialVerdict[] = agents.map((agent) => {
      const records = subjectRecordMap.get(agent.id) || [];
      const relatedFacts = worldFacts.filter((f) => f.subjectId === agent.id);
      const hasGuiltFact = relatedFacts.some((f) => f.isActuallyGuilty);
      const hasFabricatedFact = relatedFacts.some((f) => f.type === 'SLANDER_FABRICATED');

      let sachoDepiction = '기록 없음 (평온한 관원)';
      if (records.length > 0) {
        const hasAssertive = records.some((r) => r.certainty === 'ASSERTIVE');
        const hasModerate = records.some((r) => r.certainty === 'MODERATE');
        sachoDepiction = hasAssertive ? '죄상 단정 (간신으로 지목)' : hasModerate ? '의혹의 대상' : '풍문의 관원';
      }

      let actualTruthSummary = '무탈하고 평온하게 직무를 수행함';
      if (hasGuiltFact) {
        actualTruthSummary = '실제로 은밀한 뇌물이나 당여 결탁을 도모함';
      } else if (hasFabricatedFact) {
        actualTruthSummary = '정적들의 고의적인 모함으로 무고한 누명을 씀';
      }

      let verdictText = '';
      let accuracyScore = 70;

      if (hasGuiltFact) {
        if (records.some((r) => r.certainty === 'ASSERTIVE')) {
          verdictText = `사신(史臣)이 ${agent.name}의 숨은 비리를 낱낱이 밝혀내어 역사의 준엄한 단죄를 내렸도다.`;
          accuracyScore = 95;
        } else {
          verdictText = `${agent.name}의 은밀한 비위가 사초의 그물을 빠져나가 후대에 온전한 평가를 받지 못하였도다.`;
          accuracyScore = 40;
        }
      } else if (hasFabricatedFact) {
        if (records.some((r) => r.certainty === 'ASSERTIVE')) {
          verdictText = `사관이 날조된 헛소문에 속아 ${agent.name}에게 억울한 오명을 씌웠으니, 참으로 곡필의 한탄이로다.`;
          accuracyScore = 25;
        } else {
          verdictText = `모함의 칼날 속에서도 사관이 경솔히 단정치 않아 ${agent.name}의 억울함이 후대에 규명될 여지를 남겼도다.`;
          accuracyScore = 85;
        }
      } else {
        verdictText = `${agent.name}는 대과 없이 조정의 직무를 마쳤으며 사초에도 순리에 맞게 기록되었도다.`;
        accuracyScore = 80;
      }

      return {
        agentId: agent.id,
        name: agent.name,
        positionTitle: agent.positionTitle,
        rank: agent.rank,
        sachoDepiction,
        actualTruthSummary,
        verdictText,
        accuracyScore,
      };
    });

    return {
      title,
      titleHanja,
      evaluationSummary: summary,
      truthRate,
      distortionRate,
      omissionRate,
      totalRecordsCount: sachoRecords.length,
      officialVerdicts,
    };
  }
}
