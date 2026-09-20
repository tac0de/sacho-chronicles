import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Engine } from '../src/core/simulation/Engine.js';
import { Random } from '../src/core/simulation/Random.js';

describe('Sacho Chronicles Core Simulation Test', () => {
  it('PRNG should be deterministic with same seed', () => {
    const r1 = new Random(42);
    const r2 = new Random(42);

    for (let i = 0; i < 50; i++) {
      assert.strictEqual(r1.next(), r2.next());
      assert.strictEqual(r1.nextInt(1, 100), r2.nextInt(1, 100));
    }
  });

  it('Engine should initialize 12 distinct agents and court positions', () => {
    const engine = new Engine(100);
    assert.strictEqual(engine.agents.length, 12);
    assert.strictEqual(engine.agentMap.size, 12);

    const king = engine.agentMap.get('king');
    assert.ok(king);
    assert.strictEqual(king!.positionTitle, '주상 (전하)');

    const chief = engine.agentMap.get('chief_councillor');
    assert.ok(chief);
    assert.strictEqual(chief!.positionTitle, '영의정');

    // Relationships should be asymmetric
    const leftToChief = engine.relationships.getRelation('left_councillor', 'chief_councillor');
    const chiefToLeft = engine.relationships.getRelation('chief_councillor', 'left_councillor');
    assert.notStrictEqual(leftToChief, chiefToLeft);
  });

  it('Engine should run 30 days and produce emergent causal conflict chains', () => {
    const seed = 12345;
    const engine = new Engine(seed);

    // Run 30 days
    engine.runAutoDays(30);

    assert.strictEqual(engine.timeManager.currentDay, 31);
    assert.ok(engine.allEventsHistory.length >= 60, 'Should produce at least 60 events across 30 days');

    const debug = engine.getDebugSnapshot();
    assert.ok(debug.worldFacts.length > 0, 'WorldFacts must be registered');
    assert.ok(debug.sachoCount > 0, 'Sacho records must be recorded');

    // Check for distinct political event types
    const eventTypes = new Set(engine.allEventsHistory.map((e) => e.type));
    console.log(`[Test] Generated event types count: ${eventTypes.size} / 10`);
    console.log(`[Test] Types: ${Array.from(eventTypes).join(', ')}`);

    assert.ok(eventTypes.size >= 5, 'Should trigger multiple diverse event types');

    // Check causality reason presence
    for (const ev of engine.allEventsHistory) {
      assert.ok(ev.causationReason.length > 0, `Event ${ev.id} must have a causationReason`);
    }
  });

  it('Two separate engines with identical seed should produce 100% identical event histories', () => {
    const seed = 98765;
    const engine1 = new Engine(seed);
    const engine2 = new Engine(seed);

    engine1.runAutoDays(15);
    engine2.runAutoDays(15);

    assert.strictEqual(engine1.allEventsHistory.length, engine2.allEventsHistory.length);
    for (let i = 0; i < engine1.allEventsHistory.length; i++) {
      const e1 = engine1.allEventsHistory[i];
      const e2 = engine2.allEventsHistory[i];
      assert.strictEqual(e1.type, e2.type);
      assert.strictEqual(e1.instigatorId, e2.instigatorId);
      assert.strictEqual(e1.targetId, e2.targetId);
      assert.strictEqual(e1.title, e2.title);
    }
  });
});
