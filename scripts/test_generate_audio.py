"""Testes leves: podem rodar sem baixar modelo ou gerar áudio."""
import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "generate_audio.py"
spec = importlib.util.spec_from_file_location("biblioteca_tts", SCRIPT)
tts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tts)


class AudioGenerationTests(unittest.TestCase):
    def test_todos_os_livros_tem_secoes_narraveis(self):
        sources = sorted((tts.ROOT / "livros").glob("*/index.html"))
        self.assertGreater(len(sources), 0, "Nenhum livro encontrado")
        for source in sources:
            with self.subTest(book=source.parent.name):
                sections = tts.extract_sections(source)
                self.assertGreater(len(sections), 0, "Livro sem seções narráveis")
                self.assertEqual(len({s["id"] for s in sections}), len(sections))
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
