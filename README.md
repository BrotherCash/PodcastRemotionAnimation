# PodcastRemotionAnimation

Пайплайн, который превращает аудиофайл подкаста в готовое вертикальное
видео (1080×1920, формат Reels/Shorts/TikTok) со сплит-скрин раскладкой:

- **верх** — цветной слайд текущей темы разговора: сплошной фон в цвете
  активного спикера, крупная SVG-иллюстрация в «стикер»-стиле (жирная
  обводка, твёрдая тень) и центрированные заголовок + тезисы, с плавным
  fade+slide переходом между темами;
- **низ** — два ведущих на фоне студии: активный спикер выделяется
  **яркостью** портрета (не размером/рамкой) — 100% против 40% у
  неактивного, плюс лёгкая процедурная анимация рта;
- **по центру** — пословные субтитры на затемнённой плашке с подсветкой
  текущего слова.

Вся вёрстка, анимации и субтитры сделаны средствами Remotion
(React/SVG/CSS) — без After Effects, Canva-рендеринга видео и т.п.
Единственные внешние ассеты — портреты ведущих и фон студии (см. раздел
про их подготовку ниже), это картинки в `public/`, а не код.

## Пайплайн целиком

```
аудио (.mp3)
  → WhisperX (транскрипт + диаризация спикеров)
  → normalize_transcript.mjs (captions.json + turns.json + transcript.md)
  → ручная/LLM-генерация scenes.json (разбивка на смысловые сцены)
  → npx remotion render (готовое .mp4)
```

Каждый шаг подробно расписан с командами в [`scripts/README.md`](scripts/README.md).
Ниже — конспект для быстрого старта и переиспользования на новом эпизоде.

## Быстрый старт

```bash
npm install
npm run dev            # Remotion Studio, http://localhost:3000
```

В Studio доступны две композиции:

- **`PodcastVideo`** — демо на рукописных sample-данных
  (`public/data/sample.*`), для проверки вёрстки без реального эпизода.
- **`PodcastVideo-hyperframes`** — реальный готовый эпизод, на нём
  проверялся весь пайплайн end-to-end.

Рендер в файл:

```bash
npx remotion render PodcastVideo-hyperframes out/video.mp4
npx remotion render PodcastVideo out/sample.mp4
```

`out/` в `.gitignore` — рендер локальный, в репозиторий не попадает.

## Как сделать новое видео по этому шаблону

Шаблон рассчитан на добавление новых эпизодов без правок компонентов —
меняются только данные (`public/data/<episode>.*`, `public/audio/<episode>.mp3`)
и, при первом использовании, пара строк конфига под нового спикера.

### 1. Транскрибация и диаризация

```bash
cd scripts
python -m venv .venv && .venv\Scripts\activate   # Windows; source .venv/bin/activate на macOS/Linux
pip install -r requirements.txt

KMP_DUPLICATE_LIB_OK=TRUE OMP_NUM_THREADS=1 python transcribe_diarize.py \
  path/to/episode.mp3 out/episode.raw.json --batch-size 4
```

Нужен разовый бесплатный токен Hugging Face для pyannote (диаризация
спикеров) — детали и ссылки на модели в `scripts/README.md`.

### 2. Нормализация

```bash
node scripts/normalize_transcript.mjs scripts/out/episode.raw.json episode02 \
  --speaker-map SPEAKER_00=host1,SPEAKER_01=host2
```

Создаёт три файла в `public/data/`:

- `episode02.captions.json` — пословные субтитры (`Caption[]`)
- `episode02.turns.json` — точные границы реплик по спикерам (драйвер
  «яркостной» подсветки активного ведущего)
- `episode02.transcript.md` — компактный транскрипт с метками спикеров,
  человекочитаемый, для следующего шага

### 3. Разбивка на сцены (`scenes.json`)

Самый творческий шаг — делается вручную или через LLM (в этом проекте
делалось Claude Code, читая `transcript.md`). Нужно порезать разговор на
смысловые куски по 15–30 сек без пропусков и наложений
(`scenes[i].endMs === scenes[i+1].startMs`) и заполнить схему из
`src/schema.ts`:

```ts
type Scene = {
  sceneId: string;
  startMs: number;
  endMs: number;
  activeSpeaker: "host1" | "host2" | "both";
  slide: {
    title: string;
    bullets: string[];
    icon: string;       // имя иконки lucide-react — оставлено как фолбэк, не рендерится
    category:            // определяет, какая SVG-иллюстрация покажется на слайде
      | "spark"          // вступление/идея/магия — монитор с разлетающимися кадрами
      | "dataOverload"    // серверы с переполненными «катушками» — тема про объём данных
      | "aiReads"          // робот с лупой читает waveform/текст — тема про анализ ИИ
      | "codeBuilds"        // окно кода + вылетающий видео-кадр — тема про написание кода
      | "rhythm"              // вертушка DJ + звуковые полосы — тема про ритм/монтаж
      | "comparison"           // весы с двумя предметами — сравнение двух подходов
      | "selfCheck"             // чек-лист + лупа + круговая стрелка — тема про проверку/итерации
      | "humanAI";               // человек и робот дают пять — тема про совместную работу
  };
};
```

8 категорий иллюстраций переиспользуются на всех сценах эпизода — рисовать
уникальную картинку под каждую сцену нецелесообразно. Если ни одна
категория не подходит по смыслу — нужно нарисовать новую функцию
`IllustrationXxx` в `src/components/TopicSlides.tsx` и добавить её в
маппинг `ILLUSTRATIONS`, а также новое значение в
`slideIllustrationCategorySchema` (`src/schema.ts`).

Готовый эпизод см. как референс: `public/data/podcast_remotion_hyperframes.scenes.json`.

### 4. Портреты ведущих (один раз на персонажа)

Каждому ведущему нужны три PNG с прозрачным фоном в `public/characters/`:
`<photoBase>-closed.png`, `-half.png`, `-open.png` (положения рта — для
процедурной анимации разговора). Делались через Canva AI
(`generate-image` + `remove-background`): сначала базовый портрет с
закрытым ртом, затем image-to-image с тем же референсом и промптом
«тот же персонаж/поза/стиль/фон/наушники, рот в положении …» для
остальных двух состояний — так гарантируется, что все три состояния — один
и тот же человек. Если Canva уходит в rate limit — рабочая альтернатива
в этой же сессии — дизайн-канвас Claude (`Artifact` tool,
`action: "quickstart"`, `intent: "design"`), но он требует отдельной
авторизации пользователем.

Готовые наборы для двух ведущих уже есть в `public/characters/`
(`host1-turned-*`/`host2-turned-*` — активный вариант, развёрнутые на
3/4 друг к другу профили). Для нового эпизода с теми же ведущими этот
шаг не нужен — используйте существующий `photoBase`.

### 5. Фон студии (один раз)

Фото студии — просто картинка, добавляется вручную в
`public/backgrounds/` и подключается путём в `src/components/HostsRow.tsx`
(`staticFile("backgrounds/bg_1.png")`). Меняется по мере необходимости.

### 6. Аудио + рендер

Положите файл в `public/audio/episode02.mp3` и либо добавьте новую
`<Composition>` в `src/Composition.tsx` (скопируйте блок
`PodcastVideo-hyperframes` как шаблон) для проверки в Studio, либо
передайте пропсы прямо при рендере:

```bash
npx remotion render PodcastVideo out/episode02.mp4 \
  --props='{
    "episodeId":"episode02",
    "audioSrc":"audio/episode02.mp3",
    "scenesUrl":"data/episode02.scenes.json",
    "captionsUrl":"data/episode02.captions.json",
    "turnsUrl":"data/episode02.turns.json",
    "hosts":{
      "host1":{"label":"Ведущий","color":"#2f6fed","photoBase":"host1-turned"},
      "host2":{"label":"Ведущая","color":"#e0479e","photoBase":"host2-turned"}
    }
  }'
```

Длительность видео вычисляется автоматически из реальной длины аудио
(`calculateMetadata` в `Composition.tsx`) — руками её указывать не нужно.

## Структура проекта

```
src/
  Composition.tsx          — регистрация композиций, calculateMetadata
  PodcastVideo.tsx          — корневой компонент (слайды + ведущие + субтитры + аудио)
  schema.ts                  — zod-схемы: единый источник истины для *.json данных
  components/
    TopicSlides.tsx            — верхняя половина: цветные слайды + SVG-иллюстрации
    HostsRow.tsx                — нижняя половина: раскладка ведущих + фон студии
    HostAvatar.tsx                — один портрет: яркость активности + анимация рта
    CaptionsOverlay.tsx            — пословные субтитры на плашке
  lib/getAudioDuration.ts          — длительность аудио через mediabunny

scripts/
  transcribe_diarize.py     — WhisperX: аудио → транскрипт + диаризация (Python)
  normalize_transcript.mjs  — сырой JSON → captions/turns/transcript.md (Node)
  README.md                 — подробный пошаговый гайд по препроцессингу

public/
  audio/<episode>.mp3
  data/<episode>.{scenes,captions,turns}.json, <episode>.transcript.md
  characters/<photoBase>-{closed,half,open}.png
  backgrounds/bg_1.png
```

## Технологии

Remotion 4, React 19, TypeScript, zod (валидация схем данных), Tailwind
(частично), `@remotion/captions` (субтитры), `mediabunny` (метаданные
аудио), WhisperX + pyannote (транскрибация и диаризация, Python).

## Команды

```bash
npm run dev        # Remotion Studio (превью)
npm run lint        # eslint src && tsc --noEmit
npx remotion render PodcastVideo-hyperframes out/video.mp4   # реальный эпизод
npx remotion render PodcastVideo out/sample.mp4                # sample/dev
```

## Подробнее

- [`CLAUDE.md`](CLAUDE.md) — компактный технический срез архитектуры,
  принятых решений и известных gotcha (над чем спотыкались и как чинили)
  для тех, кто продолжает разработку.
- [`scripts/README.md`](scripts/README.md) — полный пошаговый гайд по
  препроцессингу аудио с командами и troubleshooting.
