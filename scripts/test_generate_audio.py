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


    def test_leituras_ampliadas_tem_sumario_e_texto_narravel(self):
        from bs4 import BeautifulSoup

        expected_minimum = {
            "sapiens": 31,
            "o-mito-de-sisifo": 28,
            "confissoes": 21,
            "ate-o-fim-do-tempo": 17,
            "the-big-picture": 17,
            "cosmos": 18,
            "palido-ponto-azul": 17,
            "uma-breve-historia-do-tempo": 17,
        }
        self.assertEqual(
            {file.parent.name for file in (tts.ROOT / "livros").glob("*/index.html")},
            set(expected_minimum),
        )
        for slug, minimum in expected_minimum.items():
            with self.subTest(book=slug):
                file = tts.ROOT / "livros" / slug / "index.html"
                soup = BeautifulSoup(file.read_text(encoding="utf-8"), "html.parser")
                sections = soup.select("section.reading-section[data-chapter]")
                self.assertGreaterEqual(len(sections), minimum)
                section_ids = {s.get("id") for s in sections}
                self.assertEqual(len(section_ids), len(sections))
                self.assertTrue(all(s.select_one("[data-readable]") for s in sections))
                toc_lists = soup.select("ol.toc-list")
                self.assertEqual(len(toc_lists), 2)
                expected_links = ["#" + s.get("id") for s in sections]
                for toc in toc_lists:
                    self.assertEqual([a.get("href") for a in toc.select("a[href]")], expected_links)
                self.assertIsNotNone(soup.select_one("#audio-player"))
                readable_ids = [e.get("id") for e in soup.select("[data-readable]")]
                self.assertEqual(len(readable_ids), len(set(readable_ids)))



if __name__ == "__main__":
    unittest.main()
