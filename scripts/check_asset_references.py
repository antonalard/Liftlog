from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SCAN_EXT = {".html", ".css", ".js"}
REF_RE = re.compile(r"""(?:"|')((?:/assets/|\.\./assets/)[^"')\s]+)(?:"|')""")


def iter_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if ".git" in path.parts:
            continue
        if path.suffix.lower() in SCAN_EXT:
            files.append(path)
    return files


def resolve_ref(file_path: Path, ref: str) -> Path:
    if ref.startswith("/assets/"):
        rel = ref.lstrip("/")
        return ROOT / rel
    if ref.startswith("../assets/"):
        return file_path.parent / ref
    return ROOT / "__invalid__"


def main() -> int:
    missing: list[tuple[Path, str]] = []
    for file_path in iter_files():
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        for ref in REF_RE.findall(text):
            target = resolve_ref(file_path, ref)
            if not target.exists():
                missing.append((file_path.relative_to(ROOT), ref))

    if missing:
        print("Missing referenced asset files found:")
        for src, ref in missing:
            print(f" - {src}: {ref}")
        return 1

    print("Asset reference check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
