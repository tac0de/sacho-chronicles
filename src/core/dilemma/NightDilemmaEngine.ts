import type { Engine } from '../simulation/Engine.js';
import type { SachoRecord } from '../records/SachoRecord.js';
import type { Agent } from '../agents/Agent.js';

export interface ButterflyTrigger {
  type: 'IMPEACHMENT' | 'EXILE' | 'ROYAL_PRAISE' | 'FACTION_PURGE' | 'COVERUP_EXPOSED';
  instigatorId?: string;
  targetId: string;
  reason: string;
  newsHeadline: string;
  newsDetail: string;
  powerDelta: number;
}

export interface NightChoice {
  id: string;
  label: string;
  hanjaLabel?: string;
  description: string;
  consequenceHint: string;
  integrityDelta: number; // 직필 신념 (-30 ~ +25)
  perilDelta: number;     // 사화 위기 (-20 ~ +35)
  wealthDelta: number;    // 가문 재력 (0 ~ 100냥)
  secretArchiveEntry?: {
    title: string;
    content: string;
  };
  butterflyTrigger?: ButterflyTrigger;
}

export interface NightDilemma {
  id: string;
  day: number;
  visitorId: string;
  visitorName: string;
  visitorTitle: string;
  visitorRank: string;
  dilemmaType: 'BRIBERY' | 'THREAT' | 'ROYAL_INQUEST' | 'SECRET_PETITION';
  title: string;
  atmosphere: string;
  dialogue: string;
  choices: NightChoice[];
}

export class NightDilemmaEngine {
  /**
   * 당일 작성된 사초와 궐내 인물들의 권력/원한 상태를 분석하여 심야 내방 딜레마 생성
   */
  public static generateDilemma(engine: Engine, todayRecords: SachoRecord[]): NightDilemma {
    const day = engine.timeManager.currentDay;
    const random = engine.random;

    // 1) 오늘 엄벌/단정(ASSERTIVE) 또는 추단(MODERATE)으로 기록된 관원이 있는지 확인
    const accusedRecord = todayRecords.find((r) => r.certainty === 'ASSERTIVE' || r.certainty === 'MODERATE');

    if (accusedRecord) {
      const accusedAgent = engine.agentMap.get(accusedRecord.subjectId);
      if (accusedAgent) {
        // 야심이 높고 정직성이 낮으면 -> 뇌물 회유 (BRIBERY)
        if (accusedAgent.ambition >= 60 && accusedAgent.honesty <= 60) {
          return this.createBriberyDilemma(day, accusedAgent, accusedRecord);
        }
        // 권세가 높고 위험회피가 낮으면 -> 서슬 퍼런 칼끝 협박 (THREAT)
        if (accusedAgent.politicalPower >= 70) {
          return this.createThreatDilemma(day, accusedAgent, accusedRecord);
        }
      }
    }

    // 2) 플레이어가 사정전(편전)이나 은대(승정원)에 방문했을 때 -> 국왕의 사초 밀람 요구 (ROYAL_INQUEST)
    if ((engine.playerLocation === 'ROYAL_HALL' || engine.playerLocation === 'ROYAL_SECRETARIAT') && random.chance(0.45)) {
      return this.createRoyalInquestDilemma(day, engine);
    }

    // 3) 당일 기록이 평이할 경우 -> 신진 사림의 익명 상소/밀지 요청 (SECRET_PETITION)
    return this.createSecretPetitionDilemma(day, engine);
  }

  private static createBriberyDilemma(day: number, agent: Agent, record: SachoRecord): NightDilemma {
    const bribeAmount = 50 + (agent.politicalPower * 2);

    return {
      id: `DILEMMA_BRIBE_${day}_${agent.id}`,
      day,
      visitorId: agent.id,
      visitorName: agent.name,
      visitorTitle: agent.positionTitle,
      visitorRank: agent.faction === 'WEST' ? '서인(西人)' : '동인(東人)',
      dilemmaType: 'BRIBERY',
      title: '심야의 황금 보따리와 관직 회유',
      atmosphere: '밤 3경(자정), 사관의 침소 문에 조심스러운 노크 소리가 들리더니 기름진 비단 도포를 입은 관원이 은밀히 들어섭니다.',
      dialogue: `"사관 나으리, 낮에 사정전에서 적으신 사초 초고에 소인의 이름이 오른 것을 알고 왔소. 부디 이번 한 번만 묵살(闕文)해 주신다면 황금 ${bribeAmount}냥과 함께 춘추관 차상 승진을 의정부에 적극 천거하겠소."`,
      choices: [
        {
          id: 'ACCEPT_BRIBE',
          label: '뇌물을 받고 사초를 먹칠(墨漆)하여 은폐한다',
          hanjaLabel: '納賂隱滅',
          description: `황금 ${bribeAmount}냥을 가문 금고에 넣고, 오늘 작성한 비리 기록을 묵필로 지워 없앱니다.`,
          consequenceHint: '가문 자금 대폭 증가, 사관 신념 급락(-25), 훗날 실록 편찬 시 곡필 오명 위험.',
          integrityDelta: -25,
          perilDelta: -10,
          wealthDelta: bribeAmount,
        },
        {
          id: 'REFUSE_RIGHTEOUS',
          label: '대갈일성(大喝一聲)하며 뇌물을 마당으로 내동댕이친다',
          hanjaLabel: '斥賂嚴誅',
          description: `"사관의 붓은 천하의 공기(公器)요! 어찌 황금 따위로 역사를 사려 하는가!" 단호히 호통치며 쫓아냅니다.`,
          consequenceHint: '만고직필의 신념 상승(+20), 해당 관원의 깊은 원한 획득, 사화 위기 증가(+15).',
          integrityDelta: 20,
          perilDelta: 15,
          wealthDelta: 0,
          butterflyTrigger: {
            type: 'IMPEACHMENT',
            targetId: agent.id,
            reason: `사관에게 뇌물을 건네려다 축출당한 추문이 암암리에 궐내에 파다하게 퍼짐`,
            newsHeadline: `【긴급 파문】 ${agent.name} ${agent.positionTitle}, 사관 회유 미수 및 비위 혐의로 조정 탄핵 발의!`,
            newsDetail: `${agent.name}이(가) 사초를 왜곡하고자 은밀히 공작한 정황이 드러나 사헌부의 집중 표적이 되었습니다.`,
            powerDelta: -25,
          },
        },
        {
          id: 'SECRET_DOUBLE_RECORD',
          label: '겉으로는 뇌물을 거절하되, 비밀 사가사초(私家史草)에 밀록을 숨긴다',
          hanjaLabel: '私家隱錄',
          description: '공식 사초궤에는 모호하게 적어 위기를 피하되, 가문 비밀 벽장 서책에 이 자의 뇌물 공작을 일자별로 상세히 은닉합니다.',
          consequenceHint: '신념 유지(+5), 가문 비밀 사가사초 1편 은닉 획득, 은밀한 훗날의 반전 증거 확보.',
          integrityDelta: 5,
          perilDelta: 5,
          wealthDelta: 0,
          secretArchiveEntry: {
            title: `[Day ${day} 비밀 밀록] ${agent.name}의 심야 뇌물 회유 전말`,
            content: `Day ${day} 깊은 밤, ${agent.positionTitle} ${agent.name}이(가) 황금 ${bribeAmount}냥을 들고 침소에 침입하여 사초 조작을 요구하였음. 훗날 환국이 일어날 때 이를 천하에 공개할 것임.`,
          },
        },
      ],
    };
  }

  private static createThreatDilemma(day: number, agent: Agent, record: SachoRecord): NightDilemma {
    return {
      id: `DILEMMA_THREAT_${day}_${agent.id}`,
      day,
      visitorId: agent.id,
      visitorName: `${agent.name}의 결사대`,
      visitorTitle: '복면 자객',
      visitorRank: '권신 사병(私兵)',
      dilemmaType: 'THREAT',
      title: '달빛 아래 번뜩이는 비수와 멸문의 겁박',
      atmosphere: '촛불이 바람도 없이 흔들리더니, 검은 복면을 두른 자객이 소리 없이 방안으로 침투하여 차가운 환도를 목에 겨눕니다.',
      dialogue: `"사관, 입이 무거워야 가문이 편안한 법이오. ${agent.name} 대감에 대해 적은 초고를 지금 넘기지 않으면, 내일 아침 그대의 노모와 아우가 역모의 옥사에 연루되어 능지처참을 당할 것이오."`,
      choices: [
        {
          id: 'RESIST_MARTYR',
          label: '목을 길게 빼며 호통친다: "내 목은 베어도 사필은 꺾지 못한다!"',
          hanjaLabel: '頸血直筆',
          description: '춘추관 사관의 숭고한 기개를 보이며 목숨을 걸고 초고를 품에 안고 웅크립니다.',
          consequenceHint: '사관 신념 극대화(+30), 사화 위기 급상승(+30), 자객이 기세에 눌려 물러남.',
          integrityDelta: 30,
          perilDelta: 30,
          wealthDelta: 0,
          butterflyTrigger: {
            type: 'COVERUP_EXPOSED',
            targetId: agent.id,
            reason: `사관을 암살하려던 권신의 사병 공작이 궐내 순라군에 발각됨`,
            newsHeadline: `【대궐 경악】 ${agent.name} 대감의 사병, 춘추관 사관 침소 습격 발각! 어전 국문 개시`,
            newsDetail: `국왕이 격노하여 "어찌 사관을 겁박하는 패악이 백주대낮도 모자라 한밤중에 일어나는가!" 친국을 명했습니다.`,
            powerDelta: -35,
          },
        },
        {
          id: 'YIELD_FEAR',
          label: '공포에 질려 오늘 작성한 사초 초고를 자객에게 넘긴다',
          hanjaLabel: '屈膝投草',
          description: '목숨을 보전하기 위해 오늘 낮 작성한 사초 원고를 넘겨 화톳불에 던져 태워버립니다.',
          consequenceHint: '사화 위기 대폭 감소(-25), 사관 신념 처참히 추락(-35), 당일 사초 증발.',
          integrityDelta: -35,
          perilDelta: -25,
          wealthDelta: 0,
        },
      ],
    };
  }

  private static createRoyalInquestDilemma(day: number, engine: Engine): NightDilemma {
    const king = engine.agents.find((a) => a.positionId === 'KING');

    return {
      id: `DILEMMA_ROYAL_${day}`,
      day,
      visitorId: 'CHIEF_SECRETARY',
      visitorName: '도승지 서유진',
      visitorTitle: '승정원 도승지',
      visitorRank: '왕명 출납(王命 出納)',
      dilemmaType: 'ROYAL_INQUEST',
      title: '어전 밀명: 국왕의 은밀한 사초 밀람(密覽) 요구',
      atmosphere: '승정원의 수은등을 든 도승지가 편전의 어명을 받들고 은밀히 찾아왔습니다.',
      dialogue: `"사관, 전하께서 어제와 오늘 삼공육경들의 언동을 적은 사초 초고를 은밀히 대전으로 가져오라 하셨소. 군주가 신하들의 충역(忠逆)을 가리기 위함이니, 어명을 받드시오."`,
      choices: [
        {
          id: 'REFUSE_KING_HISTORIAN',
          label: '국조의 법도를 들며 거부한다: "전하, 임금이라도 사초는 보실 수 없습니다!"',
          hanjaLabel: '抗命守法',
          description: '태종 대부터 이어진 조선 춘추관의 불문율을 고수하며 국왕의 사초 열람을 결연히 거절합니다.',
          consequenceHint: '만고직필의 칭송(+25), 국왕의 진노로 사화 위기 증가(+20).',
          integrityDelta: 25,
          perilDelta: 20,
          wealthDelta: 0,
        },
        {
          id: 'SUBMIT_ROYAL_MEMORIAL',
          label: '어명을 받들어 사초를 봉진(封進)하고 조정 숙청의 칼을 쥐어드린다',
          hanjaLabel: '奉進御覽',
          description: '국왕에게 사초를 바쳐 권신들을 척결할 수 있는 명분을 제공합니다.',
          consequenceHint: '왕의 두터운 총애로 위기 감소(-20), 사관 독립성 훼손(-15), 다음 날 왕의 전격 친국 단행.',
          integrityDelta: -15,
          perilDelta: -20,
          wealthDelta: 30,
          butterflyTrigger: {
            type: 'FACTION_PURGE',
            targetId: 'CHIEF_STATE_COUNCILLOR',
            reason: `국왕이 사초를 열람한 후 영의정과 그 일파의 전횡을 확신함`,
            newsHeadline: `【어전 벼락】 주상 전하, 사초 밀람 후 의정부 삼정승에 서슬 퍼런 친국 엄포!`,
            newsDetail: `국왕이 조참에서 친히 비망기를 내려 대신들의 부패와 당파 싸움을 엄단하겠다고 선언했습니다.`,
            powerDelta: -20,
          },
        },
      ],
    };
  }

  private static createSecretPetitionDilemma(day: number, engine: Engine): NightDilemma {
    const juniorScholar = engine.agents.find((a) => a.positionId === 'ACADEMY_DRAFTER') || engine.agents[7];

    return {
      id: `DILEMMA_PETITION_${day}`,
      day,
      visitorId: juniorScholar.id,
      visitorName: juniorScholar.name,
      visitorTitle: juniorScholar.positionTitle,
      visitorRank: '홍문관 옥당(玉堂)',
      dilemmaType: 'SECRET_PETITION',
      title: '신진 사림의 피눈물 어린 어전 밀지(密紙) 청탁',
      atmosphere: '남루한 관복 차림의 젊은 옥당 관원이 촛불 아래 엎드려 눈물로 읍소합니다.',
      dialogue: `"선배 사관 나으리, 지금 영의정과 권신들의 탐학으로 삼남 지방의 백성들이 굶어 죽고 있습니다. 소관들이 올린 상소는 승정원에서 번번이 찢겨나갔습니다. 부디 내일 대전의 사초궤에 이 밀봉 상소를 함께 넣어 주십시오!"`,
      choices: [
        {
          id: 'HELP_SCHOLAR_MEMORIAL',
          label: '의기를 발휘하여 신진 사림의 밀지를 사초궤에 넣어 임금께 올린다',
          hanjaLabel: '義擧上疏',
          description: '법도를 어기는 일이나, 도탄에 빠진 민생과 정의를 위해 목숨을 걸고 밀지를 대전으로 전합니다.',
          consequenceHint: '사관 신념 대폭 상승(+20), 사화 위기 증가(+15), 다음 날 아침 조정에 격렬한 공론 폭발.',
          integrityDelta: 20,
          perilDelta: 15,
          wealthDelta: 0,
          butterflyTrigger: {
            type: 'ROYAL_PRAISE',
            targetId: juniorScholar.id,
            reason: `사관의 손을 거쳐 국왕에게 전달된 충신들의 피어린 상소가 경연에서 공개됨`,
            newsHeadline: `【조정 공론】 홍문관 신진 사림의 밀소(密疏) 편전 상달! 붕당 권신들 당황`,
            newsDetail: `국왕이 경연에서 밀소를 직접 낭독하며 조정 권신들의 탐학을 엄중히 질타하였습니다.`,
            powerDelta: 20,
          },
        },
        {
          id: 'REJECT_STRICT_REGULATION',
          label: '"사관은 오직 보고 들은 것만을 적을 뿐이다" 규정을 들며 물리친다',
          hanjaLabel: '格守官規',
          description: '정의로운 뜻은 가상하나 사관의 본분을 잃고 정쟁에 가담할 수 없다며 냉정하게 돌려보냅니다.',
          consequenceHint: '냉정한 직무 고수(+5), 평온 유지, 권력과의 충돌 방지.',
          integrityDelta: 5,
          perilDelta: -5,
          wealthDelta: 0,
        },
      ],
    };
  }
}
