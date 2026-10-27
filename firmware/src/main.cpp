#include <Arduino.h>

namespace {

constexpr uint8_t PH_PIN = 34;
constexpr uint8_t TDS_PIN = 35;
constexpr uint8_t TURBIDITY_PIN = 32;
constexpr uint8_t TEMPERATURE_PIN = 33;
constexpr uint8_t SENSOR_PINS[] = {
    PH_PIN,
    TDS_PIN,
    TURBIDITY_PIN,
    TEMPERATURE_PIN,
};
constexpr size_t SENSOR_COUNT = sizeof(SENSOR_PINS) / sizeof(SENSOR_PINS[0]);
constexpr uint8_t ADC_SAMPLE_COUNT = 16;
constexpr uint32_t OUTPUT_INTERVAL_MS = 1000;

uint32_t sequenceNumber = 0;

uint32_t readAveragedMilliVolts(uint8_t pin) {
    uint32_t totalMilliVolts = 0;

    for (uint8_t sample = 0; sample < ADC_SAMPLE_COUNT; ++sample) {
        totalMilliVolts += analogReadMilliVolts(pin);
        delayMicroseconds(500);
    }

    return (totalMilliVolts + (ADC_SAMPLE_COUNT / 2)) / ADC_SAMPLE_COUNT;
}

}  // namespace

void setup() {
    Serial.begin(115200);
    analogReadResolution(12);

    for (const uint8_t pin : SENSOR_PINS) {
        analogSetPinAttenuation(pin, ADC_11db);
    }
}

void loop() {
    const uint32_t phMilliVolts = readAveragedMilliVolts(PH_PIN);
    const uint32_t tdsMilliVolts = readAveragedMilliVolts(TDS_PIN);
    const uint32_t turbidityMilliVolts = readAveragedMilliVolts(TURBIDITY_PIN);
    const uint32_t temperatureMilliVolts = readAveragedMilliVolts(TEMPERATURE_PIN);

    Serial.printf(
        "{\"schema\":\"aquasentinel.raw-adc.v1\",\"sequence\":%lu,"
        "\"uptime_ms\":%lu,\"raw_mV\":{\"ph\":%lu,\"tds\":%lu,"
        "\"turbidity\":%lu,\"temperature\":%lu}}\n",
        static_cast<unsigned long>(sequenceNumber++),
        static_cast<unsigned long>(millis()),
        static_cast<unsigned long>(phMilliVolts),
        static_cast<unsigned long>(tdsMilliVolts),
        static_cast<unsigned long>(turbidityMilliVolts),
        static_cast<unsigned long>(temperatureMilliVolts));

    delay(OUTPUT_INTERVAL_MS);
}
