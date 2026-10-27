# ESP32 raw-ADC reference firmware

## Scope and status

This is new, compile-oriented reference code; it was not present in the supplied HTML. It assumes PlatformIO's generic `esp32dev` Arduino target and classic-ESP32 ADC1 pin numbers. It has not been tested on a physical board or connected to sensors.

The sketch samples GPIO 34, 35, 32, and 33 sixteen times per channel, averages the `analogReadMilliVolts()` results, and writes one JSON line per second to USB serial at 115200 baud. Channel names identify intended signal roles, not calibrated engineering units. No input is converted to pH, ppm, NTU, or degrees Celsius. The firmware does not connect to Wi-Fi, MQTT, HTTP, a database, or the dashboard.

## Build and upload

From the repository root on Windows:

```powershell
py -m pip install platformio==6.1.18
pio run --project-dir .\firmware
pio device list
pio run --project-dir .\firmware --target upload --upload-port COM3
pio device monitor --project-dir .\firmware --port COM3 --baud 115200
```

Replace `COM3` with the port reported on the developer's machine. The PlatformIO build downloads the ESP32 platform and compiler; the firmware code itself has no extra Arduino library dependencies.

## Serial record shape

Each line has this shape; placeholder numbers below describe JSON field types, not actual readings:

```json
{"schema":"aquasentinel.raw-adc.v1","sequence":0,"uptime_ms":0,"raw_mV":{"ph":0,"tds":0,"turbidity":0,"temperature":0}}
```

The zeroes above are schema placeholders, not observed readings. The implementation emits `sequence`, `uptime_ms`, and millivolt values as JSON numbers. ADC millivolt estimates depend on board, core, attenuation, and electrical conditions. They are not certified voltage measurements. An unconnected analog input can float and produce meaningless output; the firmware does not claim to detect a disconnected probe.

## Electrical safety

Read [hardware notes](../hardware/README.md) before attaching any signal. Confirm exact board/module datasheets, supply and logic levels, maximum output under normal/fault conditions, grounding/isolation, and input protection. ESP32 GPIO is not 5 V tolerant. Never connect a bare pH electrode to an ADC input.

## Extension requirements

Any engineering-unit conversion must be implemented only after the actual hardware interface, reference method, calibration protocol, coefficient provenance, expected range, temperature behavior, uncertainty, and invalid/fault behavior are documented and independently reviewed. Add tests for conversion boundaries and failures. Do not connect this serial stream to the browser or a network without a separate threat/privacy review and an explicit, reviewed protocol.
