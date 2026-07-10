import pdfplumber

PDF_PATH = "2026-05-07_Statement.pdf"   # <-- change to your real filename

with pdfplumber.open(PDF_PATH) as pdf:
    print(f"Total pages: {len(pdf.pages)}\n")

    page = pdf.pages[0]   # inspect the first page
    print(f"Page width: {page.width}, height: {page.height}\n")

    words = page.extract_words()
    print(f"Words found on page 1: {len(words)}\n")

    # Show each word with its horizontal position (x0) and vertical position (top).
    # x0 tells us which COLUMN a word is in; top tells us which ROW/line it's on.
    print(f"{'x0':>7} {'top':>7}  text")
    print("-" * 40)
    for w in words:
        print(f"{w['x0']:7.1f} {w['top']:7.1f}  {w['text']}")