import assert from 'node:assert/strict';
import test from 'node:test';
import {
    advanceDemoState,
    calculateDemoScore,
    createInitialState,
    DEMO_TURBIDITY_TRIGGER_NTU,
    setDemoScenario
} from '../src/scenarios.js';

test('incident scenario starts with explicitly synthetic above-trigger turbidity', () => {
    const state = createInitialState();

    assert.equal(state.scenario, 'turbidity-exceeded');
    assert.equal(state.turbidity, 18.4);
    assert.ok(state.turbidity > DEMO_TURBIDITY_TRIGGER_NTU);
});

test('baseline scenario resets all demo readings to fixed starting values', () => {
    assert.deepEqual(setDemoScenario('baseline'), {
        temp: 28.5,
        ph: 7.2,
        tds: 425,
        turbidity: 2.2,
        scenario: 'baseline'
    });
});

test('advancing a scenario keeps its configured turbidity and bounds other values', () => {
    const initial = createInitialState();
    const next = advanceDemoState(initial, () => 1);

    assert.equal(next.scenario, initial.scenario);
    assert.equal(next.turbidity, 18.4);
    assert.ok(next.temp >= 10 && next.temp <= 45);
    assert.ok(next.ph >= 4 && next.ph <= 10);
    assert.ok(next.tds >= 100 && next.tds <= 800);
});

test('demo score remains in the display range and exposes heuristic contributions', () => {
    const result = calculateDemoScore({
        temp: 25,
        ph: 7,
        tds: 100,
        turbidity: 0,
        scenario: 'baseline'
    });

    assert.equal(result.score, 100);
    assert.equal(result.totalPenalty, 0);
    assert.deepEqual(result.penalties, { temp: 0, ph: 0, tds: 0, turb: 0 });

    const incidentScore = calculateDemoScore(createInitialState());
    assert.ok(incidentScore.score >= 0 && incidentScore.score <= 100);
    assert.ok(incidentScore.penalties.turb > 0);
});

test('rejects unknown scenarios and invalid or out-of-range readings', () => {
    assert.throws(() => setDemoScenario('unlisted'), RangeError);
    assert.throws(() => advanceDemoState({ ...createInitialState(), ph: NaN }), TypeError);
    assert.throws(() => calculateDemoScore({ ...createInitialState(), tds: 900 }), RangeError);
    assert.throws(() => advanceDemoState(createInitialState(), () => 2), RangeError);
});
