#!/usr/bin/env python3
"""Обновляет data/people.json по таблице data/source/persons.xlsx.

Использование:
    pip install openpyxl
    python3 tools/xlsx_to_people.py

Правила слияния:
- персоналия из таблицы ищется в people.json по фамилии (или по имени, если фамилии нет — «Платон»);
- поля, которые ведутся в таблице (даты, места, карьера, связи, награды, вклад, труды…),
  перезаписываются значениями из таблицы, если ячейка не пуста;
- «кураторские» поля сайта (id, name, full, segment, meeting, country, alive, img, bio, note)
  не трогаются — их правят прямо в people.json;
- новые строки таблицы добавляются в конец с segment="base" и meeting=0.
"""
import datetime as dt
import json
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("Нужен openpyxl: pip install openpyxl")

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "data" / "source" / "persons.xlsx"
OUT = ROOT / "data" / "people.json"

COLS = ["first", "middle", "last", "gender", "nationality", "citizenship", "birthDate",
        "deathDate", "deathCause", "birthPlace", "birthCoords", "deathPlace", "deathCoords",
        "alma", "affiliation", "relations", "awards", "fields", "keywords", "contribution",
        "works", "role", "sep", "wiki", "notes"]

# Нормализация учреждений для раздела «Университеты и центры» в атласе
INSTITUTIONS = [
    ("Кембридж", r"Кембридж|Тринити-колледж"),
    ("Оксфорд", r"Оксфорд|Баллиол|Корпус-Кристи|Крайст-Ч[её]рч"),
    ("Гарвард", r"Гарвард"),
    ("MIT", r"\bMIT\b"),
    ("Беркли", r"Беркли"),
    ("Стэнфорд", r"Стэнфорд"),
    ("Пенсильванский ун-т", r"Пенсильванск"),
    ("Колумбийский ун-т", r"Колумбийск"),
    ("Коллеж де Франс", r"Коллеж де Франс"),
    ("Сорбонна", r"Сорбонн"),
    ("EPHE, Париж", r"Высшая практическая школа|EPHE"),
    ("МГУ", r"МГУ|Московский ун-т"),
    ("Женевский ун-т", r"Женевск"),
    ("Чикагский ун-т", r"Чикагск"),
    ("Принстон", r"Принстон"),
    ("Марбургский ун-т", r"Марбург"),
    ("Франкфуртский ун-т", r"Франкфурт"),
    ("Гейдельбергский ун-т", r"Гейдельберг"),
    ("Саарский ун-т", r"Саарск"),
    ("Штутгартский ун-т", r"Штутгарт"),
    ("Венский ун-т", r"Венск"),
    ("Еврейский ун-т, Иерусалим", r"Еврейский ун-т"),
    ("Лидсский ун-т", r"Лидс"),
    ("UCL, Лондон", r"\bUCL\b"),
    ("Мичиганский ун-т", r"Мичиган"),
    ("Вашингтонский ун-т", r"Вашингтонский ун-т"),
    ("Xerox PARC", r"Xerox PARC"),
    ("Google / Facebook AI", r"Google|Facebook"),
]

KEEP = {"id", "name", "full", "segment", "meeting", "country", "alive", "img", "bio", "note"}

TRANSLIT = dict(zip("абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
                    ["a", "b", "v", "g", "d", "e", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p",
                     "r", "s", "t", "u", "f", "kh", "ts", "ch", "sh", "sch", "", "y", "", "e", "yu", "ya"]))


def norm(s):
    return (s or "").strip().lower().replace("ё", "е")


def slug(s):
    return re.sub(r"[^a-z0-9]+", "", "".join(TRANSLIT.get(c, c) for c in norm(s)))


def split_list(v):
    return [x.strip() for x in str(v).split(";") if x.strip()] if v else []


def fmt_date(v):
    """Возвращает (строка для показа, год или None)."""
    if v is None or v == "":
        return "", None
    if isinstance(v, dt.datetime):
        return v.strftime("%d.%m.%Y"), v.year
    if isinstance(v, (int, float)):
        return str(int(v)), int(v)
    s = str(v).strip()
    m = re.fullmatch(r"(\d{1,2})\.(\d{1,2})\.(\d{3,4})", s)
    if m:
        return s, int(m.group(3))
    m = re.fullmatch(r"(\d{4})(\.0)?", s)
    if m:
        return m.group(1), int(m.group(1))
    return s, None


def coords(v):
    if not v:
        return None
    try:
        a, b = [float(x) for x in str(v).split(",")]
        return [a, b]
    except ValueError:
        return None


def institutions(*texts):
    blob = " ".join(t for t in texts if t)
    return [name for name, rx in INSTITUTIONS if re.search(rx, blob)]


def row_to_fields(r):
    x = dict(zip(COLS, r))
    bdate, byear = fmt_date(x["birthDate"])
    ddate, dyear = fmt_date(x["deathDate"])
    out = {
        "gender": x["gender"],
        "nationality": x["nationality"],
        "citizenship": x["citizenship"],
        "birth": {"date": bdate, "year": byear, "place": x["birthPlace"] or "", "coords": coords(x["birthCoords"])},
        "death": {"date": ddate, "year": dyear, "place": x["deathPlace"] or "", "coords": coords(x["deathCoords"]),
                  "cause": x["deathCause"] or ""},
        "alma": x["alma"],
        "affiliation": x["affiliation"],
        "relations": x["relations"],
        "awards": split_list(x["awards"]),
        "fields": split_list(x["fields"]),
        "keywords": split_list(x["keywords"]),
        "contribution": x["contribution"],
        "works": x["works"],
        "role": x["role"],
        "sep": x["sep"],
        "wiki": x["wiki"],
        "xlsxNote": x["notes"],
    }
    out["institutions"] = institutions(x["alma"], x["affiliation"])
    return x, out


def merge(dst, src):
    for k, v in src.items():
        if k in KEEP:
            continue
        if isinstance(v, dict):
            cur = dst.setdefault(k, {})
            for kk, vv in v.items():
                if vv not in (None, "", []):
                    cur[kk] = vv
                else:
                    cur.setdefault(kk, vv)
        elif v not in (None, "", []):
            dst[k] = v
        else:
            dst.setdefault(k, v)


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb["База данных"]
    data = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"people": []}
    people = data["people"]
    index = {norm(p["name"]): p for p in people}
    added = updated = 0
    for r in ws.iter_rows(min_row=5, values_only=True):
        if not any(r[:3]):
            continue
        x, fields = row_to_fields(r)
        key = norm(x["last"] or x["first"])
        p = index.get(key)
        if p is None:
            name = x["last"] or x["first"]
            full = " ".join(filter(None, [x["first"], x["middle"], x["last"]]))
            b, d = fields["birth"]["year"], fields["death"]["year"]
            p = {"id": slug(name), "name": name, "full": full, "segment": "base", "meeting": 0,
                 "country": (x["citizenship"] or "").split("/")[0].split("→")[0].strip(),
                 "alive": not x["deathDate"] and b is not None and b > 1920, "img": "", "bio": "", "note": ""}
            people.append(p)
            index[key] = p
            added += 1
        else:
            updated += 1
        merge(p, fields)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"people.json: обновлено {updated}, добавлено {added}, всего {len(people)}")


if __name__ == "__main__":
    main()
