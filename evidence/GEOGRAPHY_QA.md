# Level 1 Geography QA — v1.6.0

The authoritative Level 1 blueprint is reference-only. The runtime is constructed from Tiled geography, modular art, water regions and live effects; it does not draw a flattened reference image.

The v1.6 reconstruction keeps one uniform blueprint/world registration and uses traced islands plus corrected mainland water-contact banks. A diagnostic registration overlay is stored outside `dist/` under `verification/level1/reference-registration-overlay.jpg`.

Automated tests cover geometry compilation, road support, bridge/water domain behaviour, anchor binding, island/shoreline correspondence, world registration, absence of the blueprint from production assets, mission flow and offline packaging.

Final visual acceptance still requires the handoff plan's quiet/combat/pan/motion captures and physical-device review. Those gates are not replaced by automated tests.
