"""
Build the elbow-region arm model from BodyParts3D STL parts.

Source data: BodyParts3D, (c) The Database Center for Life Science,
licensed under CC Attribution-Share Alike 2.1 Japan.
Clone: https://github.com/Kevin-Mattheus-Moerman/BodyParts3D

This script merges the individual right-arm STL parts into five named meshes,
reorients the arm so its long axis is vertical (Y), places the elbow joint at
the origin (so the forearm can hinge in the app), scales it to a consistent
size, and exports a single glTF/GLB. A second step (gltf-transform) then
decimates and meshopt-compresses it for the web.

Node names match `modelNodeNames` in src/data/structures.ts.
"""

from __future__ import annotations
import os
import sys
import numpy as np
import trimesh

STL_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.environ.get("TEMP", "/tmp"), "bp3d", "stl"
)
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(__file__), "..", "public", "models", "arm_raw.glb"
)

# FMA part ids that make up each structure (right arm).
PARTS = {
    "bone_humerus": ["FMA23130"],
    "bone_radius": ["FMA23464"],
    "bone_ulna": ["FMA23467"],
    "muscle_biceps": ["FMA37684", "FMA37686"],  # short + long head
    "muscle_triceps": ["FMA37695", "FMA37697", "FMA37699"],  # medial+lateral+long
}


def load_part(ids: list[str]) -> trimesh.Trimesh:
    meshes = []
    for i in ids:
        m = trimesh.load(os.path.join(STL_DIR, f"{i}.stl"), process=True)
        meshes.append(m)
    return trimesh.util.concatenate(meshes) if len(meshes) > 1 else meshes[0]


parts = {name: load_part(ids) for name, ids in PARTS.items()}

humerus = parts["bone_humerus"]
radius = parts["bone_radius"]
ulna = parts["bone_ulna"]

# --- Orientation ---------------------------------------------------------
# Long axis of the arm = principal axis of the humerus (a long bone).
hv = humerus.vertices - humerus.vertices.mean(axis=0)
_, _, vh = np.linalg.svd(hv, full_matrices=False)
L = vh[0] / np.linalg.norm(vh[0])

forearm_centroid = np.vstack([radius.vertices, ulna.vertices]).mean(axis=0)
humerus_centroid = humerus.vertices.mean(axis=0)
# Make +L point from forearm toward the humerus (i.e. up / proximal).
if np.dot(humerus_centroid - forearm_centroid, L) < 0:
    L = -L

# Medio-lateral axis: separation between radius and ulna centroids.
ML = radius.vertices.mean(axis=0) - ulna.vertices.mean(axis=0)
ML = ML - np.dot(ML, L) * L
ML /= np.linalg.norm(ML)

# Anterior-posterior axis completes a right-handed frame.
AP = np.cross(L, ML)
AP /= np.linalg.norm(AP)
ML = np.cross(AP, L)  # re-orthogonalise

# Rotation mapping world -> (X=ML, Y=L, Z=AP).
R = np.vstack([ML, L, AP])
if np.linalg.det(R) < 0:
    AP = -AP
    R = np.vstack([ML, L, AP])

# --- Elbow pivot: proximal end of the ulna (olecranon / trochlear notch) --
ul = ulna.vertices
proj = ul @ L
thresh = proj.max() - 0.08 * (proj.max() - proj.min())
pivot = ul[proj >= thresh].mean(axis=0)


def transform(v: np.ndarray) -> np.ndarray:
    return (R @ (v - pivot).T).T


# Apply orientation + recentre (elbow at origin) to every part.
for name, m in parts.items():
    m.vertices = transform(m.vertices)

# Ensure the biceps sits on the anterior (+Z) side; if not, spin 180 deg
# about Y (a proper rotation, keeps the right arm a right arm).
if parts["muscle_biceps"].vertices[:, 2].mean() < 0:
    for m in parts.values():
        m.vertices[:, 0] *= -1
        m.vertices[:, 2] *= -1

# --- Scale so the whole arm is ~4 units tall (matches the app camera) -----
all_v = np.vstack([m.vertices for m in parts.values()])
height = all_v[:, 1].max() - all_v[:, 1].min()
scale = 4.0 / height
for m in parts.values():
    m.vertices *= scale

scene = trimesh.Scene(geometry={name: m for name, m in parts.items()})

os.makedirs(os.path.dirname(OUT), exist_ok=True)
scene.export(OUT)

total_tris = sum(len(m.faces) for m in parts.values())
print(f"Wrote {OUT}")
for name, m in parts.items():
    print(f"  {name:16s} {len(m.faces):>7d} tris")
print(f"  {'TOTAL':16s} {total_tris:>7d} tris")
