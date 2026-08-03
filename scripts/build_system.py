"""
Build a whole-body system mesh (muscles, fascia, ...) from BodyParts3D,
aligned to the arm model via the shared transform (scripts/arm_transform.json).

Usage:
  python build_system.py <out_name> root:<FMA> [exclude_csv]
  python build_system.py <out_name> ids:<FMA,FMA,...> [exclude_csv]

Writes public/models/<out_name>_raw.glb (decimated + compressed later).

Source: BodyParts3D, (c) The Database Center for Life Science,
licensed under CC Attribution-Share Alike 2.1 Japan.
"""

from __future__ import annotations
import os
import sys
import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import trimesh
import fast_simplification

# Per-part triangle cap: large muscles are decimated before merging so the
# combined mesh stays tractable for the final compressor.
TRI_CAP = int(os.environ.get("TRI_CAP", "4000"))

TMP = os.path.join(os.environ.get("TEMP", "/tmp"), "bp3d")
COMPOSITE = os.path.join(TMP, "composite_parts.txt")
RAW_BASE = (
    "https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/"
    "BodyParts3D/main/assets/BodyParts3D_data/stl"
)

out_name = sys.argv[1]
mode = sys.argv[2]
exclude = set(sys.argv[3].split(",")) if len(sys.argv) > 3 and sys.argv[3] else set()

STL_DIR = os.path.join(TMP, out_name)
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "models", f"{out_name}_raw.glb")
os.makedirs(STL_DIR, exist_ok=True)

# --- 1. Determine part ids ---------------------------------------------------
def load_composites() -> dict[str, set[str]]:
    comp: dict[str, set[str]] = {}
    with open(COMPOSITE, encoding="utf-8", errors="ignore") as fh:
        next(fh, None)
        for line in fh:
            cols = line.rstrip("\n").split("\t")
            if len(cols) >= 3:
                comp.setdefault(cols[0], set()).add(cols[2])
    return comp


ids: set[str] = set()
if mode.startswith("root:"):
    comp = load_composites()
    ids = set(comp.get(mode.split(":", 1)[1], set()))
elif mode.startswith("expand:"):
    # Each id is expanded to its leaf primitives if it is a composite,
    # otherwise treated as a direct leaf mesh.
    comp = load_composites()
    for w in mode.split(":", 1)[1].split(","):
        ids |= comp.get(w, {w})
elif mode.startswith("ids:"):
    ids = set(mode.split(":", 1)[1].split(","))
ids -= exclude
print(f"{out_name}: {len(ids)} candidate parts")


# --- 2. Download STLs --------------------------------------------------------
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


with ThreadPoolExecutor(max_workers=16) as pool:
    paths = [p for p in pool.map(fetch, sorted(ids)) if p]
print(f"{out_name}: downloaded {len(paths)} meshes")

# --- 3. Apply shared transform ----------------------------------------------
with open(os.path.join(os.path.dirname(__file__), "arm_transform.json")) as fh:
    T = json.load(fh)
R = np.array(T["R"]); pivot = np.array(T["pivot"]); flip = T["flip"]; scale = T["scale"]

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
        m = trimesh.load(p, process=False)
        if not hasattr(m, "vertices") or len(m.vertices) == 0:
            continue
        v = np.asarray(m.vertices, dtype=np.float64)
        f = np.asarray(m.faces, dtype=np.int64)
        if len(f) > TRI_CAP:
            v, f = fast_simplification.simplify(v, f, 1.0 - TRI_CAP / len(f))
        v = apply_transform(np.asarray(v, dtype=np.float64))
        meshes.append(trimesh.Trimesh(vertices=v, faces=f, process=False))
    except Exception as exc:  # noqa: BLE001
        print("skip", p, exc)

merged = trimesh.util.concatenate(meshes)
print(f"{out_name}: merged {len(merged.vertices)} verts, {len(merged.faces)} tris")

# Global triangle budget for the whole system mesh.
GLOBAL_TARGET = int(os.environ.get("GLOBAL_TARGET", "350000"))
if len(merged.faces) > GLOBAL_TARGET:
    v = np.asarray(merged.vertices, dtype=np.float64)
    f = np.asarray(merged.faces, dtype=np.int64)
    v, f = fast_simplification.simplify(v, f, 1.0 - GLOBAL_TARGET / len(f))
    merged = trimesh.Trimesh(vertices=v, faces=f, process=False)
    print(f"{out_name}: decimated to {len(merged.faces)} tris")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
trimesh.Scene(geometry={out_name: merged}).export(OUT)
print(f"Wrote {OUT}  ({os.path.getsize(OUT) / 1e6:.1f} MB)")
