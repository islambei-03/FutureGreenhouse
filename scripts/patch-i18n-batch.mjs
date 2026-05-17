import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "src/lib/i18n.ts");
let src = fs.readFileSync(file, "utf8");

const newKeys = [
  "notifications.empty",
  "cultures.hint.title",
  "cultures.hint.body",
  "ai.training.pickRole",
  "ai.training.roleWorker",
  "ai.training.roleWorkerDesc",
  "ai.training.roleAgronomist",
  "ai.training.roleAgronomistDesc",
  "ai.training.pickRoleAgain",
  "ai.training.completeHint",
  "ai.training.module",
  "ai.training.forWhat",
  "ai.training.howTo",
  "ai.training.back",
  "ai.anomaly.legendAnomaly",
  "ai.training.guide.dashboard.purpose",
  "ai.training.guide.dashboard.how",
  "ai.training.guide.greenhouses.purpose",
  "ai.training.guide.greenhouses.how",
  "ai.training.guide.cultures.purpose",
  "ai.training.guide.cultures.how",
  "ai.training.guide.parameters.purpose",
  "ai.training.guide.parameters.how",
  "ai.training.guide.watering.purpose",
  "ai.training.guide.watering.how",
  "ai.training.guide.tasks.purpose",
  "ai.training.guide.tasks.how",
  "ai.training.guide.tasks.tip",
  "ai.training.guide.notifications.purpose",
  "ai.training.guide.notifications.how",
  "ai.training.guide.sensorEntry.purpose",
  "ai.training.guide.sensorEntry.how",
  "ai.training.guide.employees.purpose",
  "ai.training.guide.employees.how",
  "ai.training.guide.reports.purpose",
  "ai.training.guide.reports.how",
  "ai.training.guide.ai.purpose",
  "ai.training.guide.ai.how",
];

const ru = {
  "notifications.empty": "Новых уведомлений нет. Сообщения о задачах и датчиках появятся здесь автоматически.",
  "cultures.hint.title": "Откуда берутся данные в таблице",
  "cultures.hint.body":
    "Каждая строка — культура в конкретной теплице и секции. Посев и сбор — даты, которые вносит агроном. Нормы температуры и влажности — целевые условия для этой культуры. Стадия (посев → рост → цветение → плодоношение → сбор) задаётся вручную; полоска показывает примерный прогресс по этапам. В карточке теплицы отображаются те же названия культур из этой таблицы.",
  "ai.training.pickRole": "Выберите вашу должность — покажем только те разделы, которые вам доступны:",
  "ai.training.roleWorker": "Оператор теплицы",
  "ai.training.roleWorkerDesc": "Полив, задачи, показания датчиков, ручной ввод при сбое датчиков.",
  "ai.training.roleAgronomist": "Агроном",
  "ai.training.roleAgronomistDesc": "Культуры, отчёты, сотрудники, ИИ-анализ и настройка норм.",
  "ai.training.pickRoleAgain": "Сменить роль",
  "ai.training.completeHint": "Можно вернуться в любой раздел меню слева. При необходимости пройдите инструкцию снова.",
  "ai.training.module": "Раздел системы",
  "ai.training.forWhat": "Зачем нужен",
  "ai.training.howTo": "Как пользоваться",
  "ai.training.back": "Назад",
  "ai.anomaly.legendAnomaly": "Красная точка на графике — аномалия",
  "ai.training.guide.dashboard.purpose": "Общая картина по всем теплицам: что в норме, где есть тревоги.",
  "ai.training.guide.dashboard.how": "Откройте главную после входа. Смотрите карточки теплиц и блок рекомендаций — с чего начать смену.",
  "ai.training.guide.greenhouses.purpose": "Список теплиц, ответственный оператор и что сейчас растёт.",
  "ai.training.guide.greenhouses.how": "Выберите теплицу. В карточке видны культуры из раздела «Культуры», последние показания и ближайший полив.",
  "ai.training.guide.cultures.purpose": "Учёт посевов: что, где и на какой стадии роста.",
  "ai.training.guide.cultures.how": "Добавляйте или редактируйте культуру: теплица, секция, даты посева и сбора, нормы и стадия. Эти же названия видны в карточке теплицы.",
  "ai.training.guide.parameters.purpose": "Графики температуры, влажности и CO₂ с датчиков.",
  "ai.training.guide.parameters.how": "Выберите теплицу и период. Если линия выходит за зелёную зону — проверьте вентиляцию или полив.",
  "ai.training.guide.watering.purpose": "Расписание полива и отметка о выполнении.",
  "ai.training.guide.watering.how": "Смотрите ближайшие поливы. После полива отметьте выполнение — так агроном видит факт в отчётах.",
  "ai.training.guide.tasks.purpose": "Поручения на смену: что сделать и к какому сроку.",
  "ai.training.guide.tasks.how": "Откройте список задач. Нажмите «Отметить выполненной», когда работа сделана.",
  "ai.training.guide.tasks.tip": "О новой задаче придёт уведомление в колокольчик.",
  "ai.training.guide.notifications.purpose": "Сообщения о задачах, датчиках и важных событиях.",
  "ai.training.guide.notifications.how": "Красная полоска слева — тревога. Нажмите на непрочитанное, чтобы отметить прочитанным.",
  "ai.training.guide.sensorEntry.purpose": "Ручной ввод температуры и влажности, если датчик не работает.",
  "ai.training.guide.sensorEntry.how": "Выберите теплицу, введите показания и сохраните. Данные попадут в графики как обычные замеры.",
  "ai.training.guide.employees.purpose": "Операторы теплиц: кто за какую теплицу отвечает.",
  "ai.training.guide.employees.how": "Проверяйте контакты и привязку к теплице. Оператор видит в системе только свою зону.",
  "ai.training.guide.reports.purpose": "Сводки за период: урожайность, полив, отклонения.",
  "ai.training.guide.reports.how": "Выберите период и теплицу. Экспортируйте PDF для совещания или отчёта руководству.",
  "ai.training.guide.ai.purpose": "Прогноз, советы, карта рисков, анализ фото и план недели.",
  "ai.training.guide.ai.how": "Переключайте вкладки вверху. Внизу каждой вкладки — простое объяснение, как считается результат.",
  "ai.info.forecast.title": "Как работает прогноз",
  "ai.info.forecast.body":
    "Система смотрит, как менялись температура и влажность за последние 7 дней, и продолжает эту тенденцию на ближайшие дни. Если прогноз выходит за зелёную зону норм теплицы — показываем предупреждение. Это ориентир для агронома, а не точный прогноз погоды.",
  "ai.info.forecast.data": "Показания датчиков за 7 дней и допустимые нормы из карточки теплицы.",
  "ai.info.anomaly.title": "Как работает поиск аномалий",
  "ai.info.anomaly.body":
    "Программа сравнивает каждое новое замерение с обычным уровнем за выбранный период. Резкий скачок или сильное отклонение от привычного — отмечается красной точкой. OpenAI здесь не используется — расчёт идёт на сервере по вашим данным.",
  "ai.info.anomaly.data": "История датчиков за 7 или 14 дней по выбранной теплице.",
  "ai.info.chat.title": "Как работает чат",
  "ai.info.chat.body":
    "Вы задаёте вопрос обычными словами. Ассистент подставляет актуальные данные из базы: теплицы, датчики, задачи, полив. Ответ формирует нейросеть GPT-4o-mini; история диалога сохраняется в системе.",
  "ai.info.chat.data": "Теплицы, датчики, задачи, полив и культуры из базы данных.",
  "ai.info.map.title": "Как работает карта",
  "ai.info.map.body":
    "Цвет блока показывает «здоровье» теплицы от 0 до 100%: учитываются датчики, просроченные задачи и полив. Нажмите на блок — получите краткую текстовую сводку от ИИ.",
  "ai.info.map.data": "Текущие показания, задачи и полив по каждой теплице.",
  "ai.info.recommendations.title": "Как работают советы",
  "ai.info.recommendations.body":
    "Список подсказок строится по правилам: температура или влажность вне нормы, просроченные задачи, статус теплицы. Обновляется при открытии вкладки.",
  "ai.info.recommendations.data": "Датчики, задачи, полив и статусы теплиц.",
  "ai.info.vision.title": "Как работает анализ фото",
  "ai.info.vision.body":
    "Вы загружаете снимок растения, листа или урожая. Фото отправляется в GPT-4o Vision: модель опишет состояние и предложит, что проверить или сделать. Снимок в базе не хранится.",
  "ai.info.vision.data": "Только загруженное изображение (без сохранения в БД).",
  "ai.info.planner.title": "Как работает планировщик",
  "ai.info.planner.body":
    "ИИ предлагает план работ на 7 дней с учётом открытых задач и расписания полива. План можно отредактировать и сохранить в системе.",
  "ai.info.planner.data": "Задачи, полив и список теплиц.",
  "ai.info.training.title": "Инструкция для новых сотрудников",
  "ai.info.training.body":
    "Пошаговый тур по разделам меню в зависимости от роли: оператор или агроном. Без тестов на память — только что за что отвечает и как пользоваться.",
  "ai.info.training.data": "Тексты подсказок в приложении (не требует интернета).",
};

for (const key of newKeys) {
  if (!src.includes(`| "${key}"`)) {
    src = src.replace('| "ai.training.s5.text"', `| "ai.training.s5.text"\n  | "${key}"`);
  }
}

for (const [key, value] of Object.entries(ru)) {
  const re = new RegExp(`"${key.replace(/\./g, "\\.")}": "[^"]*(?:\\\\.[^"]*)*",`, "m");
  if (re.test(src)) {
    src = src.replace(re, `"${key}": ${JSON.stringify(value)},`);
  } else {
    src = src.replace(
      /("ai\.training\.s1\.title": "Добро пожаловать",)/,
      `"${key}": ${JSON.stringify(value)},\n  $1`,
    );
  }
}

// KK: copy RU for new keys only
const kkBlockStart = src.indexOf('export const kk: Record<I18nKey, string> = {');
const ruBlockEnd = src.indexOf("export const kk:");
const ruBlock = src.slice(0, ruBlockEnd);
let kkBlock = src.slice(kkBlockStart);

for (const key of newKeys) {
  if (!kkBlock.includes(`"${key}"`)) {
    const val = ru[key];
    if (val) {
      kkBlock = kkBlock.replace(
        /("ai\.training\.s1\.title":)/,
        `"${key}": ${JSON.stringify(val)},\n  $1`,
      );
    }
  }
}

for (const [key, value] of Object.entries(ru)) {
  if (!newKeys.includes(key) && !key.startsWith("ai.info.")) continue;
  const re = new RegExp(`("${key.replace(/\./g, "\\.")}": )"[^"]*(?:\\\\.[^"]*)*",`, "m");
  if (re.test(kkBlock)) {
    kkBlock = kkBlock.replace(re, `$1${JSON.stringify(value)},`);
  } else if (newKeys.includes(key) || key.startsWith("ai.info.")) {
    kkBlock = kkBlock.replace(
      /("notifications\.clickToMarkRead": "[^"]+",)/,
      `$1\n  "${key}": ${JSON.stringify(value)},`,
    );
  }
}

src = ruBlock + kkBlock;
fs.writeFileSync(file, src);
console.log("patched i18n");
