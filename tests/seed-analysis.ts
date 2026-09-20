import { Engine } from '../src/core/simulation/Engine.js';

const testSeeds = [1024, 777, 12345, 42, 8888];

console.log('================================================================');
console.log('         조선 사관 시뮬레이션: Seed별 30일 정치 연쇄 분석');
console.log('================================================================\n');

for (const seed of testSeeds) {
  const engine = new Engine(seed);
  engine.runAutoDays(30);

  const events = engine.allEventsHistory;
  const sachoCount = engine.sachoBook.getCount();
  const worldFacts = engine.factRegistry.getAll();
  const falseSlanderCount = worldFacts.filter((f) => f.type === 'SLANDER_FABRICATED').length;
  const bribeCount = worldFacts.filter((f) => f.type === 'BRIBE_ACCEPTED' || f.type === 'BRIBE_REJECTED').length;
  const impeachments = events.filter((e) => e.type === 'IMPEACHMENT');
  const reprimands = events.filter((e) => e.type === 'ROYAL_REPRIMAND');

  console.log(`[Seed ${seed}] ----------------------------------------------`);
  console.log(`- 발생 정치 사건 수: ${events.length}건`);
  console.log(`- 탄핵 상소 횟수: ${impeachments.length}회`);
  console.log(`- 왕의 공개 질책: ${reprimands.length}회`);
  console.log(`- 날조된 허위 모함: ${falseSlanderCount}건`);
  console.log(`- 뇌물 의혹 사건: ${bribeCount}건`);
  console.log(`- 기록된 사초 총수: ${sachoCount}건`);

  // 주요 연쇄 사건 하이라이트 3개 출력
  console.log(`- 주요 드라마틱 사건 타임라인:`);
  const highlightEvents = events.filter((e) =>
    ['PROMOTION_RIVALRY', 'SLANDER', 'IMPEACHMENT', 'ROYAL_REPRIMAND', 'SECRET_MEETING'].includes(e.type)
  ).slice(0, 6);

  for (const h of highlightEvents) {
    console.log(`    Day ${h.day} [${h.type}] ${h.title}`);
    console.log(`        └ 인과 원인: ${h.causationReason}`);
  }
  console.log('');
}
