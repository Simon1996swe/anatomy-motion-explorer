# Asset register

Every third-party asset must be listed here **before** it is used, with its
licence verified. No asset is downloaded or bundled until its licence is
checked and recorded.

## Current assets

### App icons & favicon
- **Asset name:** App icons (`public/icons/icon-192.png`, `icon-512.png`) and
  `public/favicon.svg`
- **Source URL:** Created originally for this project
- **Creator:** This project
- **Licence:** Original work, project-owned
- **Downloaded version or date:** Generated 2026-07-29
- **Modifications:** N/A (original)
- **Attribution text:** None required
- **Redistribution requirements:** None

### 3D model — arm (`public/models/arm.glb`)
- **Asset name:** Elbow-region arm (humerus, radius, ulna, biceps brachii,
  triceps brachii)
- **Source URL:** https://github.com/Kevin-Mattheus-Moerman/BodyParts3D
  (mirror of BodyParts3D / Anatomography, http://lifesciencedb.jp/bp3d/)
- **Creator:** The Database Center for Life Science (BodyParts3D)
- **Licence:** **CC Attribution-Share Alike 2.1 Japan (CC BY-SA 2.1 JP)** for the
  3D content. (The mirror repository's own code is MIT.)
- **Downloaded version or date:** BodyParts3D v3.0 (20110915), retrieved
  2026-07-29. Parts by FMA id: 23130, 23464, 23467, 37684, 37686, 37695, 37697,
  37699.
- **Modifications:** Merged into five named meshes; reoriented upright with the
  elbow at the origin; recentred, scaled, decimated (meshoptimizer) and exported
  to glTF/GLB. Reproducible via `scripts/build_arm_model.py`.
- **Attribution text:** "BodyParts3D, (c) The Database Center for Life Science
  licensed under CC Attribution-Share Alike 2.1 Japan." (also in
  `public/models/ATTRIBUTION.txt`, shown in-app via the model's source note).
- **Redistribution requirements:** Share-alike — this derivative is distributed
  under the same CC BY-SA 2.1 JP licence, with attribution retained.

### 3D model — placeholder fallback
- **Asset name:** Placeholder arm geometry (primitives)
- **Source URL:** N/A — generated at runtime in `src/components/ArmModel.tsx`
- **Creator:** This project
- **Licence:** Original work, project-owned
- **Modifications:** N/A · **Attribution text:** None · **Redistribution:** None
- Used only as a fallback if `arm.glb` fails to load.

## Content references (text)

Anatomical prose is original writing summarising established anatomical facts.
Reference sources are recorded per structure in `src/data/structures.ts` and
surfaced in the app's info panel. Wikipedia articles referenced are licensed
CC BY-SA 4.0; only facts (not wording) were used, so no attribution obligation
is triggered, but the sources are logged for transparency and review.

## Datasets to investigate before use (NOT yet used)

The following open anatomical datasets may be candidates for a future real 3D
model. **They are not used in this prototype and must not be added until their
exact licence and redistribution terms are verified and recorded here.**

| Dataset | Notes to verify before use |
|---|---|
| Z-Anatomy | Confirm exact licence (CC variant), share-alike and attribution obligations, and whether derived GLB exports may be redistributed. |
| BodyParts3D | Confirm licence terms (attribution/share-alike), permitted modifications, and redistribution of processed meshes. |

## Template for new assets

```
Asset name
Source URL
Creator
Licence
Downloaded version or date
Modifications
Attribution text
Redistribution requirements
```
