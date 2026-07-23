#!/usr/bin/env python3
"""Inspect / advance Skill OS flow state (CLI helper for agents)."""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
FLOWS = ROOT/'flows'
STATE = ROOT/'state'/'active.json'

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text(encoding='utf-8'))
    return {'active': None, 'history': []}

def save_state(st):
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding='utf-8')

def load_flow(fid: str):
    p = FLOWS/f'{fid}.flow.json'
    if not p.exists():
        raise SystemExit(f'Unknown flow: {fid}. See {FLOWS}/index.json')
    return json.loads(p.read_text(encoding='utf-8'))

def resolve_skill(node: dict, vars_: dict):
    if 'skill' in node: return node['skill']
    sb = node.get('skill_by')
    if sb:
        key = vars_.get(sb['when'])
        return sb.get('map', {}).get(key) or list(sb.get('map', {}).values())[0]
    if node.get('type') == 'sequence':
        return node.get('steps')
    return None

def cmd_list(_):
    idx = json.loads((FLOWS/'index.json').read_text(encoding='utf-8'))
    for f in idx['flows']:
        print(f"{f['id']:16} {f.get('command','-'):14} nodes={f['node_count']}  {f['name']}")

def cmd_status(_):
    st = load_state()
    print(json.dumps(st, ensure_ascii=False, indent=2))

def cmd_start(args):
    flow = load_flow(args.flow)
    st = load_state()
    if st.get('active') and not args.force:
        print('Active flow exists. Pass --force to replace.', file=sys.stderr)
        print(json.dumps(st['active'], ensure_ascii=False, indent=2))
        return
    active = {
      'flow_id': flow['id'],
      'flow_name': flow['name'],
      'node_id': flow['entry'],
      'status': 'running',
      'vars': {},
      'completed_nodes': [],
      'started_at': datetime.now(timezone.utc).isoformat(),
      'artifacts': [],
    }
    # seed vars
    if args.stage:
        active['vars']['product_stage'] = args.stage
    if args.topic:
        active['vars']['topic'] = args.topic
    st['active'] = active
    save_state(st)
    node = flow['nodes'][active['node_id']]
    print(json.dumps({
      'ok': True,
      'active': active,
      'node': node,
      'resolved_skill': resolve_skill(node, active['vars']),
      'instruction': 'Read the node, apply skill if type=skill, then run: python flow_cli.py next --note "..."'
    }, ensure_ascii=False, indent=2))

def cmd_show(args):
    st = load_state()
    if not st.get('active'):
        print('No active flow'); return
    flow = load_flow(st['active']['flow_id'])
    nid = args.node or st['active']['node_id']
    node = flow['nodes'][nid]
    print(json.dumps({
      'flow_id': flow['id'],
      'node_id': nid,
      'node': node,
      'resolved_skill': resolve_skill(node, st['active'].get('vars', {})),
      'vars': st['active'].get('vars', {}),
      'completed': st['active'].get('completed_nodes', []),
    }, ensure_ascii=False, indent=2))

def cmd_next(args):
    st = load_state()
    if not st.get('active'):
        raise SystemExit('No active flow. Start one with: flow_cli.py start <flow>')
    active = st['active']
    flow = load_flow(active['flow_id'])
    cur_id = active['node_id']
    cur = flow['nodes'][cur_id]
    # mark complete
    active['completed_nodes'].append({
      'node_id': cur_id,
      'at': datetime.now(timezone.utc).isoformat(),
      'note': args.note or '',
    })
    if args.set_var:
        for pair in args.set_var:
            k,v = pair.split('=',1)
            active.setdefault('vars', {})[k]=v
    # determine next
    nxt = args.to
    if not nxt:
        if cur.get('terminal'):
            active['status'] = 'completed'
            active['node_id'] = cur_id
            st.setdefault('history', []).append(active)
            st['active'] = None
            save_state(st)
            print(json.dumps({'ok': True, 'completed': True, 'flow': flow['id']}, ensure_ascii=False, indent=2))
            return
        nxt = cur.get('next')
        if not nxt and cur.get('type') == 'choice':
            raise SystemExit('Choice node requires --to <option-next>')
        if not nxt and cur.get('type') == 'router':
            raise SystemExit('Router node: use --to <flow|node> or start another flow')
    if nxt in flow['nodes']:
        active['node_id'] = nxt
        active['status'] = 'running'
        save_state(st)
        node = flow['nodes'][nxt]
        print(json.dumps({
          'ok': True,
          'moved_to': nxt,
          'node': node,
          'resolved_skill': resolve_skill(node, active.get('vars', {})),
        }, ensure_ascii=False, indent=2))
    else:
        # treat as new flow id
        print(json.dumps({'ok': False, 'hint': f'Unknown node {nxt}. If switching flow, run: flow_cli.py start {nxt} --force'}, ensure_ascii=False, indent=2))

def main():
    ap = argparse.ArgumentParser(description='Skill OS flow CLI')
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('list').set_defaults(func=cmd_list)
    sub.add_parser('status').set_defaults(func=cmd_status)
    p = sub.add_parser('start'); p.add_argument('flow'); p.add_argument('--force', action='store_true'); p.add_argument('--stage'); p.add_argument('--topic'); p.set_defaults(func=cmd_start)
    p = sub.add_parser('show'); p.add_argument('--node'); p.set_defaults(func=cmd_show)
    p = sub.add_parser('next'); p.add_argument('--to'); p.add_argument('--note'); p.add_argument('--set-var', action='append'); p.set_defaults(func=cmd_next)
    args = ap.parse_args(); args.func(args)

if __name__ == '__main__':
    main()
