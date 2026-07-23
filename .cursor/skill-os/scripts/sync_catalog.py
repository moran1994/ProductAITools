#!/usr/bin/env python3
"""Rebuild Skill OS catalog from ~/.cursor/skills (+ builtins/plugins)."""
from __future__ import annotations
import json, re, sys
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict

HOME = Path.home()
# Prefer project catalog path if cwd has it
CANDIDATES = [
    Path.cwd()/'.cursor'/'skill-os'/'catalog',
    HOME/'.cursor'/'skill-os'/'catalog',
]
OUT = next((p for p in CANDIDATES if p.parent.exists() or True), CANDIDATES[0])
# resolve relative to script if present
SCRIPT_CAT = Path(__file__).resolve().parents[1]/'catalog'
if SCRIPT_CAT.exists() or True:
    OUT = SCRIPT_CAT
OUT.mkdir(parents=True, exist_ok=True)

skills_root = HOME/'.cursor'/'skills'
src = HOME/'.cursor'/'pm-skills-src'/'pm-skills-main'

skill_domain = {}
if src.exists():
    for plugin in src.glob('pm-*'):
        sd = plugin/'skills'
        if not sd.exists(): continue
        for s in sd.iterdir():
            if (s/'SKILL.md').exists():
                skill_domain[s.name] = plugin.name
for k,v in {
    'write-prd':'local-chatprd','skill-creator':'local-meta',
    'skill-os':'local-meta','pm-workflow':'local-meta'
}.items():
    skill_domain.setdefault(k,v)

DOMAIN_META = {
  'pm-product-discovery': {'label': '产品发现', 'order': 1},
  'pm-product-strategy': {'label': '产品战略', 'order': 2},
  'pm-market-research': {'label': '市场研究', 'order': 3},
  'pm-data-analytics': {'label': '数据分析', 'order': 4},
  'pm-go-to-market': {'label': 'Go-to-Market', 'order': 5},
  'pm-marketing-growth': {'label': '营销增长', 'order': 6},
  'pm-execution': {'label': '执行交付', 'order': 7},
  'pm-ai-shipping': {'label': 'AI Shipping', 'order': 8},
  'pm-toolkit': {'label': 'PM工具箱', 'order': 9},
  'local-chatprd': {'label': '本地 PRD', 'order': 10},
  'local-meta': {'label': '元技能 / Skill OS', 'order': 11},
  'cursor-builtin': {'label': 'Cursor 内置', 'order': 12},
  'unknown': {'label': '未分类', 'order': 99},
}

def parse(d: Path):
    text = (d/'SKILL.md').read_text(encoding='utf-8', errors='replace')
    name, desc = d.name, ''
    m = re.search(r'^---\s*\n(.*?)\n---', text, re.S)
    if m:
        fm = m.group(1)
        nm = re.search(r'^name:\s*[\"\']?([^\"\'\n]+)', fm, re.M)
        if nm: name = nm.group(1).strip()
        dm = re.search(r'^description:\s*\"([^\"]*)\"', fm, re.M)
        if dm: desc = dm.group(1)
        else:
            dm = re.search(r'^description:\s*>-?\s*\n((?:[ \t]+.+\n?)+)', fm, re.M)
            if dm: desc = ' '.join(l.strip() for l in dm.group(1).splitlines())
            else:
                dm = re.search(r'^description:\s*(.+)$', fm, re.M)
                if dm: desc = dm.group(1).strip().strip('"\'')
    domain = skill_domain.get(d.name, 'unknown')
    return {
        'id': d.name, 'name': name, 'description': desc, 'domain': domain,
        'domain_label': DOMAIN_META.get(domain, DOMAIN_META['unknown'])['label'],
        'path': str(d/'SKILL.md'),
        'source': 'pm-skills' if domain.startswith('pm-') else ('local' if domain.startswith('local') else 'unknown'),
        'ref': f'node://skill/{d.name}',
    }

skills = [parse(d) for d in sorted(skills_root.iterdir()) if d.is_dir() and (d/'SKILL.md').exists()]
builtin, plugins = [], []
bc = HOME/'.cursor'/'skills-cursor'
if bc.exists():
    for d in sorted(bc.iterdir()):
        if d.is_dir() and (d/'SKILL.md').exists():
            builtin.append({'id': d.name, 'domain':'cursor-builtin', 'path': str(d/'SKILL.md')})
pc = HOME/'.cursor'/'plugins'/'cache'
if pc.exists():
    for sk in pc.rglob('SKILL.md'):
        if 'node_modules' in str(sk): continue
        plugins.append({'id': sk.parent.name, 'path': str(sk), 'plugin_path': str(sk.relative_to(pc))})

catalog = {
  'version': 1,
  'generated_at': datetime.now(timezone.utc).isoformat(),
  'counts': {'personal': len(skills), 'builtin': len(builtin), 'plugins': len(plugins)},
  'domains': DOMAIN_META,
  'skills': skills,
  'builtin_skills': builtin,
  'plugin_skills': plugins,
}
(OUT/'skills.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')

# mirror to home skill-os if project path
home_cat = HOME/'.cursor'/'skill-os'/'catalog'
home_cat.mkdir(parents=True, exist_ok=True)
(home_cat/'skills.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Synced {len(skills)} personal + {len(builtin)} builtin + {len(plugins)} plugin → {OUT/"skills.json"}')
