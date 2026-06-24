from __future__ import annotations

import importlib
import inspect
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "python-completions"

MODULES = {
    "cv2": "cv2",
    "numpy": "numpy",
    "matplotlib.pyplot": "matplotlib.pyplot",
    "pandas": "pandas",
}

def escape_snippet(value: str) -> str:
    return value.replace("\\", "\\\\").replace("$", "\\$").replace("}", "\\}")


def signature_snippet(name: str, obj: Any) -> str:
    try:
        signature = inspect.signature(obj)
    except (TypeError, ValueError):
        return f"{name}(${{1}})"

    parts: list[str] = []
    index = 1
    for parameter in signature.parameters.values():
        if parameter.kind in (parameter.VAR_POSITIONAL, parameter.VAR_KEYWORD):
            continue
        if parameter.default is parameter.empty:
            placeholder = parameter.name
        else:
            placeholder = f"{parameter.name}={parameter.default!r}"
        parts.append(f"${{{index}:{escape_snippet(placeholder)}}}")
        index += 1

    return f"{name}({', '.join(parts)})"


def completion_for(module_name: str, name: str, obj: Any) -> dict[str, str]:
    is_callable = callable(obj)
    kind = "function" if is_callable else "variable"
    insert_text = signature_snippet(name, obj) if is_callable else name
    doc = inspect.getdoc(obj) or f"{module_name}.{name}"
    first_doc_line = doc.splitlines()[0][:220]

    return {
        "label": name,
        "insertText": insert_text,
        "detail": module_name,
        "documentation": first_doc_line,
        "kind": kind,
    }


def build_catalog() -> dict[str, list[dict[str, str]]]:
    catalog: dict[str, list[dict[str, str]]] = {}
    for catalog_key, import_name in MODULES.items():
        module = importlib.import_module(import_name)
        completions: list[dict[str, str]] = []
        for name in sorted(dir(module), key=str.lower):
            if name.startswith("_"):
                continue
            try:
                obj = getattr(module, name)
            except Exception:
                continue
            completions.append(completion_for(catalog_key, name, obj))
        catalog[catalog_key] = completions
    return catalog


def main() -> None:
    catalog = build_catalog()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, str] = {}

    for module_name, completions in catalog.items():
        file_name = f"{module_name.replace('.', '-')}.json"
        manifest[module_name] = file_name
        (OUTPUT_DIR / file_name).write_text(
            json.dumps(completions, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

    (OUTPUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    total = sum(len(items) for items in catalog.values())
    print(f"Wrote {total} completions to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
