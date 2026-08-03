"""
Compute an upright correction rotation for the shared coordinate frame.

The frame's vertical was derived from the (hanging) arm, leaving the whole body
tilted ~10 deg. This measures the skeleton's true vertical axis and produces a
rotation that maps it to +Y, written to scripts/correction.json. All build
scripts apply this rotation as a final step so every model stands upright and
stays mutually aligned.
"""

import os, glob, json, numpy as np, trimesh

HERE = os.path.dirname(__file__)
T = json.load(open(os.path.join(HERE, 'arm_transform.json')))
R = np.array(T['R']); piv = np.array(T['pivot']); fl = T['flip']; sc = T['scale']


def base_transform(v):
    v = (R @ (v - piv).T).T
    if fl:
        v[:, 0] *= -1; v[:, 2] *= -1
    return v * sc


# Gather skeleton vertices in the base frame.
V = []
for p in glob.glob(os.path.join(os.environ['TEMP'], 'bp3d', 'skel', '*.stl')):
    try:
        V.append(base_transform(np.asarray(trimesh.load(p, process=False).vertices)))
    except Exception:
        pass
V = np.vstack(V)
S = V[np.random.choice(len(V), size=min(200000, len(V)), replace=False)]

# Vertical axis = first principal component.
_, _, vt = np.linalg.svd(S - S.mean(0), full_matrices=False)
axis = vt[0] / np.linalg.norm(vt[0])
if axis[1] < 0:
    axis = -axis

# Rotation that maps `axis` -> +Y (shortest arc, Rodrigues).
t = np.array([0.0, 1.0, 0.0])
r = np.cross(axis, t)
rn = np.linalg.norm(r)
if rn < 1e-8:
    Rc = np.eye(3)
else:
    r = r / rn
    ang = np.arccos(np.clip(np.dot(axis, t), -1, 1))
    K = np.array([[0, -r[2], r[1]], [r[2], 0, -r[0]], [-r[1], r[0], 0]])
    Rc = np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * (K @ K)

json.dump({'Rc': Rc.tolist()}, open(os.path.join(HERE, 'correction.json'), 'w'), indent=2)

# Report corrected skeleton bounds for camera framing.
Vc = (Rc @ V.T).T
lo, hi = Vc.min(0), Vc.max(0)
print('tilt corrected. new skeleton bbox:')
print('  min', np.round(lo, 2), 'max', np.round(hi, 2))
print('  center', np.round((lo + hi) / 2, 2), 'size', np.round(hi - lo, 2))
