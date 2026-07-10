from decimal import Decimal

# --- CATEGORY rules (broad bucket). First match wins. ---
CATEGORY_RULES = [
    (["monzo"],                       "Wallet Transfer"),
    (["trading 212", "212tlg"],       "Investment"),
    (["everup"],                      "Gift Card"),
    (["payward", "kraken"],           "Crypto"),
    (["clearbank", "taptap"],         "Crypto"),
    (["longdan ltd"],                 "Income"),
    (["longdan", "iceland", "lidl", "sainsbury", "tesco", "asda", "aldi"], "Groceries"),
    (["pret", "poplar wingspot", "trendy chicken", "great harry",
      "new dallas", "great amwell", "mcdonald", "kfc", "greggs",
      "nando", "dominos"],            "Eating Out"),
    (["tfl", "uber", "trainline", "national rail"], "Transport"),
    (["lycamobile", "lyca", "vodafone", "three", "o2"], "Phone"),
    (["barber", "b&v"],               "Grooming"),
    (["capital one"],                 "Credit Card"),
    (["primark", "tkmaxx", "tk maxx", "amazon", "amzn", "ebay",
      "everest store", "expo international", "woolwich sst"], "Shopping"),
    (["yvonne", "kshitiz","zia ahmadi"],           "Person-to-Person"),
]

# --- MERCHANT rules (clean name = subcategory). First match wins. ---
# Maps messy description keywords to a clean, canonical merchant name.
MERCHANT_RULES = [
    (["primark"],                 "Primark"),
    (["amazon", "amzn"],          "Amazon"),
    (["ebay"],                    "eBay"),
    (["tkmaxx", "tk maxx"],       "TK Maxx"),
    (["lidl"],                    "Lidl"),
    (["iceland"],                 "Iceland"),
    (["sainsbury"],               "Sainsbury's"),
    (["longdan ltd"],             "Longdan Ltd"),      # the employer (income)
    (["longdan"],                 "Longdan"),          # the shop
    (["tfl"],                     "TfL"),
    (["pret"],                    "Pret A Manger"),
    (["poplar wingspot"],         "Poplar Wingspot"),
    (["trendy chicken"],          "Trendy Chicken"),
    (["great harry"],             "Great Harry"),
    (["new dallas"],              "New Dallas"),
    (["lycamobile", "lyca"],      "Lycamobile"),
    (["b&v", "barber"],           "B&V Barber Shop"),
    (["capital one"],             "Capital One"),
    (["trading 212", "212tlg"],   "Trading 212"),
    (["everup"],                  "everup"),
    (["payward"],                 "Kraken"),
    (["clearbank", "taptap"],     "ClearBank Taptap"),
    (["monzo"],                   "Monzo Transfer"),
    (["everest store"],           "Everest Store"),
    (["expo international"],       "Expo International"),
    (["woolwich sst"],            "Woolwich SST"),
    (["yvonne"],                  "Yvonne"),
    (["kshitiz"],                 "Kshitiz"),
]


def categorize(description: str) -> str:
    if not description:
        return "Uncategorized"
    d = description.lower()
    for keywords, category in CATEGORY_RULES:
        if any(kw in d for kw in keywords):
            return category
    return "Uncategorized"


def get_merchant(description: str) -> str:
    """Extract a clean merchant name (used as subcategory)."""
    if not description:
        return "Unknown"
    d = description.lower()
    for keywords, merchant in MERCHANT_RULES:
        if any(kw in d for kw in keywords):
            return merchant
    # Fallback: take the first 2-3 words, title-cased, stripped of junk
    words = description.split()
    return " ".join(words[:2]).title() if words else "Unknown"