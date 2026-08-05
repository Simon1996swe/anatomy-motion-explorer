"""Check anterior/posterior placement of muscles vs their reference bones."""
import os, json, numpy as np, trimesh

HERE = os.path.dirname(__file__)
TMP = os.environ['TEMP']
T = json.load(open(os.path.join(HERE, 'arm_transform.json')))
R = np.array(T['R']); piv = np.array(T['pivot']); fl = T['flip']; sc = T['scale']
Rc = np.array(json.load(open(os.path.join(HERE, 'correction.json')))['Rc'])


def xf(v):
    v = (R @ (np.asarray(v) - piv).T).T
    if fl:
        v[:, 0] *= -1; v[:, 2] *= -1
    return (Rc @ (v * sc).T).T


def stats(folder, fid, label):
    p = os.path.join(TMP, 'bp3d', folder, f'{fid}.stl')
    if not os.path.exists(p):
        return None
    v = xf(trimesh.load(p, process=False).vertices)
    print(f'{label:34s} z {v[:,2].min():6.2f}..{v[:,2].max():6.2f}  '
          f'mean {v[:,2].mean():6.2f}   y {v[:,1].min():6.2f}..{v[:,1].max():6.2f}')
    return v


print('+Z should be ANTERIOR (front of body)\n')
stats('muscles', 'FMA34690', 'pec major clavicular (R)')
stats('skel', 'FMA7480', 'sternum?')
for rib in ['FMA7574', 'FMA7575', 'FMA7576']:
    stats('skel', rib, f'rib {rib}')
print()
stats('muscles', 'FMA13377', 'rectus abdominis (R)')
stats('muscles', 'FMA22328', 'gluteus maximus (R)')
stats('muscles', 'FMA38928', 'rectus femoris (R)')
stats('skel', 'FMA24474', 'right femur')
stats('muscles', 'FMA22448', 'semimembranosus (R) [hamstring]')
