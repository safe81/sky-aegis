# Sky Aegis Level 1 — Visual Map Pass v13

## Objective
Correct the remaining composition failure visible in the v12 runtime captures: bridge and harbour checkpoints still read as large empty-water rectangles with isolated quays, rather than a continuous coastline/canyon journey like the Level 1 master reference.

## Changes
- Added continuous render-only district banks for every coastal, harbour, alpine and snow district from Coastal Narrows through Citadel Basin.
- District bank depth is biome- and district-specific, leaving a deliberate central combat corridor while pulling cliffs, towns and mountain shoulders into the 720-pixel portrait viewport.
- Added turquoise shallow shelves directly outside the new scenic banks.
- Added cliff toes, rock rims, deterministic roads, vegetation, rocks and settlement blocks to prevent the new land from reading as flat filler.
- Civil Harbour now receives compact coastal settlement dressing; Industrial Harbour and Naval Yard receive service/industrial dressing; alpine and snow banks receive pines and rock outcrops.
- Bridge Gateway now renders real fortified gateway towers at both bridge ends instead of small generic gateposts.
- No authored TMJ collision, navigation, sockets, encounter timing, boss logic or mission geometry changed.

## Visual target
The portrait frame should resemble the supplied master reference structurally: land masses occupy meaningful left/right screen area, roads and settlements trace the banks, shallow water separates land from the deep channel, and the navigable lane remains visually clear rather than dominating the entire screen.