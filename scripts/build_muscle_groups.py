"""
Build the muscle model as SEPARATE named groups (one mesh per muscle group)
so each can be coloured — and later selected — independently.

Source: BodyParts3D, (c) The Database Center for Life Science,
licensed under CC Attribution-Share Alike 2.1 Japan.

Each group is expanded from its composite FMA id(s) to leaf meshes, welded,
decimated per part, transformed into the shared upright frame, then merged
within the group and exported as a named geometry.
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

TMP = os.path.join(os.environ.get("TEMP", "/tmp"), "bp3d")
COMPOSITE = os.path.join(TMP, "composite_parts.txt")
RAW_BASE = (
    "https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/"
    "BodyParts3D/main/assets/BodyParts3D_data/stl"
)
HERE = os.path.dirname(__file__)
TRI_CAP = int(os.environ.get("TRI_CAP", "4000"))

SPEC = sys.argv[1] if len(sys.argv) > 1 else "muscles"
STL_DIR = os.path.join(TMP, SPEC)
OUT = os.path.join(HERE, "..", "public", "models", f"{SPEC}_raw.glb")

# Muscle groups -> composite/leaf FMA ids. Names match the keys used for
# colouring in src/components/MuscleSystemModel.tsx.
GROUPS: dict[str, list[str]] = {
    "trapezius": ["FMA9626"],
    "deltoid": ["FMA32521"],
    "pectoralis_major": ["FMA9627"],
    "latissimus_dorsi": ["FMA13358", "FMA13359"],
    "teres_major": ["FMA32551", "FMA32552"],
    "infraspinatus": ["FMA32547", "FMA32548"],
    "sternocleidomastoid": ["FMA13408", "FMA13409"],
    "rectus_abdominis": ["FMA13377", "FMA13378"],
    "external_oblique": ["FMA13336", "FMA13337"],
    "biceps_brachii": ["FMA37685", "FMA37687"],          # left (right = arm.glb)
    "triceps_brachii": ["FMA37696", "FMA37698", "FMA37700"],
    "brachioradialis": ["FMA38486", "FMA38487"],
    "gluteus_maximus": ["FMA22328", "FMA22329"],
    "gluteus_medius": ["FMA22330", "FMA22331"],
    "quadriceps": [
        "FMA38928", "FMA38929",  # rectus femoris
        "FMA38930", "FMA38931",  # vastus lateralis
        "FMA38932", "FMA38933",  # vastus medialis
        "FMA38934", "FMA38935",  # vastus intermedius
    ],
    "hamstrings": [
        "FMA22356",              # biceps femoris
        "FMA22358", "FMA22359",  # semitendinosus
        "FMA22448", "FMA22449",  # semimembranosus
    ],
    "sartorius": ["FMA22354", "FMA22355"],
    "gastrocnemius": ["FMA22541"],
    "soleus": ["FMA22558", "FMA22559"],
    "tibialis_anterior": ["FMA22544", "FMA22545"],

    # --- deeper / filling layers ------------------------------------------
    "erector_spinae": ["FMA77177", "FMA77178", "FMA77179"],  # iliocostalis, longissimus, spinalis
    "semispinalis": ["FMA22823"],
    "multifidus": ["FMA22827"],
    "quadratus_lumborum": ["FMA15569"],
    "rhomboids": ["FMA13379", "FMA13380"],
    "levator_scapulae": ["FMA32519"],
    "serratus_anterior": ["FMA13397"],
    "pectoralis_minor": ["FMA13109"],
    "supraspinatus": ["FMA9629"],
    "subscapularis": ["FMA13413"],
    "teres_minor": ["FMA32550"],
    "coracobrachialis": ["FMA37664"],
    "brachialis": ["FMA37667"],
    "anconeus": ["FMA37704"],
    "forearm_flexors": ["FMA38459", "FMA38465", "FMA38469"],
    "forearm_extensors": ["FMA38494", "FMA38497", "FMA38500", "FMA38506"],
    "internal_oblique": ["FMA13891"],
    "transversus_abdominis": ["FMA15570"],
    "iliopsoas": ["FMA22310", "FMA18060"],
    "tensor_fasciae_latae": ["FMA22423"],
    "gluteus_minimus": ["FMA22317"],
    "adductors": ["FMA22443", "FMA22441", "FMA22442", "FMA43882", "FMA22440"],
    "popliteus": ["FMA22590"],
    "tibialis_posterior": ["FMA51099"],
    "fibularis": ["FMA22539", "FMA22540"],
    "splenius": ["FMA22653"],
    "temporalis": ["FMA49006"],
    "masseter": ["FMA48996"],
}

# Fascial / connective-tissue structures that exist as meshes in BodyParts3D.
# (Fascia lata, FMA13902, is only a label there - it has no surface mesh.)
FASCIA: dict[str, list[str]] = {
    "iliotibial_tract": ["FMA58776", "FMA58777"],
    "interosseous_membrane_forearm": ["FMA23707", "FMA23708"],
    "interosseous_membrane_leg": ["FMA35192", "FMA35193"],
    "flexor_retinaculum_wrist": ["FMA40120", "FMA40121"],
    "linea_alba": ["FMA11336"],
    "epicranial_aponeurosis": ["FMA46768"],
}

GROUPS = {"muscles": GROUPS, "fascia": FASCIA}[SPEC]

os.makedirs(STL_DIR, exist_ok=True)


def load_composites() -> dict[str, set[str]]:
    comp: dict[str, set[str]] = {}
    with open(COMPOSITE, encoding="utf-8", errors="ignore") as fh:
        next(fh, None)
        for line in fh:
            cols = line.rstrip("\n").split("\t")
            if len(cols) >= 3:
                comp.setdefault(cols[0], set()).add(cols[2])
    return comp


comp = load_composites()

# Expand each group to leaf ids.
group_ids: dict[str, set[str]] = {}
for group, seeds in GROUPS.items():
    ids: set[str] = set()
    for s in seeds:
        ids |= comp.get(s, {s})
    group_ids[group] = ids

all_ids = sorted({i for ids in group_ids.values() for i in ids})
print(f"{len(GROUPS)} groups -> {len(all_ids)} leaf parts")


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
    ok = {fid for fid, p in zip(all_ids, pool.map(fetch, all_ids)) if p}
print(f"downloaded {len(ok)} meshes")

# Shared transform (base frame + upright/facing correction).
T = json.load(open(os.path.join(HERE, "arm_transform.json")))
R = np.array(T["R"]); pivot = np.array(T["pivot"])
flip = T["flip"]; scale = T["scale"]
Rc = np.array(json.load(open(os.path.join(HERE, "correction.json")))["Rc"])


def apply_transform(v: np.ndarray) -> np.ndarray:
    v = (R @ (v - pivot).T).T
    if flip:
        v[:, 0] *= -1
        v[:, 2] *= -1
    return (Rc @ (v * scale).T).T


geometries: dict[str, trimesh.Trimesh] = {}
for group, ids in group_ids.items():
    parts = []
    for fid in sorted(ids & ok):
        try:
            # STL has unwelded vertices; merge them or decimation cannot work.
            m = trimesh.load(os.path.join(STL_DIR, f"{fid}.stl"), process=True)
            if not hasattr(m, "vertices") or len(m.vertices) == 0:
                continue
            m.merge_vertices()
            v = np.asarray(m.vertices, dtype=np.float64)
            f = np.asarray(m.faces, dtype=np.int64)
            if len(f) > TRI_CAP:
                v, f = fast_simplification.simplify(v, f, 1.0 - TRI_CAP / len(f))
            v = apply_transform(np.asarray(v, dtype=np.float64))
            parts.append(trimesh.Trimesh(vertices=v, faces=f, process=False))
        except Exception as exc:  # noqa: BLE001
            print("  skip", fid, exc)
    if not parts:
        print(f"  !! {group}: no meshes")
        continue
    merged = trimesh.util.concatenate(parts) if len(parts) > 1 else parts[0]
    geometries[group] = merged
    print(f"  {group:22s} {len(parts):>3} parts  {len(merged.faces):>7d} tris")

total = sum(len(m.faces) for m in geometries.values())
print(f"TOTAL {len(geometries)} groups, {total} tris")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
trimesh.Scene(geometry=geometries).export(OUT)
print(f"Wrote {OUT} ({os.path.getsize(OUT) / 1e6:.1f} MB)")
