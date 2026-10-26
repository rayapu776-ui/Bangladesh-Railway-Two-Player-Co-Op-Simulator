# Tracks of Bengal: Bangladesh Railway Two-Player Co-Op Simulator
## Master Game Design Document (GDD) & Technical Specification

---

## Pre-Design Reasoning: Step-by-Step Feature Planning & Architectural Breakdown

1. **Multi-Gauge & Mixed-Era Infrastructure**:
   - **Meter Gauge (MG – 1,000 mm)**: Dominant in the East Zone (Dhaka, Chattogram, Sylhet, Mymensingh, Noakhali, Cox's Bazar).
   - **Broad Gauge (BG – 1,676 mm)**: Dominant in the West Zone (Rajshahi, Khulna, Ishwardi, Darshana) and the Padma Multipurpose Bridge corridor.
   - **Dual Gauge (DG – Three-rail 1,000 mm / 1,676 mm)**: Shared trunk corridors across the Jamuna Railway Bridge, Joydebpur–Ishwardi, and Abdulpur–Parbatipur.
2. **True Asymmetric Two-Player Co-Op (Loco Pilot & Assistant Loco Pilot)**:
   - **Player 1 (Loco Pilot - LP)**: Controls the 8-notch throttle, dynamic brake, A9 automatic air/vacuum train brake, SA9 independent loco brake, reverser, sander, and dual-tone pneumatic horn.
   - **Player 2 (Assistant Loco Pilot - ALP)**: Executes signal & Caution Order (Form T/409) call-and-response protocols, leans out the cab doorway at 15–30 km/h to snatch/exchange physical **Neale's Ball Token** hoops on single-line sections, resets passenger **Alarm Chain Pulling (ACP)** coach clapper valves, manages engine room cooling/Ground Relay (GR) resets, and coordinates with the Train Guard via VHF radio.
3. **South Asian Rolling Stock Physics & Monsoon Adhesion**:
   - Models realistic Brake Pipe (5.0 kg/cm²) propagation delay, wheel-slip on monsoon-drenched rails or Srimangal tea-garden gradients (1:100), and coupler slack forces.
4. **High-Density Trackside Ecology**:
   - Simulates busy manned and unmanned *Rail Gates* (level crossings) with encroaching green CNG auto-rickshaws, cycle-rickshaws, pedestrians, platform hawkers (*"গরম চা! ঝালমুড়ি!"*), and regional landmarks (Kamalapur Station parasol roofs, Padma Bridge lower deck truss, Hardinge Bridge, Srimangal tea hills, and Mohanganj Haor wetlands).

---

## Controls & Co-Op Operations Reference

### Player 1: Loco Pilot (LP – Primary Driver)
- **W / S**: Increase / Decrease Throttle Notch (`IDLE` to `NOTCH 8`)
- **D / A**: Apply / Release Automatic Train Brake (`RELEASE`, `MIN`, `SERVICE 1-4`, `FULL SERVICE`, `EMERGENCY`)
- **E / Q**: Increase / Decrease Independent / Dynamic Brake
- **R / F**: Reverser Direction (`FORWARD`, `NEUTRAL`, `REVERSE`)
- **SPACE**: Sound Dual-Tone Pneumatic Horn (clears encroaching rickshaws/CNGs/pedestrians at level crossings and satisfies `W/L` Whistle Boards)
- **X**: Hold/Toggle Rail Sander (prevents wheel slip on wet monsoon tracks and steep hill gradients)
- **C**: Acknowledge ALP Signal / Caution Callout (`Call-and-Response` protocol)

### Player 2: Assistant Loco Pilot (ALP – Co-Driver & Systems Engineer)
- **I**: Call Out Upcoming Signal Aspect / Speed Restriction (`Call-and-Response` initiator)
- **O**: Lean Out & Exchange **Neale's Ball Token Hoop** (must be within `15–30 km/h` at single-line token stations)
- **P**: Inspect & Reset **Alarm Chain Pulling (ACP)** Clapper Valve on passenger coaches (when stopped after an emergency chain pull)
- **K**: Engine Room Inspection — Reset **Ground Relay (GR)** trip & open **Radiator Louvers** to cool overheating prime mover
- **L**: VHF Walkie-Talkie & Guard Flag Check (request *Line Clear* departure authority from the Train Guard)
- **J**: Toggle Cab Windshield Wipers & Headlight Mode

