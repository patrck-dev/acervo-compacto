"""Testes leves: podem rodar sem baixar modelo ou gerar áudio."""
import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "generate_audio.py"
spec = importlib.util.spec_from_file_location("biblioteca_tts", SCRIPT)
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)


class AudioGenerationTests(unittest.TestCase):
    def test_cinco_livros_tem_dez_secoes(self):
        sources = sorted((tts.ROOT / "livros").glob("*/index.html"))
        self.assertEqual(len(sources), 5)
        for source in sources:
            with self.subTest(book=source.parent.name):
                sections = tts.extract_sections(source)
                self.assertEqual(len(sections), 10)
                self.assertEqual(len({s["id"] for s in sections}), 10)
                self.assertTrue(all(len(s["text"]) > 50 for s in sections))

    def test_fatiamento_nao_perde_palavras(self):
        original = "Sentido e reflexão. " * 170
        pieces = tts.text_chunks(original)
        self.assertTrue(all(0 < len(s) <= 260 for s in pieces))
        self.assertEqual(" ".join(pieces), tts.normalize(original))

    def test_sem_texto_narravel_gera_erro(self):
        import tempfile
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "index.html"
            path.write_text('<section class="reading-section" data-chapter id="vazia"><h2>Vazia</h2></section>', encoding="utf-8")
            with self.assertRaises(ValueError):
                tts.extract_sections(path)


if __name__ == "__main__":
    unittest.main()
