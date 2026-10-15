#!/usr/bin/env python3
"""Gera MP3s para as seções HTML da Biblioteca da Existência.

O site publicado não executa Python: este script roda apenas no GitHub Actions.
Teste da extração sem carregar o modelo: python scripts/generate_audio.py --dry-run
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path

MODEL_BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/"
MODEL_FILES = ("kokoro-v1.0.onnx", "voices-v1.0.bin")
VALID_VOICES = ("pf_dora", "pm_alex", "pm_santa")
ENGINE_VERSION = "kokoro-v1.0-ptbr-v1"
ROOT = Path(__file__).resolve().parents[1]


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_sections(source: Path) -> list[dict]:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(source.read_text(encoding="utf-8"), "html.parser")
    result = []
    for section in soup.select("section.reading-section[data-chapter]"):
        identifier = section.get("id", "")
        if not re.fullmatch(r"[a-zA-Z0-9_-]+", identifier):
            raise ValueError(f"ID inválido ou ausente: {source}: {identifier!r}")
        heading = section.find("h2")
        title = normalize(heading.get_text(" ", strip=True)) if heading else identifier
        blocks = [normalize(el.get_text(" ", strip=True))
                  for el in section.select("[data-readable]")]
        blocks = [text for text in blocks if text]
        if not blocks:
            raise ValueError(f"Seção sem texto narrável: {source} #{identifier}")
        result.append({"id": identifier, "title": title,
                       "text": title + ".\n\n" + "\n\n".join(blocks)})
    if not result:
        raise ValueError(f"Nenhuma seção encontrada em {source}")
    return result


def text_chunks(text: str, maximum: int = 260) -> list[str]:
    """Divide respeitando pontuação e palavras; nunca trunca o conteúdo."""
    sentences = re.split(r"(?<=[.!?;:])\s+", normalize(text))
    result, buffer = [], ""
    for sentence in sentences:
        words = sentence.split()
        for word in words:
            if len(word) > maximum:
                raise ValueError(f"Palavra com mais de {maximum} caracteres")
            candidate = f"{buffer} {word}".strip()
            if len(candidate) > maximum and buffer:
                result.append(buffer)
                buffer = word
            else:
                buffer = candidate
        if buffer and len(buffer) >= int(maximum * .75):
            result.append(buffer)
            buffer = ""
    if buffer:
        result.append(buffer)
    return result


def get_engine(model_dir: Path):
    import numpy as np
    from kokoro_onnx import Kokoro
    from misaki.espeak import EspeakG2P

    model_dir.mkdir(parents=True, exist_ok=True)
    for filename in MODEL_FILES:
        destination = model_dir / filename
        if not destination.exists() or destination.stat().st_size < 100_000:
            print(f"Baixando modelo/vozes: {filename}", flush=True)
            temp = destination.with_suffix(destination.suffix + ".part")
            urllib.request.urlretrieve(MODEL_BASE + filename, temp)
            temp.replace(destination)
    return Kokoro(str(model_dir / MODEL_FILES[0]), str(model_dir / MODEL_FILES[1])), EspeakG2P(language="pt-br"), np


def render_mp3(text: str, destination: Path, voice: str, engine) -> None:
    import soundfile as sf
    kokoro, g2p, np = engine
    pieces = []
    sample_rate = None
    for chunk in text_chunks(text):
        phonemes, _ = g2p(chunk)
        if not phonemes:
            continue
        samples, rate = kokoro.create(phonemes, voice, is_phonemes=True)
        if sample_rate is not None and sample_rate != rate:
            raise RuntimeError("A taxa de amostragem mudou durante a narração")
        sample_rate = rate
        pieces.append(np.asarray(samples, dtype=np.float32).reshape(-1))
        pieces.append(np.zeros(int(rate * .16), dtype=np.float32))
    if not pieces or not sample_rate:
        raise RuntimeError(f"Não houve áudio para {destination}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="tts-") as tmp:
        wav = Path(tmp) / "synthesis.wav"
        mp3 = Path(tmp) / "synthesis.mp3"
        sf.write(wav, np.concatenate(pieces), sample_rate)
        subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
                        "-y", "-i", str(wav), "-vn", "-ac", "1", "-b:a", "64k",
                        str(mp3)], check=True)
        if mp3.stat().st_size < 1000:
            raise RuntimeError(f"Áudio gerado parece vazio: {destination}")
        mp3.replace(destination)


def process_book(source: Path, voice: str, dry_run: bool, force: bool, get_lazy_engine) -> tuple[int, int]:
    slug = source.parent.name
    output = ROOT / "assets" / "audio" / slug
    manifest_path = output / "manifest.json"
    try:
        previous = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        previous = {}
    old_sections = {s["id"]: s for s in previous.get("sections", []) if "id" in s}
    sections, updated = [], 0
    for section in extract_sections(source):
        identifier = section["id"]
        checksum = hashlib.sha256(
            f"{ENGINE_VERSION}\n{voice}\n{section['text']}".encode("utf-8")
        ).hexdigest()
        filename = f"{identifier}.mp3"
        same = (not force and old_sections.get(identifier, {}).get("sha256") == checksum
                and (output / filename).is_file())
        if not same:
            updated += 1
            print(f"{'[SIMULAR] ' if dry_run else ''}Gerar {slug}/{filename}", flush=True)
            if not dry_run:
                render_mp3(section["text"], output / filename, voice, get_lazy_engine())
        sections.append({"id": identifier, "title": section["title"],
                         "file": filename, "sha256": checksum})
    if not dry_run:
        output.mkdir(parents=True, exist_ok=True)
        manifest = {"version": 1, "engine": ENGINE_VERSION, "voice": voice,
                    "book": slug, "sections": sections}
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
                                 encoding="utf-8")
        for stale in output.glob("*.mp3"):
            if stale.name not in {s["file"] for s in sections}:
                stale.unlink()
    return len(sections), updated


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--book", action="append", help="Slug específico (repetível)")
    parser.add_argument("--voice", choices=VALID_VOICES, default="pf_dora")
    parser.add_argument("--model-dir", type=Path, default=Path.home() / ".cache" / "biblioteca-kokoro")
    parser.add_argument("--dry-run", action="store_true", help="Somente extrair e identificar seções")
    parser.add_argument("--force", action="store_true", help="Regenerar todos os áudios")
    args = parser.parse_args()
    if args.book and any(not re.fullmatch(r"[a-zA-Z0-9_-]+", s) for s in args.book):
        parser.error("Slug de livro inválido")
    sources = sorted((ROOT / "livros").glob("*/index.html"))
    if args.book:
        selected = set(args.book)
        sources = [s for s in sources if s.parent.name in selected]
        if len(sources) != len(selected):
            parser.error("Um ou mais livros não foram encontrados")
    if not sources:
        parser.error("Nenhum HTML de obra foi encontrado")

    engine = None

    def lazy_engine():
        nonlocal engine
        if engine is None:
            engine = get_engine(args.model_dir)
        return engine

    generated = 0
    for source in sources:
        total, changed = process_book(source, args.voice, args.dry_run, args.force, lazy_engine)
        generated += changed
        print(f"{source.parent.name}: {total} seções, {changed} a gerar", flush=True)
    print(f"Concluído: {generated} seções {'planejadas' if args.dry_run else 'geradas'}.", flush=True)


if __name__ == "__main__":
    main()
