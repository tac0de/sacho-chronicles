import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Engine } from '../src/core/simulation/Engine.js';
import { SilokCodec, type SilokShareData } from '../src/core/sharing/SilokCodec.js';
import { DynastyManager } from '../src/core/dynasty/DynastyManager.js';

describe('Sacho Chronicles: 심야의 딜레마 & 노백엔드 공유 & 왕조 루프 검증', () => {
  it('1. 심야의 내방 딜레마 생성 및 결단 스탯 반영 검증', () => {
    const engine = new Engine(42);

    // 1일차 관찰 시작 및 단정 극필 기록
    engine.playerLocation = 'ROYAL_HALL';
    engine.executeDay();

    assert.strictEqual(engine.timeManager.currentPhase, 'OBSERVATION_RECORD');

    const firstInfo = engine.dailyObservedInfo[0];
    assert.ok(firstInfo, '관찰 정보가 존재해야 함');

    engine.commitSacho([
      {
        infoId: firstInfo.id,
        recordIt: true,
        certainty: 'ASSERTIVE',
      },
    ]);

    // 사초 기록 후 심야의 내방 단계 진입 확인
    assert.strictEqual(engine.timeManager.currentPhase, 'NIGHT_VISITATION');
    assert.ok(engine.currentDilemma, '심야 딜레마가 생성되어야 함');
    assert.ok(engine.currentDilemma.choices.length >= 2, '선택지가 2개 이상이어야 함');

    const initialIntegrity = engine.scribeStats.integrity;
    const initialPeril = engine.scribeStats.peril;

    // 선택지 1번 결단
    const chosen = engine.currentDilemma.choices[0];
    engine.resolveNightChoice(chosen.id);

    // 정산 완료 상태 및 스탯 변화 확인
    assert.strictEqual(engine.timeManager.currentPhase, 'DAY_COMPLETED');
    assert.strictEqual(
      engine.scribeStats.integrity,
      Math.max(0, Math.min(100, initialIntegrity + chosen.integrityDelta))
    );
    assert.strictEqual(
      engine.scribeStats.peril,
      Math.max(0, Math.min(100, initialPeril + chosen.perilDelta))
    );
  });

  it('2. 나비효과 트리거 집행 및 익일 여명 조보 발행 검증', () => {
    const engine = new Engine(999);
    engine.executeDay();

    engine.commitSacho([]);
    assert.strictEqual(engine.timeManager.currentPhase, 'NIGHT_VISITATION');

    // 강제로 나비효과가 포함된 선택지 또는 트리거 추가
    const primeMinister = engine.agents.find((a) => a.positionId === 'CHIEF_STATE_COUNCILLOR')!;
    const initialPower = primeMinister.politicalPower;

    engine.pendingButterflies.push({
      type: 'IMPEACHMENT',
      targetId: primeMinister.id,
      reason: '사관의 엄정한 직필로 인한 비리 폭로',
      newsHeadline: '【긴급 탄핵】 영의정 비위 혐의로 탄핵 발의!',
      newsDetail: '사헌부 대사헌이 영의정의 뇌물 수수 혐의를 탄핵하였습니다.',
      powerDelta: -25,
    });

    // 다음 날로 진행
    const nextDay = engine.proceedToNextDay();
    assert.strictEqual(nextDay, 2);

    // 여명 조보 발행 확인
    assert.ok(engine.latestMorningBulletin, '여명 조보가 발행되어야 함');
    assert.strictEqual(engine.latestMorningBulletin.headline, '【긴급 탄핵】 영의정 비위 혐의로 탄핵 발의!');

    // 영의정 권력 감소 및 상태 변화 확인
    assert.strictEqual(primeMinister.politicalPower, initialPower - 25);
    assert.strictEqual(primeMinister.currentStatus, '사헌부 탄핵 심문');
  });

  it('3. SilokCodec: 30일 실록 데이터의 무손실 인코딩/디코딩 검증', () => {
    const mockData: SilokShareData = {
      version: 1,
      seed: 'test_seed_777',
      day: 30,
      generation: 1,
      kingName: '성종 (成宗)',
      scribeStats: {
        integrity: 85,
        peril: 25,
        wealth: 120,
      },
      records: [
        {
          day: 1,
          subjectName: '윤형원',
          certainty: 'ASSERTIVE',
          statement: '영의정 윤형원이 뇌물을 받고 관직을 팔았다.',
          witnessType: 'DIRECT',
        },
      ],
      secretArchive: [
        {
          day: 14,
          title: '심야의 밀록',
          content: '도승지가 편전 뒷문으로 은밀히 사초를 빼돌리려 함을 목격함.',
        },
      ],
      butterflies: [
        {
          day: 2,
          headline: '【파문】 권신 탄핵',
          detail: '사헌부의 집중 표적이 됨',
        },
      ],
      evaluation: {
        grade: 'S',
        title: '만고직필 (萬古直筆)의 성사(聖史)',
        score: 95,
        summary: '어떤 권세 앞에서도 붓을 꺾지 않고 역사의 거울을 남겼다.',
      },
    };

    const encoded = SilokCodec.encode(mockData);
    assert.ok(encoded.length > 0, '인코딩된 문자열이 비어있지 않아야 함');

    const decoded = SilokCodec.decode(encoded);
    assert.ok(decoded, '디코딩 결과가 존재해야 함');
    assert.strictEqual(decoded.seed, 'test_seed_777');
    assert.strictEqual(decoded.scribeStats.integrity, 85);
    assert.strictEqual(decoded.records.length, 1);
    assert.strictEqual(decoded.records[0].subjectName, '윤형원');
    assert.strictEqual(decoded.secretArchive.length, 1);
    assert.strictEqual(decoded.evaluation?.grade, 'S');
  });

  it('4. DynastyManager: 500년 왕조 계승 및 가문 유산(Heirloom) 해금 검증', () => {
    const manager = new DynastyManager();
    manager.resetAllProgress();

    assert.strictEqual(manager.getGeneration(), 1);
    assert.strictEqual(manager.getCurrentKing().templeName, '성종 (成宗)');

    // 1대 실록 편찬 종료 기록 (Grade S 달성 -> 萬古家風 해금)
    const { newlyUnlockedHeirlooms } = manager.recordReignEnd(
      'S',
      '만고직필의 성사',
      90,
      20,
      3,
      150,
      '서인(西人)'
    );

    assert.ok(newlyUnlockedHeirlooms.length >= 1, '유산이 해금되어야 함');
    assert.strictEqual(manager.isHeirloomUnlocked('RIGHTEOUS_FAMILY_LEGACY'), true);
    assert.strictEqual(manager.isHeirloomUnlocked('MERCHANT_ANCESTRY'), true);

    // 차대 계승
    const nextKing = manager.advanceToNextReign();
    assert.strictEqual(manager.getGeneration(), 2);
    assert.strictEqual(nextKing.templeName, '연산군 (燕山君)');

    // 차대 사관의 시작 가문 보너스 검증
    const bonuses = manager.getStartingBonusStats();
    assert.strictEqual(bonuses.bonusIntegrity, 15);
    assert.strictEqual(bonuses.bonusWealth, 80);
  });
});
