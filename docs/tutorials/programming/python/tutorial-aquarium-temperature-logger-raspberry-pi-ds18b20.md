---
title: 'Tutorial: Logging Aquarium Water Temperature with a Raspberry Pi, a DS18B20
  and ~60 Lines of Python'
diataxis: Tutorial
domain: programming
topic: python
source: DEV.to Tech News
source_url: https://dev.to/natsumi_fb32bceb18/logging-aquarium-water-temperature-with-a-raspberry-pi-a-ds18b20-and-60-lines-of-python-4aab
date: 2026-10-21
keywords:
- knowledge-base
- python
- programming
- tutorials
---
# Tutorial: Logging Aquarium Water Temperature with a Raspberry Pi, a DS18B20 and ~60 Lines of Python

_Affiliation disclosure from the author: affiliated with aquariumpet.co.uk (UK aquarium heater shop)._

An aquarium heater's display tells you what the water is doing *right now*, near the rod. It doesn't tell you what happened at 3 a.m., whether the far end of the tank lags, or how long the heater actually runs each day. For that you need a log. This tutorial builds a small, independent temperature logger: Raspberry Pi + DS18B20 sensor → CSV + out-of-band warnings. The log is then used to estimate heater electricity usage.

## What you need

- Any Raspberry Pi with GPIO pins (a Zero 2 W is fine)
- A **waterproof** DS18B20 probe (stainless-steel, cabled version)
- One 4.7 kΩ resistor (pull-up between DATA and 3.3 V)
- Python 3 (already on Raspberry Pi OS)

## 1. Wire it and enable 1-Wire

The DS18B20 has three wires:

- **VDD** → 3.3 V (pin 1)
- **GND** → ground (pin 6)
- **DATA** → GPIO4 (pin 7), with the 4.7 kΩ resistor across DATA and 3.3 V

Turn on the 1-Wire bus:

```bash
sudo raspi-config   # Interface Options -> 1-Wire -> Enable
sudo reboot
ls /sys/bus/w1/devices/   # you should see a folder starting with 28-
```

Each sensor shows up as a folder; its `w1_slave` file holds the latest reading in **thousandths of a degree**.

Placement matters: put the probe **away from the heater**, ideally at the opposite end of the tank, so you see what the fish see — not the warm water right by the rod.

## 2. The logger

```python
#!/usr/bin/env python3
"""Minimal aquarium temperature logger for DS18B20 on a Raspberry Pi."""
import csv, glob, time
from datetime import datetime
from pathlib import Path

LOG_FILE = Path.home() / "tank_temp.csv"
INTERVAL_S = 60          # one reading per minute
LOW_C, HIGH_C = 24.0, 27.0   # your own target band; set to suit your livestock

def sensor_path() -> str:
    devices = glob.glob("/sys/bus/w1/devices/28-*/w1_slave")
    if not devices:
        raise RuntimeError("No DS18B20 found - check wiring and 1-Wire setting")
    return devices[0]

def read_c(path: str) -> float | None:
    for _ in range(3):                      # retry on CRC failure
        lines = Path(path).read_text().splitlines()
        if lines[0].strip().endswith("YES"):
            return int(lines[1].split("t=")[1]) / 1000.0
        time.sleep(0.5)
    return None

def main() -> None:
    path = sensor_path()
    new = not LOG_FILE.exists()
    with LOG_FILE.open("a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["timestamp", "temp_c"])
        while True:
            t = read_c(path)
            now = datetime.now().isoformat(timespec="seconds")
            w.writerow([now, "" if t is None else f"{t:.3f}"])
            f.flush()
            if t is None:
                print(f"{now} sensor read failed")
            elif not LOW_C <= t <= HIGH_C:
                print(f"{now} OUT OF RANGE: {t:.2f} °C")
            time.sleep(INTERVAL_S)

if __name__ == "__main__":
    main()
```

Design notes:

- The first line of `w1_slave` ends in `YES` when the CRC checks out. On CRC failure, **retry instead of logging nonsense**.
- **Failed reads go into the log as blank cells**, so gaps in the data are obvious and nothing gets silently filled in.
- `f.flush()` after each row: the log survives a crash mid-run.
- Out-of-band readings print a warning — wire that `print` to a notification channel if you want alerts.

## 3. Using the log

With a minute-resolution log you can answer:

- what happened at 3 a.m. (spikes, drops)
- whether the far end of the tank lags the heater
- how long the heater actually runs per day — feed the log into a simple energy estimate (heater wattage × duty cycle from the temperature band crossings) to see what the tank really costs to keep warm.

## References

- [Logging Aquarium Water Temperature with a Raspberry Pi, a DS18B20 and ~60 Lines of Python (DEV.to)](https://dev.to/natsumi_fb32bceb18/logging-aquarium-water-temperature-with-a-raspberry-pi-a-ds18b20-and-60-lines-of-python-4aab)
- [Raspberry Pi 1-Wire interface — pinout and wiring reference (pinout.xyz)](https://pinout.xyz/pinout/1_wire)
