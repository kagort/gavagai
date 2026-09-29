# gavagAI — сайт семинара

Статический сайт (GitHub Pages): https://kagort.github.io/gavagai/

## Страницы

| Файл | Что это |
|---|---|
| `index.html` | Главная: о семинаре, линия встреч, три блока программы |
| `meetings.html` | Все встречи с поиском и фильтрами (линия, аудио, конспект) |
| `meeting.html?id=N` | Страница встречи: кратко, цель, план, литература, понятия, персоналии, аудио, конспект с оглавлением |
| `people.html` | Каталог персоналий: поиск, фильтры по линии, теме, встрече, статусу, алфавиту |
| `person.html?id=…` | Досье персоналии (+ биография из `.md`, если есть) |
| `topics.html` | Темы и алфавитный словарь понятий |
| `metro.html` | Схема «Линия „Гавагай“» (станция «вы здесь» считается по текущей дате) |
| `atlas.html` | Дашборд: линия времени, карта, граф связей, встречи, темы, университеты, статистика |

Поиск по всему сайту: кнопка «Поиск» в шапке, `Ctrl+K` / `⌘K` или `/`.
Старые адреса `biography.html` и `common.html?type=…&id=…` перенаправляют на новые страницы.

## Как обновлять данные

Все данные лежат в `data/`:

- **`data/meetings.json`**: встречи. Поля: `id`, `date` (`ГГГГ-ММ-ДД`), `time`, `title`, `short` (название станции),
  `segment` (`phil` / `tech` / `synth`), `summary` (абзацы), `question`, `tags`, `authors`, `goal`, `plan`,
  `literature` и `additional` (`{title, url}`), `concepts`, `audio` и `notes` (пути к `.mp3` и `.md` в `materials/meetings/`).
  Чтобы добавить аудио или конспект, положите файл в `materials/meetings/` и пропишите путь.
- **`data/people.json`**: персоналии. Кураторские поля: `id`, `name`, `full`, `segment`, `meeting`, `country`, `alive`,
  `img` (фото), `bio` (биография `.md`), `note`. Остальное генерируется из таблицы (см. ниже).
- **`data/themes.json`**: темы (`id`, `title`, `description`, `people`, `meetings`).
- **`data/edges.json`**: связи для графа (`type`: `teacher`, `coauthor`, `colleague`, `opponent`, `idea`).

### База персоналий из Excel

Исходная таблица: `data/source/persons.xlsx`. После её правки выполните:

```bash
pip install openpyxl
python3 tools/xlsx_to_people.py
```

Скрипт обновит `data/people.json` (сопоставляет строки по фамилии) и сохранит кураторские поля.
Новые строки таблицы добавятся с `segment: "phil"` (философские основания); линию и встречу можно поправить вручную.

## Локальный просмотр

Страницы загружают JSON через `fetch`, поэтому открывать файлы двойным щелчком нельзя. Запустите сервер:

```bash
python3 -m http.server 8000   # затем http://localhost:8000
```

## Библиотеки

Leaflet, Chart.js, d3, marked и topojson-client лежат в `scripts/vendor/`, контуры стран — в `data/geo/`.
Сайт не зависит от CDN: карта в атласе рисуется даже без доступа к серверам тайлов.
