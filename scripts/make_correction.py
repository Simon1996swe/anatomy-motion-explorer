"""
Compute the upright + facing correction for the shared coordinate frame.

The base frame is derived from the arm (see build_arm_model.py), which leaves the
body both tilted (~10 deg) and yawed, so "front" was actually an oblique view.
This derives the true anatomical axes from the SKELETON:

  1. Vertical (+Y)  = first principal axis of the whole skeleton.
  2. Medio-lateral  = widest horizontal axis (PCA of the horizontal projection);
     a body is much wider than it is deep, so this is reliable.
  3. Antero-posterior (+Z) = ML x Y, with the sign fixed so the biceps (anterior)
     is in front of the triceps (posterior).

Writes scripts/correction.json; every build script applies it as a final step so
all models stay mutually aligned.
"""

import os, glob, json, numpy as np, trimesh

HERE = os.path.dirname(__file__)
TMP = os.environ['TEMP']
T = json.load(open(os.path.join(HERE, 'arm_transform.json')))
R = np.array(T['R']); piv = np.array(T['pivot']); fl = T['flip']; sc = T['scale']


def base(v):
    v = (R @ (np.asarray(v) - piv).T).T
    if fl:
        v[:, 0] *= -1; v[:, 2] *= -1
    return v * sc


def load(pattern):
    out = []
    for p in glob.glob(pattern):
        try:
            out.append(base(trimesh.load(p, process=False).vertices))
        except Exception:
            pass
    return out


V = np.vstack(load(os.path.join(TMP, 'bp3d', 'skel', '*.stl')))
S = V[np.random.choice(len(V), size=min(250000, len(V)), replace=False)]

# --- 1. Vertical axis --------------------------------------------------------
_, _, vt = np.linalg.svd(S - S.mean(0), full_matrices=False)
up = vt[0] / np.linalg.norm(vt[0])
if up[1] < 0:
    up = -up


def rot_between(a, b):
    """Shortest-arc rotation taking unit vector a to unit vector b."""
    v = np.cross(a, b); s = np.linalg.norm(v)
    if s < 1e-9:
        return np.eye(3) if a @ b > 0 else -np.eye(3)
    v = v / s
    ang = np.arccos(np.clip(a @ b, -1, 1))
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * (K @ K)


R1 = rot_between(up, np.array([0.0, 1.0, 0.0]))
S1 = (R1 @ S.T).T

# --- 2. Widest horizontal axis = medio-lateral -------------------------------
H = S1[:, [0, 2]]
H = H - H.mean(0)
_, _, hvt = np.linalg.svd(H, full_matrices=False)
ml2 = hvt[0] / np.linalg.norm(hvt[0])           # (x, z) of the ML axis
yaw = np.arctan2(ml2[1], ml2[0])                # angle from +X
c, s_ = np.cos(-yaw), np.sin(-yaw)
R2 = np.array([[c, 0, -s_], [0, 1, 0], [s_, 0, c]])  # rotate ML onto +X

Rc = R2 @ R1

# --- 3. Fix anterior sign using biceps (front) vs triceps (back) -------------
arm_dir = os.path.join(TMP, 'bp3d', 'stl')
bi = np.vstack(load(os.path.join(arm_dir, 'FMA37684.stl')) +
               load(os.path.join(arm_dir, 'FMA37686.stl')))
tri = np.vstack(load(os.path.join(arm_dir, 'FMA37695.stl')) +
                load(os.path.join(arm_dir, 'FMA37697.stl')))
bz = ((Rc @ bi.T).T)[:, 2].mean()
tz = ((Rc @ tri.T).T)[:, 2].mean()
if bz < tz:  # biceps must be anterior (+Z): rotate 180 deg about Y
    Rc = np.diag([-1.0, 1.0, -1.0]) @ Rc
    print('flipped to put anterior on +Z')

json.dump({'Rc': Rc.tolist()}, open(os.path.join(HERE, 'correction.json'), 'w'), indent=2)

Vc = (Rc @ V.T).T
lo, hi = Vc.min(0), Vc.max(0)
size = hi - lo
print(f'yaw corrected by {np.degrees(yaw):.1f} deg')
print('skeleton bbox  min', np.round(lo, 2), 'max', np.round(hi, 2))
print('center', np.round((lo + hi) / 2, 2), 'size', np.round(size, 2))
print(f'width/depth ratio = {size[0] / size[2]:.2f}  (a human should be ~1.8-2.5)')
