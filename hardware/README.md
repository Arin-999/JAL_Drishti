# Hardware notes

## Status

The supplied project contained no real hardware source, bill of materials, sensor specifications, wiring, calibration records, or field test evidence. The 3D ESP32/sensor objects in the dashboard are illustrations. This page documents only the assumptions used by the new reference firmware; it is not an assembled or validated design.

## Provisional architecture

```text
Selected sensor probes
  → vendor-matched analog interface / signal conditioning
  → ESP32 ADC1 inputs (raw voltage sampling only)
  → USB serial JSON lines
```

The prototype has no radio configuration, internet connection, cloud account, backend, persistent storage, or link to the browser application.

## Provisional BOM checklist

| Item | Selection status | Before purchase/use |
|---|---|---|
| ESP32 DevKit/WROOM-compatible development board | Generic `esp32dev` PlatformIO target assumed | Record exact manufacturer, revision, module, USB interface, and input-voltage limits |
| pH probe and high-impedance pH interface | Not selected | Match probe/interface, supply, output range, temperature-compensation method, and calibration procedure |
| Conductivity/TDS probe and interface | Not selected | Use a compatible excitation/interface board; do not connect a bare probe to an ADC |
| Turbidity probe and interface | Not selected | Record optical geometry, output type/range, fouling/cleaning method, and calibration method |
| Temperature channel/interface | Not selected | Firmware currently samples one raw analog input; select an interface before assigning meaning to that channel |
| Power supply, wiring, enclosure, water-contact materials | Not selected | Engineer for the chosen modules, environmental conditions, electrical protection, cleaning, and applicable safety requirements |

No part numbers, costs, specifications, lead times, or local availability are asserted. Complete the table from vendor datasheets and purchasing records before assembly.

## Provisional firmware pin map

`firmware/src/main.cpp` reads these classic-ESP32 ADC1 channels:

| Channel name in serial output | Example GPIO | Important note |
|---|---:|---|
| `ph` | GPIO34 | ADC input only; attach only a compatible conditioned interface output |
| `tds` | GPIO35 | ADC input only; attach only a compatible conditioned interface output |
| `turbidity` | GPIO32 | Confirm ADC/input restrictions for the exact board |
| `temperature` | GPIO33 | Raw voltage only; no temperature sensor model or conversion is assumed |

Pin aliases and ADC characteristics vary across ESP32 family members and board revisions. Check the exact vendor pinout. GPIO inputs are not 5 V tolerant. Keep each signal within the specific board’s allowed range. Do not connect any module output until its maximum/fault output has been measured and verified. A resistor divider, buffer, galvanic isolation, or external ADC may be necessary; sizing and selection are model-specific.

For non-isolated interfaces, a common reference ground is usually needed, but the complete power and grounding design must follow the interface and board datasheets. Never connect a bare glass pH electrode to an MCU pin. Do not immerse electronics or unqualified materials in water.

## Calibration and commissioning gates

Calibration coefficients are deliberately absent. Before deriving or publishing any engineering-unit reading:

1. Record the exact probe, interface, ESP32 board, firmware revision, ADC configuration, wiring, power source, and environmental conditions.
2. Follow the selected sensor/interface vendor's instructions, including warm-up, cleaning, storage, temperature handling, and any required compensation.
3. Use traceable/appropriate reference standards and an independent reference method selected by a qualified water-quality professional. Standards and protocols must match the intended range and use; this repository supplies none.
4. Record raw readings, reference values, replicates, dates, lots, uncertainty, residuals, drift, and acceptance criteria. Do not substitute demo constants or guessed coefficients.
5. Test disconnected, shorted, over-range, startup, power-loss, and sensor-fault conditions safely. ADC input protection and failure behavior must be reviewed before connection.
6. Review the procedure with the responsible laboratory/operator and applicable authorities before any real sample or operational use.

The reference sketch only emits averaged ADC millivolt estimates. It performs no pH/TDS/NTU/temperature conversion, sensor fault diagnosis, calibration, quality scoring, or safety decision.
