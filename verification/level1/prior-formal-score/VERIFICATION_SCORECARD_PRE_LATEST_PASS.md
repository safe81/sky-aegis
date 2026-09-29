# Sky Aegis Level 1 — Verification Scorecard

Date: 2026-09-15
Project: current working copy under `sky_aegis_work`

## Technical verification

- Terrain masters:
  - `land-tropical.png`: 2048×2048
  - `land-alpine.png`: 2048×2048
  - `land-snow.png`: 2048×2048
- Full test suite: 121/121 passed on a fresh complete rerun.
- Release build: PASS.
- Build output: geography v8, 15 districts, 25 road nodes, 68 sockets.
- Generated cache: v1.6.0, 351 entries, 301 hashed art/map files.
- 1080×1920 verification renders produced successfully for bridge gateway, civil harbour, naval yard, lower dam and citadel basin.
- Reference/background image absence contract is covered by the passing suite.

## Fresh visual comparison score

These scores are based on direct side-by-side comparison of the current runtime captures with corresponding blueprint crops.

| Dimension | Weight | Score |
| --- | ---: | ---: |
| Geography / composition fidelity | 20% | 7.0 |
| Terrain relief / mountain quality | 20% | 4.5 |
| Landmark architecture | 20% | 5.5 |
| Harbour / district density | 10% | 4.5 |
| Materials / texture richness | 10% | 5.5 |
| Lighting / shadows / atmosphere | 10% | 4.5 |
| Shoreline / water integration | 5% | 5.5 |
| Roads / tunnels / structural integration | 5% | 6.0 |

Weighted score: **5.43/10**

## Hero-area assessment

- Bridge gateway: **4.5/10**
  - Route/bridge placement is recognizable.
  - Current scene lacks the blueprint's cliff-integrated monumental gateway, strong vertical rock faces, architectural supports and shoreline detail.
- Civil harbour: **4.5/10**
  - Correct broad location and pier language.
  - Still sparse and flat compared with the blueprint's dense boats, quay clusters and coastal relief.
- Naval yard: **5.0/10**
  - Warships, berths and dock logic are present.
  - Missing the blueprint's dense industrial mass, crane scale, shore-side height and material richness.
- Canyon / lower dam: **5.5/10**
  - Dam is clearly recognizable and integrated with two water levels.
  - Dam mass is too dominant and surrounding canyon relief is too weak/schematic.
- Citadel basin: **6.0/10**
  - Strongest hero landmark; gate, towers and red accents are recognizable.
  - Still flatter and less mountain-integrated than the reference and lacks the blueprint's broader fortress composition and atmosphere.

## Acceptance status

**NOT PASSED — 8/10 visual gate has not been reached.**

Technical pipeline status is healthy, but the direct visual comparison confirms that the largest remaining deficits are:
1. terrain/cliff relief and height,
2. bridge-bank composition,
3. harbour density and coastal integration,
4. dam/canyon surrounding mass,
5. coherent lighting/atmospheric depth.
