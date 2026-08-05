"""
Build a whole-body skeleton mesh from BodyParts3D, aligned to the arm model.

Source: BodyParts3D, (c) The Database Center for Life Science,
licensed under CC Attribution-Share Alike 2.1 Japan.

Steps:
  1. Read composite_parts.txt and collect every primitive (leaf) bone of the
     skeletal system (FMA23881).
  2. Download each bone STL (skipping any without a mesh).
  3. Apply the SAME transform the arm model used (scripts/arm_transform.json),
     so the skeleton lands in the same coordinate frame as arm.glb.
  4. Merge into one mesh and export skeleton_raw.glb (decimated later by
     gltf-transform).

The right humerus/radius/ulna are excluded here because the arm model already
provides them as separate, selectable, animatable meshes.
"""

from __future__ import annotations
import os
import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import trimesh
import fast_simplification

# Decimate EACH bone separately. Running a global simplifier over the merged
# mesh destroys small components (the pelvis was reduced to ~500 triangles and
# thin bones vanished), so every part gets its own triangle budget instead.
TRI_CAP = int(os.environ.get("TRI_CAP", "2500"))
TRI_FLOOR = int(os.environ.get("TRI_FLOOR", "150"))

TMP = os.path.join(os.environ.get("TEMP", "/tmp"), "bp3d")
COMPOSITE = os.path.join(TMP, "composite_parts.txt")
STL_DIR = os.path.join(TMP, "skel")
RAW_BASE = (
    "https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/"
    "BodyParts3D/main/assets/BodyParts3D_data/stl"
)
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "models", "skeleton_raw.glb")

SKELETON = "FMA23881"
# Provided by the arm model instead (kept separate for selection/animation).
EXCLUDE = {"FMA23130", "FMA23464", "FMA23467"}

os.makedirs(STL_DIR, exist_ok=True)

# --- 1. Collect leaf bone ids ------------------------------------------------
ids: set[str] = set()
with open(COMPOSITE, encoding="utf-8", errors="ignore") as fh:
    next(fh, None)  # header
    for line in fh:
        cols = line.rstrip("\n").split("\t")
        if len(cols) >= 3 and cols[0] == SKELETON:
            ids.add(cols[2])
ids -= EXCLUDE
print(f"skeletal system leaf parts: {len(ids)}")


# --- 2. Download STLs (skip missing) -----------------------------------------
def fetch(fid: str) -> str | None:
    dst = os.path.join(STL_DIR, f"{fid}.stl")
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return dst
    try:
        urllib.request.urlretrieve(f"{RAW_BASE}/{fid}.stl", dst)
        return dst
    except urllib.error.HTTPError:
        if os.path.exists(dst):
            os.remove(dst)
        return None


with ThreadPoolExecutor(max_workers=12) as pool:
    paths = [p for p in pool.map(fetch, sorted(ids)) if p]
print(f"downloaded {len(paths)} bone meshes")

# --- 3. Load transform + apply ----------------------------------------------
with open(os.path.join(os.path.dirname(__file__), "arm_transform.json")) as fh:
    T = json.load(fh)
R = np.array(T["R"])
pivot = np.array(T["pivot"])
flip = T["flip"]
scale = T["scale"]

_corr = os.path.join(os.path.dirname(__file__), "correction.json")
Rc = np.array(json.load(open(_corr))["Rc"]) if os.path.exists(_corr) else np.eye(3)


def apply_transform(v: np.ndarray) -> np.ndarray:
    v = (R @ (v - pivot).T).T
    if flip:
        v[:, 0] *= -1
        v[:, 2] *= -1
    return (Rc @ (v * scale).T).T


meshes = []
for p in paths:
    try:
        # STL stores every triangle with its own vertices; merge duplicates so
        # the mesh is properly indexed, otherwise edge-collapse decimation has
        # no shared edges to work with and silently does nothing.
        m = trimesh.load(p, process=True)
        if not hasattr(m, "vertices") or len(m.vertices) == 0:
            continue
        m.merge_vertices()
        v = np.asarray(m.vertices, dtype=np.float64)
        f = np.asarray(m.faces, dtype=np.int64)
        target = max(TRI_FLOOR, min(TRI_CAP, len(f)))
        if len(f) > target:
            v, f = fast_simplification.simplify(v, f, 1.0 - target / len(f))
        v = apply_transform(np.asarray(v, dtype=np.float64))
        meshes.append(trimesh.Trimesh(vertices=v, faces=f, process=False))
    except Exception as exc:  # noqa: BLE001 - skip any unreadable part
        print("skip", p, exc)

merged = trimesh.util.concatenate(meshes)
print(f"merged skeleton: {len(merged.vertices)} verts, {len(merged.faces)} tris")

# --- 4. Export ---------------------------------------------------------------
os.makedirs(os.path.dirname(OUT), exist_ok=True)
trimesh.Scene(geometry={"skeleton": merged}).export(OUT)
print(f"Wrote {OUT}  ({os.path.getsize(OUT) / 1e6:.1f} MB)")
