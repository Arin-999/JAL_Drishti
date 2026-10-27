export const DEMO_TURBIDITY_TRIGGER_NTU = 5;

const SCENARIOS = Object.freeze({
    baseline: 2.2,
    'turbidity-exceeded': 18.4
});

const LIMITS = Object.freeze({
    temp: [10, 45],
    ph: [4, 10],
    tds: [100, 800],
    turbidity: [0, 50]
});

function assertFiniteReading(name, value) {
    if (!Number.isFinite(value)) {
        throw new TypeError(`${name} must be a finite number.`);
    }
}

function clamp(value, [minimum, maximum]) {
    return Math.max(minimum, Math.min(maximum, value));
}

function validateReadings(readings) {
    for (const [name, [minimum, maximum]] of Object.entries(LIMITS)) {
        assertFiniteReading(name, readings[name]);
        if (readings[name] < minimum || readings[name] > maximum) {
            throw new RangeError(`${name} is outside the supported demo range.`);
        }
    }
}

export function createInitialState() {
    return {
        temp: 28.5,
        ph: 7.2,
        tds: 425,
        turbidity: SCENARIOS['turbidity-exceeded'],
        scenario: 'turbidity-exceeded'
    };
}

export function setDemoScenario(scenario) {
    if (!Object.hasOwn(SCENARIOS, scenario)) {
        throw new RangeError(`Unknown demo scenario: ${scenario}`);
    }

    return {
        ...createInitialState(),
        turbidity: SCENARIOS[scenario],
        scenario
    };
}

export function advanceDemoState(current, random = Math.random) {
    validateReadings(current);

    if (typeof random !== 'function') {
        throw new TypeError('random must be a function.');
    }

    const nextRandom = () => {
        const value = random();
        if (!Number.isFinite(value) || value < 0 || value > 1) {
            throw new RangeError('random must return a number from 0 to 1.');
        }
        return value;
    };

    const next = {
        ...current,
        temp: clamp(current.temp + (nextRandom() - 0.5) * 0.5, LIMITS.temp),
        ph: clamp(current.ph + (nextRandom() - 0.5) * 0.1, LIMITS.ph),
        tds: clamp(current.tds + (nextRandom() - 0.5) * 5, LIMITS.tds)
    };

    next.turbidity = SCENARIOS[current.scenario];
    if (!Number.isFinite(next.turbidity)) {
        throw new RangeError(`Unknown demo scenario: ${current.scenario}`);
    }

    return next;
}

export function calculateDemoScore(readings) {
    validateReadings(readings);

    const penalties = {
        temp: Math.abs(readings.temp - 25) * 1.5,
        ph: Math.abs(readings.ph - 7) * 8,
        tds: Math.max(0, readings.tds - 300) * 0.04,
        turb: readings.turbidity * 1.2
    };

    for (const [name, value] of Object.entries(penalties)) {
        assertFiniteReading(name, value);
    }

    const totalPenalty = Object.values(penalties).reduce((sum, value) => sum + value, 0);
    return {
        score: clamp(100 - totalPenalty, [0, 100]),
        penalties,
        totalPenalty
    };
}
