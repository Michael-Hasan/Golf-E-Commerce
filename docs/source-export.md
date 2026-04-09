# Clean source export workflow

This repository already tracks only the source code and templates needed to build the project. A handful of folders and files are explicitly ignored via `.gitignore` (and workspace-level ignores) so they never appear in exported archives:

- `node_modules/` inside every workspace (frontend/backend) plus any nested dependency trees.
- Generated binaries/build outputs: `dist/`, `build/`, `analysis/`, `*.tsbuildinfo`, `frontend/dist/`, `frontend/build/`, etc.
- Runtime caches and temporary files: `.cache/`, `.turbo/`, `.vite/`, `logs/`, `coverage/`, `*.log`.
- Version control internals (`.git/`) and Git LFS pointers.
- Environment secrets: `*.env`, `*.env.*` (only the `*.env.example` skeletons are tracked).
- Uploaded assets or temporary exports under `tmp/`, `out/`, or similar staging targets.

### Export command

Use the bundled helper to create a clean ZIP that contains the tracked files only:

```bash
npm run export:source -- --output=../golf-ecommerce-source.zip
```

The helper runs `git archive` from the repo root with prefix `golf-ecommerce/`, so the resulting ZIP:

- only includes files that `git` knows about (i.e., tracked and committed),
- omits `.git`, `node_modules`, build outputs, caches, `.env` secrets, coverage reports, and any other ignored files,
- is reproducible between runs as long as the Git tree is clean.

### Best practices

1. Run `git status -sb` before exporting to confirm there are no unstaged files you want to share.
2. Keep any local secrets (e.g., `.env`, keystores) out of the repo; copies of `*.env.example` remain in source control for templates.
3. If you need to ship additional assets, stage them explicitly so `git archive` picks them up.
4. Archive the resulting ZIP with your desired file name and deliver that to teammates, vendors, or downstream systems—no need to manually filter node_modules, caches, or `.git` contents.
