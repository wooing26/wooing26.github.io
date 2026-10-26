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
    assert 'class="project-grid"' not in source
    assert re.findall(r'<article class="case" id="([^"]+)">', source) == ["billiards-detail", "project-t-detail", "fighter-detail"]
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
    assert source.count('class="preview-card"') == 6
    assert source.count('<template id="gallery-') == 9
    assert 'class="other-image"' not in source
    downloads = source.split('<section class="downloads-section"', 1)[1].split("</section>", 1)[0]
    assert "<img" not in downloads
    assert all(image.get("alt") for image in parser.images), "Missing image descriptions"
    assert 'lang="ko"' in source and 'name="viewport"' in source
    assert not any(value in source for value in ("TODO", "Lorem ipsum", 'href="#"'))
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    assert "backdrop-filter" not in css, "Full-screen filter regression"
    previews = [image for image in parser.images if "/previews/" in image["src"]]
    assert len(previews) == 15
    assert all(int(image["width"]) <= 640 and int(image["height"]) <= 560 for image in previews)
    assert (ROOT / ".nojekyll").is_file()
    print(f"PASS: {len(parser.ids)} anchors, {len(parser.images)} images, 5 PDFs, all local links.")
