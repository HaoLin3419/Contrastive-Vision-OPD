"""Reproduce website figures directly from the supplied paper PDF."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".tmp" / "pdf-tools"))
import pymupdf


def main():
    document = pymupdf.open(ROOT / "CV_OPD_Contrastive_Vision_OPD_ICLR_27.pdf")
    output = ROOT / "paper_assets"
    # Image objects in Figure 3, not photographs from unrelated examples.
    for name, xref in [
        ("method-full", 37),
        ("method-positive", 39),
        ("method-negative", 41),
    ]:
        pymupdf.Pixmap(document, xref).save(output / f"{name}.png")

    figures = [
        ("figure-1-hires", 0, (108, 502, 518, 665)),
        ("figure-2-hires", 3, (108, 80, 506, 268)),
        ("figure-3-hires", 4, (108, 80, 506, 287)),
    ]
    for name, page, bounds in figures:
        document[page].get_pixmap(
            matrix=pymupdf.Matrix(4, 4), clip=pymupdf.Rect(bounds), alpha=False
        ).save(output / f"{name}.png")
    print("Extracted three Figure 3 images and three high-resolution figures.")


if __name__ == "__main__":
    main()
