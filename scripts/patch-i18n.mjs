import fs from "fs";

const p = new URL("../src/lib/i18n.ts", import.meta.url);
let s = fs.readFileSync(p, "utf8");

const typeKeys = `
  | "ai.tab.anomaly"
  | "ai.tab.training"
  | "ai.vision.hint"
  | "ai.anomaly.title"
  | "ai.anomaly.subtitle"
  | "ai.anomaly.run"
  | "ai.anomaly.days"
  | "ai.anomaly.failed"
  | "ai.anomaly.chartTemp"
  | "ai.anomaly.chartHum"
  | "ai.anomaly.legend"
  | "ai.anomaly.flagTemp"
  | "ai.anomaly.flagHum"
  | "ai.anomaly.flagOk"
  | "ai.training.title"
  | "ai.training.subtitle"
  | "ai.training.progress"
  | "ai.training.guide"
  | "ai.training.next"
  | "ai.training.finish"
  | "ai.training.restart"
  | "ai.training.complete"
  | "ai.training.score"
  | "ai.training.correct"
  | "ai.training.wrong"
  | "ai.training.s1.title"
  | "ai.training.s1.text"
  | "ai.training.s2.title"
  | "ai.training.s2.text"
  | "ai.training.s2.q"
  | "ai.training.s2.a1"
  | "ai.training.s2.a2"
  | "ai.training.s2.a3"
  | "ai.training.s3.title"
  | "ai.training.s3.text"
  | "ai.training.s3.q"
  | "ai.training.s3.a1"
  | "ai.training.s3.a2"
  | "ai.training.s4.title"
  | "ai.training.s4.text"
  | "ai.training.s4.q"
  | "ai.training.s4.a1"
  | "ai.training.s4.a2"
  | "ai.training.s5.title"
  | "ai.training.s5.text"
  | "ai.info.dataLabel"
  | "ai.info.chat.title"
  | "ai.info.chat.body"
  | "ai.info.chat.data"
  | "ai.info.map.title"
  | "ai.info.map.body"
  | "ai.info.map.data"
  | "ai.info.forecast.title"
  | "ai.info.forecast.body"
  | "ai.info.forecast.data"
  | "ai.info.anomaly.title"
  | "ai.info.anomaly.body"
  | "ai.info.anomaly.data"
  | "ai.info.recommendations.title"
  | "ai.info.recommendations.body"
  | "ai.info.recommendations.data"
  | "ai.info.vision.title"
  | "ai.info.vision.body"
  | "ai.info.vision.data"
  | "ai.info.planner.title"
  | "ai.info.planner.body"
  | "ai.info.planner.data"
  | "ai.info.training.title"
  | "ai.info.training.body"
  | "ai.info.training.data"
  | "tasks.markDone"`;

if (!s.includes('"ai.tab.anomaly"')) {
  s = s.replace('  | "ai.planner.failed"', `  | "ai.planner.failed"${typeKeys}`);
}

const ru = {
  "ai.tab.anomaly": "Аномалии",
  "ai.tab.training": "Обучение",
  "ai.vision.hint": "Можно загружать растение, плод, лист, урожай или проблему на фото.",
  "ai.anomaly.title": "Детектор аномалий",
  "ai.anomaly.subtitle": "Красные точки на графике — необычные скачки температуры и влажности по истории датчиков.",
  "ai.anomaly.run": "Найти аномалии",
  "ai.anomaly.days": "дн.",
  "ai.anomaly.failed": "Не удалось построить анализ",
  "ai.anomaly.chartTemp": "Температура °C",
  "ai.anomaly.chartHum": "Влажность %",
  "ai.anomaly.legend": "● Крупная красная точка — аномалия (статистический выброс или резкий скачок)",
  "ai.anomaly.flagTemp": "Аномалия температуры",
  "ai.anomaly.flagHum": "Аномалия влажности",
  "ai.anomaly.flagOk": "В норме",
  "ai.training.title": "Режим обучения",
  "ai.training.subtitle": "Интерактивный тур для новых операторов с проверкой знаний.",
  "ai.training.progress": "Шаг",
  "ai.training.guide": "AI-гид",
  "ai.training.next": "Далее",
  "ai.training.finish": "Завершить",
  "ai.training.restart": "Пройти снова",
  "ai.training.complete": "Тур завершён!",
  "ai.training.score": "Правильных ответов",
  "ai.training.correct": "Верно! Можно идти дальше.",
  "ai.training.wrong": "Не совсем. Прочитайте подсказку ещё раз.",
  "ai.training.s1.title": "Добро пожаловать",
  "ai.training.s1.text": "Future Greenhouse объединяет датчики, задачи, полив и ИИ. Вы будете отвечать за свою теплицу.",
  "ai.training.s2.title": "Параметры",
  "ai.training.s2.text": "На странице «Параметры» смотрите графики температуры и влажности в реальном времени.",
  "ai.training.s2.q": "Где смотреть текущие показания датчиков?",
  "ai.training.s2.a1": "Только в отчётах за месяц",
  "ai.training.s2.a2": "В разделе «Параметры»",
  "ai.training.s2.a3": "В профиле пользователя",
  "ai.training.s3.title": "Задачи",
  "ai.training.s3.text": "Вам приходят задачи в разделе «Задачи». Отметьте выполнение галочкой или кнопкой.",
  "ai.training.s3.q": "Кто может отметить задачу выполненной?",
  "ai.training.s3.a1": "Назначенный оператор (рабочий)",
  "ai.training.s3.a2": "Только директор",
  "ai.training.s4.title": "Уведомления",
  "ai.training.s4.text": "При новой задаче приходит уведомление в колокольчик. Алерты датчиков видят все.",
  "ai.training.s4.q": "Куда приходит уведомление о новой задаче?",
  "ai.training.s4.a1": "Только агроному",
  "ai.training.s4.a2": "Ответственному оператору",
  "ai.training.s5.title": "ИИ-ассистент",
  "ai.training.s5.text": "Карта теплиц, прогноз, анализ фото и план недели — во вкладке «ИИ». Внизу каждой вкладки есть пояснение.",
  "ai.info.dataLabel": "Источник данных",
  "ai.info.chat.title": "Как работает чат",
  "ai.info.chat.body": "GPT-4o-mini отвечает с учётом текущих показаний теплиц, задач и полива из базы. История сохраняется в ai_chat_history.",
  "ai.info.chat.data": "Таблицы greenhouses, sensor_data, tasks, watering_schedule, cultures; OPENAI_API_KEY.",
  "ai.info.map.title": "Как работает карта",
  "ai.info.map.body": "Цвет блока = оценка здоровья 0–100% (датчики, просроченные задачи, полив). Клик — краткая AI-сводка по теплице.",
  "ai.info.map.data": "computeGreenhouseHealth(); при клике — buildSingleGreenhouseContext + gpt-4o-mini.",
  "ai.info.forecast.title": "Как работает прогноз",
  "ai.info.forecast.body": "Линейная экстраполяция по 7 дням истории датчиков + зоны риска по нормам теплицы.",
  "ai.info.forecast.data": "sensor_data за 7 дней; нормы temp/humidity из greenhouses.",
  "ai.info.anomaly.title": "Как работает детектор",
  "ai.info.anomaly.body": "Z-score по истории и порог резкого скачка между соседними точками. Без вызова OpenAI — быстрый математический анализ.",
  "ai.info.anomaly.data": "sensor_data за 7/14 дней по выбранной теплице.",
  "ai.info.recommendations.title": "Как работают советы",
  "ai.info.recommendations.body": "Правила на сервере: отклонения датчиков, просрочки, статус теплицы. Обновляются при открытии вкладки.",
  "ai.info.recommendations.data": "Датчики, tasks, watering_schedule, greenhouses.",
  "ai.info.vision.title": "Как работает анализ фото",
  "ai.info.vision.body": "Изображение отправляется в GPT-4o Vision. Подходит растение, плод, лист, урожай — модель опишет состояние и даст рекомендации.",
  "ai.info.vision.data": "Загрузка файла → /api/ai/vision → OpenAI gpt-4o (не сохраняется в БД).",
  "ai.info.planner.title": "Как работает планировщик",
  "ai.info.planner.body": "GPT-4o-mini строит план на 7 дней по открытым задачам и поливам. Можно редактировать и сохранить.",
  "ai.info.planner.data": "tasks, watering_schedule, greenhouses; сохранение в app_settings (ai_week_plan).",
  "ai.info.training.title": "Режим обучения",
  "ai.info.training.body": "Локальный сценарий онбординга: шаги и вопросы без отправки в OpenAI. Для новых операторов.",
  "ai.info.training.data": "Статический контент в приложении (i18n).",
  "tasks.markDone": "Отметить выполненной",
};

const kk = { ...ru,
  "ai.tab.anomaly": "Аномалия",
  "ai.tab.training": "Оқыту",
  "ai.vision.hint": "Өсімдік, жеміс, жапырақ немесе мәселені жүктеуге болады.",
  "ai.training.correct": "Дұрыс! Келесіге өтіңіз.",
  "ai.training.wrong": "Дұрыс емес. Қайта оқыңыз.",
  "tasks.markDone": "Орындалды деп белгілеу",
};

for (const [k, v] of Object.entries(ru)) {
  if (!s.includes(`"${k}":`)) {
    s = s.replace(`  "ai.planner.failed": "Не удалось составить план",`, `  "ai.planner.failed": "Не удалось составить план",\n  "${k}": ${JSON.stringify(v)},`);
  }
}

for (const [k, v] of Object.entries(kk)) {
  const marker = `  "ai.planner.failed": "Жоспар құрылмады",`;
  if (!s.includes(`"${k}":`) && s.includes(marker)) {
    s = s.replace(marker, `${marker}\n  "${k}": ${JSON.stringify(v)},`);
  }
}

fs.writeFileSync(p, s);
console.log("i18n patched");
