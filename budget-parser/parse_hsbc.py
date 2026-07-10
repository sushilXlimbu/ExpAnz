import pdfplumber
import re
from decimal import Decimal
from collections import defaultdict
from categorize import categorize, get_merchant

PDF_PATH = "2026-05-07_Statement.pdf"   # <-- your real file

# Column boundaries derived from the coordinate diagnostic
TYPE_X      = 113
DESC_X      = 140
PAIDOUT_MIN, PAIDOUT_MAX = 340, 410
PAIDIN_MIN,  PAIDIN_MAX  = 420, 500
BALANCE_X   = 520

DATE_RE   = re.compile(r"^\d{2}$")
MONTH_RE  = re.compile(r"^[A-Z][a-z]{2}$")
AMOUNT_RE = re.compile(r"^[\d,]+\.\d{2}$")

SKIP_MARKERS = {"BALANCEBROUGHTFORWARD", "BALANCECARRIEDFORWARD"}
HEADER_JUNK = {"2026", "details", "Payment", "type", "and", "Date"}

def group_words_by_line(words, y_tol=3):
    lines = []
    for w in sorted(words, key=lambda w: (round(w["top"]), w["x0"])):
        placed = False
        for line in lines:
            if abs(line["top"] - w["top"]) <= y_tol:
                line["words"].append(w)
                placed = True
                break
        if not placed:
            lines.append({"top": w["top"], "words": [w]})
    for line in lines:
        line["words"].sort(key=lambda x: x["x0"])
    return sorted(lines, key=lambda l: l["top"])


def parse_amount(text):
    return Decimal(text.replace(",", ""))


def extract_transactions(pdf_path):
    transactions = []
    current_date = None
    HEADER_JUNK = {"2026", "details", "Payment", "type", "and", "Date"}

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            lines = group_words_by_line(page.extract_words())
            pending = None

            for line in lines:
                words = line["words"]
                texts = [w["text"] for w in words]
                joined = "".join(texts)

                if any(m in joined for m in SKIP_MARKERS):
                    continue
                if "Payment" in texts and "type" in texts:
                    continue

                starts_with_date = (
                    len(texts) >= 3 and DATE_RE.match(texts[0]) and MONTH_RE.match(texts[1])
                )
                if starts_with_date:
                    current_date = f"{texts[0]} {texts[1]} {texts[2]}"

                desc_parts = [
                    w["text"] for w in words
                    if DESC_X - 5 <= w["x0"] < PAIDOUT_MIN
                    and not AMOUNT_RE.match(w["text"])
                ]

                amount, direction = None, None
                for w in words:
                    if AMOUNT_RE.match(w["text"]):
                        x = w["x0"]
                        if PAIDOUT_MIN <= x <= PAIDOUT_MAX:
                            amount, direction = -parse_amount(w["text"]), "out"
                        elif PAIDIN_MIN <= x <= PAIDIN_MAX:
                            amount, direction = parse_amount(w["text"]), "in"

                if desc_parts and pending is None:
                    pending = {"date": current_date, "desc_parts": [], "amount": None, "direction": None}

                if pending is not None:
                    pending["desc_parts"].extend(desc_parts)
                    if starts_with_date and pending["date"] is None:
                        pending["date"] = current_date
                    if amount is not None:
                        
                        clean_parts = [p for p in pending["desc_parts"] if p not in HEADER_JUNK]
                        full_desc = " ".join(clean_parts).strip()
                        transactions.append({
                            "date": pending["date"],
                            "description": full_desc,
                            "amount": amount,
                            "direction": direction,
                            "category": categorize(full_desc),
                            "merchant": get_merchant(full_desc),
                        })
                        pending = None

    return transactions


if __name__ == "__main__":
    txns = extract_transactions(PDF_PATH)

    # Per-transaction list
    for t in txns:
        print(f"{t['date'] or '???':10}  {t['category']:18}  {t['merchant']:20}  {t['amount']:>10}")

    # Two-level breakdown: category -> merchant -> total
    nested = defaultdict(lambda: defaultdict(lambda: Decimal("0")))
    for t in txns:
        nested[t["category"]][t["merchant"]] += t["amount"]

    print("\n" + "=" * 55)
    print("SPENDING BY CATEGORY \u2192 MERCHANT")
    print("=" * 55)
    for cat in sorted(nested, key=lambda c: sum(nested[c].values())):
        cat_total = sum(nested[cat].values())
        print(f"\n{cat}  (total: {cat_total})")
        for merch, total in sorted(nested[cat].items(), key=lambda x: x[1]):
            print(f"    {merch:22}  {total:>10}")

    # Reconciliation check
    total_out = sum(t["amount"] for t in txns if t["direction"] == "out")
    total_in  = sum(t["amount"] for t in txns if t["direction"] == "in")
    print(f"\nTotal OUT: {total_out}  (should be -1050.57)")
    print(f"Total IN:  {total_in}  (should be  1087.96)")