"""Check local assets, download signatures, anchor targets, and link hygiene."""
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.images, self.downloads = [], [], [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ("src", "href"):
            if key in attrs:
                self.refs.append(attrs[key])
        if tag == "img":
            self.images.append(attrs)
        if "download" in attrs:
            self.downloads.append(attrs["href"])
        if attrs.get("target") == "_blank":
            assert "noopener" in attrs.get("rel", ""), attrs


if __name__ == "__main__":
    parser = SiteParser()
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    parser.feed(source)
    featured = source.split('<div class="project-grid">', 1)[1].split('<p class="section-note">', 1)[0]
    assert re.findall(r"<h3>(.*?)</h3>", featured) == ["Billiards 3 Ball", "Project T", "Fighter Tap"]
    assert all(anchor in parser.ids for anchor in ("billiards-detail", "project-t-detail", "fighter-detail"))
    assert len(parser.ids) == len(set(parser.ids)), "Duplicate IDs"
    for ref in parser.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            assert url.scheme in ("https", "mailto"), ref
            continue
        if url.path:
            path = (ROOT / unquote(url.path)).resolve()
            assert path.is_relative_to(ROOT) and path.is_file(), ref
        if url.fragment:
            assert url.fragment in parser.ids, ref
    assert len(set(parser.downloads)) == 5, "Expected five downloadable documents"
    for ref in set(parser.downloads):
        assert (ROOT / ref).read_bytes().startswith(b"%PDF-"), ref
    assert "park-wooyoung-career.pdf" not in source
    assert "인프런" in source
    assert source.count('class="case-gallery"') == 3
    assert source.count('class="other-image"') == 6
    assert all(image.get("alt") for image in parser.images), "Missing image descriptions"
    assert 'lang="ko"' in source and 'name="viewport"' in source
    assert not any(value in source for value in ("TODO", "Lorem ipsum", 'href="#"'))
    assert (ROOT / ".nojekyll").is_file()
    print(f"PASS: {len(parser.ids)} anchors, {len(parser.images)} images, 5 PDFs, all local links.")
