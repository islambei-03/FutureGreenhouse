export type Locale = "ru" | "kk";

export const LOCALE_STORAGE_KEY = "fg_locale";
export const LOCALE_COOKIE_NAME = "fg_locale";

export const LocaleLabel: Record<Locale, string> = {
  ru: "RU",
  kk: "KZ",
};

export type I18nKey =
  | "app.title"
  | "sidebar.system"
  | "sidebar.user.online"
  | "common.loading"
  | "common.search"
  | "common.apply"
  | "common.reset"
  | "common.open"
  | "common.add"
  | "common.save"
  | "common.saving"
  | "common.cancel"
  | "common.edit"
  | "common.delete"
  | "common.viewOnly"
  | "common.notSpecified"
  | "nav.dashboard"
  | "nav.greenhouses"
  | "nav.cultures"
  | "nav.parameters"
  | "nav.watering"
  | "nav.tasks"
  | "nav.employees"
  | "nav.reports"
  | "nav.notifications"
  | "nav.ai"
  | "nav.sensorEntry"
  | "nav.users"
  | "nav.db"
  | "dashboard.kpi.activeGreenhouses"
  | "dashboard.kpi.avgTemp"
  | "dashboard.kpi.cultures"
  | "dashboard.kpi.staffToday"
  | "dashboard.kpi.tasksCompletion"
  | "dashboard.period.day"
  | "dashboard.period.week"
  | "dashboard.period.month"
  | "dashboard.monitoring.title"
  | "dashboard.monitoring.subtitle"
  | "dashboard.table.greenhouse"
  | "dashboard.table.temperature"
  | "dashboard.table.humidity"
  | "dashboard.table.co2"
  | "dashboard.table.status"
  | "dashboard.todayTasks.title"
  | "dashboard.todayTasks.subtitle"
  | "dashboard.todayTasks.noTasks"
  | "dashboard.charts.tempByGreenhouse"
  | "dashboard.charts.co2ByGreenhouse"
  | "dashboard.charts.tasksSplit"
  | "dashboard.charts.tasksDone"
  | "dashboard.charts.tasksOpen"
  | "greenhouses.title"
  | "greenhouses.subtitle"
  | "greenhouses.add"
  | "greenhouses.type"
  | "greenhouses.area"
  | "greenhouses.temperature"
  | "greenhouses.humidity"
  | "greenhouses.co2"
  | "greenhouses.nextWatering"
  | "greenhouses.responsible"
  | "greenhouses.culturesNone"
  | "greenhouses.confirmDelete"
  | "greenhouses.modal.addTitle"
  | "greenhouses.modal.editTitle"
  | "greenhouses.field.name"
  | "greenhouses.field.type"
  | "greenhouses.field.area"
  | "greenhouses.field.tempNorm"
  | "greenhouses.field.humidityNorm"
  | "greenhouses.field.responsible"
  | "greenhouses.field.status"
  | "greenhouses.field.notes"
  | "greenhouses.type.glass"
  | "greenhouses.type.poly"
  | "greenhouses.type.film"
  | "greenhouses.status.active"
  | "greenhouses.status.maintenance"
  | "greenhouses.status.off"
  | "cultures.title"
  | "cultures.subtitle"
  | "cultures.add"
  | "cultures.searchPlaceholder"
  | "cultures.allGreenhouses"
  | "cultures.table.name"
  | "cultures.table.greenhouse"
  | "cultures.table.section"
  | "cultures.table.planted"
  | "cultures.table.harvest"
  | "cultures.table.norms"
  | "cultures.table.stage"
  | "cultures.table.actions"
  | "cultures.modal.addTitle"
  | "cultures.modal.editTitle"
  | "cultures.field.name"
  | "cultures.field.greenhouse"
  | "cultures.field.section"
  | "cultures.field.plantedDate"
  | "cultures.field.harvestDate"
  | "cultures.field.tempNorm"
  | "cultures.field.humidityNorm"
  | "cultures.field.stage"
  | "cultures.field.progress"
  | "cultures.field.notes"
  | "cultures.notFound"
  | "cultures.confirmDelete"
  | "parameters.title"
  | "parameters.subtitle"
  | "parameters.range.day"
  | "parameters.range.week"
  | "parameters.temperature"
  | "parameters.humidity"
  | "parameters.charts.temperature"
  | "parameters.charts.humidity"
  | "parameters.charts.noData"
  | "parameters.table.title"
  | "parameters.table.subtitle"
  | "parameters.table.greenhouse"
  | "parameters.table.temperature"
  | "parameters.table.humidity"
  | "parameters.table.co2"
  | "parameters.table.time"
  | "watering.title"
  | "watering.subtitle"
  | "watering.scheduledToday"
  | "watering.timeline.title"
  | "watering.timeline.subtitle"
  | "watering.timeline.none"
  | "watering.status.done"
  | "watering.status.planned"
  | "watering.markDone"
  | "watering.add.title"
  | "watering.add.subtitleAllowed"
  | "watering.add.subtitleDenied"
  | "watering.field.greenhouse"
  | "watering.field.type"
  | "watering.field.date"
  | "watering.field.time"
  | "watering.field.duration"
  | "watering.field.volume"
  | "watering.field.notes"
  | "watering.add.adding"
  | "watering.add.add"
  | "watering.confirmDelete"
  | "watering.week.title"
  | "watering.week.subtitle"
  | "watering.week.none"
  | "tasks.title"
  | "tasks.subtitle"
  | "tasks.total"
  | "tasks.filters.all"
  | "tasks.filters.active"
  | "tasks.filters.done"
  | "tasks.filters.urgent"
  | "tasks.searchPlaceholder"
  | "tasks.assignee"
  | "tasks.greenhouse"
  | "tasks.deadline"
  | "tasks.assigneeNotAssigned"
  | "tasks.noneByFilter"
  | "tasks.create.title"
  | "tasks.create.subtitleAllowed"
  | "tasks.create.subtitleDenied"
  | "tasks.field.title"
  | "tasks.field.description"
  | "tasks.field.assignee"
  | "tasks.field.greenhouse"
  | "tasks.field.priority"
  | "tasks.field.deadline"
  | "tasks.priority.normal"
  | "tasks.priority.high"
  | "tasks.priority.urgent"
  | "tasks.create.creating"
  | "tasks.create.create"
  | "employees.title"
  | "employees.subtitle"
  | "employees.add"
  | "employees.filters.all"
  | "employees.searchPlaceholder"
  | "employees.table.employee"
  | "employees.table.position"
  | "employees.table.greenhouse"
  | "employees.table.phone"
  | "employees.table.taskCount"
  | "employees.table.status"
  | "employees.table.actions"
  | "employees.notFound"
  | "employees.confirmDelete"
  | "employees.modal.addTitle"
  | "employees.modal.editTitle"
  | "employees.field.fullName"
  | "employees.field.position"
  | "employees.field.greenhouse"
  | "employees.field.phone"
  | "employees.field.status"
  | "employees.field.notes"
  | "employees.status.onShift"
  | "employees.status.break"
  | "employees.status.sick"
  | "employees.status.dayOff"
  | "reports.title"
  | "reports.subtitle"
  | "reports.period.day"
  | "reports.period.week"
  | "reports.period.month"
  | "reports.period.year"
  | "reports.exportPdf"
  | "reports.exportExcel"
  | "reports.kpi.harvested"
  | "reports.kpi.water"
  | "reports.kpi.tasksCompletion"
  | "reports.chart.title"
  | "reports.chart.subtitle"
  | "reports.table.title"
  | "reports.table.subtitle"
  | "reports.table.greenhouse"
  | "reports.table.harvested"
  | "reports.overview.hint"
  | "reports.tab.overview"
  | "reports.tab.charts"
  | "reports.tab.data"
  | "reports.chart.tasksShare"
  | "reports.chart.wateringShare"
  | "reports.chart.taskPriorities"
  | "reports.chart.cultureStages"
  | "reports.chart.avgTempGh"
  | "reports.chart.co2Daily"
  | "reports.chart.notificationsByType"
  | "reports.charts.analyticsBlock"
  | "reports.legend.done"
  | "reports.legend.pending"
  | "notifications.title"
  | "notifications.unread"
  | "notifications.markAllRead"
  | "notifications.new"
  | "notifications.clickToMarkRead"
  | "users.title"
  | "users.subtitle"
  | "users.create"
  | "users.table.user"
  | "users.table.login"
  | "users.table.role"
  | "users.table.lastLogin"
  | "users.table.status"
  | "users.table.actions"
  | "users.employee"
  | "users.employeeNone"
  | "users.role.admin"
  | "users.role.director"
  | "users.role.agronomist"
  | "users.role.worker"
  | "users.status.active"
  | "users.status.blocked"
  | "users.actions.block"
  | "users.actions.unblock"
  | "users.none"
  | "users.logs.title"
  | "users.logs.subtitle"
  | "users.logs.empty"
  | "users.modal.createTitle"
  | "users.modal.editTitle"
  | "users.field.fullName"
  | "users.field.login"
  | "users.field.password"
  | "users.field.passwordHintEdit"
  | "users.field.passwordHintCreate"
  | "users.field.role"
  | "users.field.employeeLink"
  | "users.field.employeeLinkNone"
  | "users.field.status"
  | "users.confirmDelete"
  | "sensorEntry.title"
  | "sensorEntry.subtitle"
  | "sensorEntry.ready"
  | "sensorEntry.noRights"
  | "sensorEntry.noRightsText"
  | "sensorEntry.formTitle"
  | "sensorEntry.normHint"
  | "sensorEntry.temperature"
  | "sensorEntry.humidity"
  | "sensorEntry.co2"
  | "sensorEntry.datetime"
  | "sensorEntry.badge.outOfNorm"
  | "sensorEntry.badge.ok"
  | "sensorEntry.submit.saving"
  | "sensorEntry.submit"
  | "sensorEntry.recent.title"
  | "sensorEntry.recent.subtitle"
  | "sensorEntry.recent.none"
  | "sensorEntry.toast.saved"
  | "sensorEntry.toast.savedWithDeviation"
  | "profile.role"
  | "profile.data.title"
  | "profile.data.login"
  | "profile.data.lastLogin"
  | "profile.data.lastLoginLater"
  | "profile.data.changeName"
  | "profile.data.fullName"
  | "profile.security.title"
  | "profile.security.textLater"
  | "profile.security.changePassword"
  | "profile.security.currentPassword"
  | "profile.security.newPassword"
  | "profile.logins.title"
  | "profile.logins.when"
  | "profile.logins.ip"
  | "profile.logins.ua"
  | "enum.taskPriority.normal"
  | "enum.taskPriority.high"
  | "enum.taskPriority.urgent"
  | "enum.employeeStatus.onShift"
  | "enum.employeeStatus.break"
  | "enum.employeeStatus.sick"
  | "enum.employeeStatus.dayOff"
  | "enum.notificationType.alarm"
  | "enum.notificationType.warning"
  | "enum.notificationType.info"
  | "enum.notificationType.success"
  | "enum.greenhouseStatus.active"
  | "enum.greenhouseStatus.maintenance"
  | "enum.greenhouseStatus.off"
  | "enum.cultureStage.sowing"
  | "enum.cultureStage.growth"
  | "enum.cultureStage.flowering"
  | "enum.cultureStage.fruiting"
  | "enum.cultureStage.harvest"
  | "alerts.tempOutOfNorm"
  | "alerts.humidityOutOfNorm"
  | "ai.title"
  | "ai.subtitle"
  | "ai.ready"
  | "ai.quick.careTomatoes"
  | "ai.quick.optimalWatering"
  | "ai.quick.pestControl"
  | "ai.quick.analyze"
  | "ai.greenhouseSelect"
  | "ai.greenhouseAll"
  | "ai.dialog.title"
  | "ai.refresh"
  | "ai.typing"
  | "ai.empty"
  | "ai.inputPlaceholder"
  | "ai.send"
  | "ai.error.noReply"
  | "watering.week.more"
  | "error.network"
  | "error.checkFields"
  | "error.saveFailed"
  | "error.createFailed"
  | "error.deleteFailed"
  | "error.loginFailed"
  | "error.recordFailed"
  | "val.enterName"
  | "val.enterTitle"
  | "val.enterFullName"
  | "val.enterPosition"
  | "val.enterLogin"
  | "val.passwordMin"
  | "val.selectGreenhouse"
  | "val.areaPositive"
  | "val.durationPositive"
  | "val.volumePositive"
  | "val.enterWateringType"
  | "val.enterDate"
  | "val.enterTime"
  | "val.tempMinLessMax"
  | "val.humidityMinLessMax"
  | "val.humidityRange"
  | "val.co2Min"
  | "db.title"
  | "db.subtitle"
  | "db.table"
  | "db.columns"
  | "db.fk"
  | "db.noFk"
  | "db.rows"
  | "db.limit"
  | "db.exportCsv"
  | "db.filters"
  | "db.selectColumn"
  | "db.value"
  | "db.sortAuto"
  | "db.sortBy"
  | "db.op.contains"
  | "db.op.eq"
  | "db.op.gt"
  | "db.op.gte"
  | "db.op.lt"
  | "db.op.lte"
  | "db.op.isnull"
  | "db.op.notnull"
  | "db.safeEditHint"
  | "db.prev"
  | "db.next"
  | "db.sensorSim.title"
  | "db.sensorSim.enable"
  | "db.sensorSim.disable"
  | "api.unauthorized"
  | "api.forbidden"
  | "api.badData"
  | "api.badParams"
  | "api.badId"
  | "api.greenhouseNotFound"
  | "api.needIdOrAll"
  | "topbar.search"
  | "topbar.notifications"
  | "topbar.menu"
  | "topbar.profile"
  | "topbar.logout"
  | "forbidden.title"
  | "forbidden.text"
  | "forbidden.home"
  | "forbidden.switchUser"
  | "login.title"
  | "login.subtitle"
  | "login.login"
  | "login.password"
  | "login.show"
  | "login.hide"
  | "login.signIn"
  | "login.signingIn"
  | "login.adminOnly";

const RU: Record<I18nKey, string> = {
  "app.title": "Future Greenhouse",
  "sidebar.system": "Система управления",
  "sidebar.user.online": "Онлайн",
  "common.loading": "Загрузка…",
  "common.search": "Поиск…",
  "common.apply": "Применить",
  "common.reset": "Сбросить",
  "common.open": "Открыть",
  "common.add": "Добавить",
  "common.save": "Сохранить",
  "common.saving": "Сохранение…",
  "common.cancel": "Отмена",
  "common.edit": "Редактировать",
  "common.delete": "Удалить",
  "common.viewOnly": "Только просмотр",
  "common.notSpecified": "Не указано",
  "nav.dashboard": "Дашборд",
  "nav.greenhouses": "Теплицы",
  "nav.cultures": "Культуры",
  "nav.parameters": "Параметры",
  "nav.watering": "Полив",
  "nav.tasks": "Задачи",
  "nav.employees": "Сотрудники",
  "nav.reports": "Отчёты",
  "nav.notifications": "Уведомления",
  "nav.ai": "ИИ-ассистент",
  "nav.sensorEntry": "Ввод датчиков",
  "nav.users": "Пользователи",
  "nav.db": "База данных",
  "dashboard.kpi.activeGreenhouses": "Активные теплицы",
  "dashboard.kpi.avgTemp": "Средняя температура",
  "dashboard.kpi.cultures": "Культур выращивается",
  "dashboard.kpi.staffToday": "Сотрудников сегодня",
  "dashboard.kpi.tasksCompletion": "Выполнение задач",
  "dashboard.period.day": "День",
  "dashboard.period.week": "Неделя",
  "dashboard.period.month": "Месяц",
  "dashboard.monitoring.title": "Мониторинг теплиц (в реальном времени)",
  "dashboard.monitoring.subtitle": "Автообновление каждые 30 секунд",
  "dashboard.table.greenhouse": "Теплица",
  "dashboard.table.temperature": "Температура",
  "dashboard.table.humidity": "Влажность",
  "dashboard.table.co2": "CO2",
  "dashboard.table.status": "Статус",
  "dashboard.todayTasks.title": "Задачи на сегодня",
  "dashboard.todayTasks.subtitle": "Отмечай выполнение чекбоксами",
  "dashboard.todayTasks.noTasks": "Нет задач на сегодня.",
  "dashboard.charts.tempByGreenhouse": "Температура по теплицам",
  "dashboard.charts.co2ByGreenhouse": "CO₂ по теплицам",
  "dashboard.charts.tasksSplit": "Задачи: выполнено и открыто",
  "dashboard.charts.tasksDone": "Выполнено",
  "dashboard.charts.tasksOpen": "Открыто",
  "greenhouses.title": "Теплицы",
  "greenhouses.subtitle":
    "Карточки (3 колонки), текущие показатели и статусы. Кнопки редактирования скрываются по роли.",
  "greenhouses.add": "+ Добавить теплицу",
  "greenhouses.type": "Тип",
  "greenhouses.area": "Площадь",
  "greenhouses.temperature": "Температура",
  "greenhouses.humidity": "Влажность",
  "greenhouses.co2": "CO2",
  "greenhouses.nextWatering": "Следующий полив",
  "greenhouses.responsible": "Ответственный",
  "greenhouses.culturesNone": "Культуры не указаны",
  "greenhouses.confirmDelete": "Удалить теплицу?",
  "greenhouses.modal.addTitle": "Добавить теплицу",
  "greenhouses.modal.editTitle": "Редактировать теплицу",
  "greenhouses.field.name": "Название",
  "greenhouses.field.type": "Тип конструкции",
  "greenhouses.field.area": "Площадь (м²)",
  "greenhouses.field.tempNorm": "Норма температуры (min/max)",
  "greenhouses.field.humidityNorm": "Норма влажности (min/max)",
  "greenhouses.field.responsible": "Ответственный сотрудник",
  "greenhouses.field.status": "Статус",
  "greenhouses.field.notes": "Примечания",
  "greenhouses.type.glass": "Стеклянная",
  "greenhouses.type.poly": "Поликарбонатная",
  "greenhouses.type.film": "Плёночная",
  "greenhouses.status.active": "Активна",
  "greenhouses.status.maintenance": "Обслуживание",
  "greenhouses.status.off": "Отключена",
  "cultures.title": "Культуры",
  "cultures.subtitle": "Таблица культур, фильтр по теплице, поиск, стадии роста и CRUD через модалку.",
  "cultures.add": "+ Добавить культуру",
  "cultures.searchPlaceholder": "Поиск по названию…",
  "cultures.allGreenhouses": "Все теплицы",
  "cultures.table.name": "Название",
  "cultures.table.greenhouse": "Теплица",
  "cultures.table.section": "Секция",
  "cultures.table.planted": "Посев",
  "cultures.table.harvest": "Сбор",
  "cultures.table.norms": "Нормы",
  "cultures.table.stage": "Стадия",
  "cultures.table.actions": "Действия",
  "cultures.modal.addTitle": "Добавить культуру",
  "cultures.modal.editTitle": "Редактировать культуру",
  "cultures.field.name": "Название",
  "cultures.field.greenhouse": "Теплица",
  "cultures.field.section": "Секция",
  "cultures.field.plantedDate": "Дата посева",
  "cultures.field.harvestDate": "Дата сбора",
  "cultures.field.tempNorm": "Норма температуры",
  "cultures.field.humidityNorm": "Норма влажности",
  "cultures.field.stage": "Стадия роста",
  "cultures.field.progress": "Прогресс",
  "cultures.field.notes": "Примечания",
  "cultures.notFound": "Ничего не найдено.",
  "cultures.confirmDelete": "Удалить культуру?",
  "parameters.title": "Контроль параметров",
  "parameters.subtitle": "Автообновление каждые 10 секунд",
  "parameters.range.day": "За день",
  "parameters.range.week": "За 7 дней",
  "parameters.temperature": "Температура",
  "parameters.humidity": "Влажность",
  "parameters.charts.temperature": "График температуры",
  "parameters.charts.humidity": "График влажности",
  "parameters.charts.noData": "Нет записей за выбранный период — включите симуляцию в разделе «База данных» или подождите новые замеры.",
  "parameters.table.title": "Текущие показания всех датчиков",
  "parameters.table.subtitle": "Подсветка — при отклонении от нормы",
  "parameters.table.greenhouse": "Теплица",
  "parameters.table.temperature": "Температура",
  "parameters.table.humidity": "Влажность",
  "parameters.table.co2": "CO2",
  "parameters.table.time": "Время",
  "watering.title": "Планирование полива",
  "watering.subtitle": "Таймлайн на сегодня + расписание на неделю. Оператор может отмечать выполненные поливы.",
  "watering.scheduledToday": "Запланировано сегодня",
  "watering.timeline.title": "Таймлайн на сегодня",
  "watering.timeline.subtitle": "Вертикальная лента по времени",
  "watering.timeline.none": "На сегодня нет запланированных поливов.",
  "watering.status.done": "выполнен",
  "watering.status.planned": "запланирован",
  "watering.markDone": "Отметить выполнение",
  "watering.add.title": "Добавить полив",
  "watering.add.subtitleAllowed": "Форма доступна для агронома/админа",
  "watering.add.subtitleDenied": "Недостаточно прав для добавления",
  "watering.field.greenhouse": "Теплица",
  "watering.field.type": "Тип полива",
  "watering.field.date": "Дата",
  "watering.field.time": "Время",
  "watering.field.duration": "Длительность (мин)",
  "watering.field.volume": "Объём (л)",
  "watering.field.notes": "Примечания",
  "watering.add.adding": "Добавление…",
  "watering.add.add": "Добавить",
  "watering.confirmDelete": "Удалить запись полива?",
  "watering.week.title": "Календарь на неделю вперёд",
  "watering.week.subtitle": "Сводка по дням + список записей",
  "watering.week.none": "Нет записей",
  "tasks.title": "Задачи",
  "tasks.subtitle": "Фильтры, приоритеты, чекбоксы выполнения. Оператор видит и отмечает только свои задачи.",
  "tasks.total": "Всего",
  "tasks.filters.all": "Все",
  "tasks.filters.active": "Активные",
  "tasks.filters.done": "Выполненные",
  "tasks.filters.urgent": "Срочные",
  "tasks.searchPlaceholder": "Поиск…",
  "tasks.assignee": "Исполнитель",
  "tasks.greenhouse": "Теплица",
  "tasks.deadline": "Срок",
  "tasks.assigneeNotAssigned": "не назначен",
  "tasks.noneByFilter": "Нет задач по выбранному фильтру.",
  "tasks.create.title": "Создать задачу",
  "tasks.create.subtitleAllowed": "Доступно для агронома/админа",
  "tasks.create.subtitleDenied": "Недостаточно прав",
  "tasks.field.title": "Название",
  "tasks.field.description": "Описание",
  "tasks.field.assignee": "Исполнитель",
  "tasks.field.greenhouse": "Теплица",
  "tasks.field.priority": "Приоритет",
  "tasks.field.deadline": "Срок",
  "tasks.priority.normal": "Обычный",
  "tasks.priority.high": "Высокий",
  "tasks.priority.urgent": "Срочный",
  "tasks.create.creating": "Создание…",
  "tasks.create.create": "Создать задачу",
  "employees.title": "Сотрудники",
  "employees.subtitle": "Таблица сотрудников, фильтр по статусу, аватары-инициалы. CRUD доступен только администратору.",
  "employees.add": "+ Добавить сотрудника",
  "employees.filters.all": "Все",
  "employees.searchPlaceholder": "Поиск…",
  "employees.table.employee": "Сотрудник",
  "employees.table.position": "Должность",
  "employees.table.greenhouse": "Теплица",
  "employees.table.phone": "Телефон",
  "employees.table.taskCount": "Кол-во задач",
  "employees.table.status": "Статус",
  "employees.table.actions": "Действия",
  "employees.notFound": "Ничего не найдено.",
  "employees.confirmDelete": "Удалить сотрудника?",
  "employees.modal.addTitle": "Добавить сотрудника",
  "employees.modal.editTitle": "Редактировать сотрудника",
  "employees.field.fullName": "ФИО",
  "employees.field.position": "Должность",
  "employees.field.greenhouse": "Теплица",
  "employees.field.phone": "Телефон",
  "employees.field.status": "Статус",
  "employees.field.notes": "Примечания",
  "employees.status.onShift": "на смене",
  "employees.status.break": "перерыв",
  "employees.status.sick": "больничный",
  "employees.status.dayOff": "выходной",
  "reports.title": "Отчёты",
  "reports.subtitle": "KPI, таблицы и расширенные графики. Экспорт в PDF и Excel (листы «Сводка», «Таблицы», «Графики»).",
  "reports.period.day": "День",
  "reports.period.week": "Неделя",
  "reports.period.month": "Месяц",
  "reports.period.year": "Год",
  "reports.exportPdf": "Экспорт PDF",
  "reports.exportExcel": "Экспорт Excel",
  "reports.kpi.harvested": "Урожай за период (партий)",
  "reports.kpi.water": "Расход воды (л)",
  "reports.kpi.tasksCompletion": "Выполнение задач",
  "reports.chart.title": "Урожай по теплицам",
  "reports.chart.subtitle": "В демо “урожай” считается по культурам с `harvest_date` в периоде.",
  "reports.table.title": "Сводная таблица",
  "reports.table.subtitle": "По теплицам",
  "reports.table.greenhouse": "Теплица",
  "reports.table.harvested": "Урожай (партий)",
  "reports.tab.overview": "Обзор",
  "reports.overview.hint":
    "На вкладке «Графики» — урожай, вода, задачи, климат и ещё 6 диаграмм аналитики. На «Данные» — таблицы.",
  "reports.tab.charts": "Графики",
  "reports.tab.data": "Данные",
  "reports.chart.tasksShare": "Задачи: выполнено / не выполнено",
  "reports.chart.wateringShare": "Полив: выполнено / ожидает",
  "reports.chart.taskPriorities": "Задачи по приоритетам",
  "reports.chart.cultureStages": "Культуры по стадиям",
  "reports.chart.avgTempGh": "Средняя температура по теплицам",
  "reports.chart.co2Daily": "CO₂ по дням",
  "reports.chart.notificationsByType": "Уведомления по типам",
  "reports.charts.analyticsBlock": "Дополнительная аналитика (6 диаграмм)",
  "reports.legend.done": "Выполнено",
  "reports.legend.pending": "Не выполнено / ожидает",
  "notifications.title": "Уведомления",
  "notifications.unread": "Непрочитанных",
  "notifications.markAllRead": "Отметить все прочитанными",
  "notifications.new": "новое",
  "notifications.clickToMarkRead": "Кликните, чтобы отметить прочитанным",
  "users.title": "Пользователи",
  "users.subtitle": "Управление пользователями (admin). Создание/редактирование/блокировка/удаление и журнал действий.",
  "users.create": "+ Создать пользователя",
  "users.table.user": "Пользователь",
  "users.table.login": "Логин",
  "users.table.role": "Роль",
  "users.table.lastLogin": "Последний вход",
  "users.table.status": "Статус",
  "users.table.actions": "Действия",
  "users.employee": "Сотрудник",
  "users.employeeNone": "Сотрудник: —",
  "users.role.admin": "Администратор",
  "users.role.director": "Директор",
  "users.role.agronomist": "Агроном",
  "users.role.worker": "Рабочий",
  "users.status.active": "активен",
  "users.status.blocked": "заблокирован",
  "users.actions.block": "Заблокировать",
  "users.actions.unblock": "Разблокировать",
  "users.none": "Нет пользователей.",
  "users.logs.title": "Логи последних действий",
  "users.logs.subtitle": "Последние 50 записей",
  "users.logs.empty": "Логи пустые.",
  "users.modal.createTitle": "Создать пользователя",
  "users.modal.editTitle": "Редактировать пользователя",
  "users.field.fullName": "ФИО",
  "users.field.login": "Логин",
  "users.field.password": "Пароль",
  "users.field.passwordHintEdit": "(оставь пустым, чтобы не менять)",
  "users.field.passwordHintCreate": "минимум 6 символов",
  "users.field.role": "Роль",
  "users.field.employeeLink": "Привязка к сотруднику",
  "users.field.employeeLinkNone": "— не привязан —",
  "users.field.status": "Статус",
  "users.confirmDelete": "Удалить пользователя",
  "sensorEntry.title": "Ввод данных датчиков",
  "sensorEntry.subtitle": "Форма для оператора. После записи автоматически создаётся уведомление при выходе за нормы.",
  "sensorEntry.ready": "Готово",
  "sensorEntry.noRights": "Недостаточно прав.",
  "sensorEntry.noRightsText": "Доступно только для Оператора и Администратора.",
  "sensorEntry.formTitle": "Записать показания",
  "sensorEntry.normHint": "Норма",
  "sensorEntry.temperature": "Температура (°C)",
  "sensorEntry.humidity": "Влажность (%)",
  "sensorEntry.co2": "CO2 (ppm)",
  "sensorEntry.datetime": "Дата/время",
  "sensorEntry.badge.outOfNorm": "Вне нормы",
  "sensorEntry.badge.ok": "Норма",
  "sensorEntry.submit.saving": "Запись…",
  "sensorEntry.submit": "Записать показания",
  "sensorEntry.recent.title": "Последние 10 записей",
  "sensorEntry.recent.subtitle": "История текущего оператора",
  "sensorEntry.recent.none": "Пока нет записей.",
  "sensorEntry.toast.saved": "Показания записаны",
  "sensorEntry.toast.savedWithDeviation": "Записано. Есть отклонение от нормы.",
  "profile.role": "Роль",
  "profile.data.title": "Данные профиля",
  "profile.data.login": "Логин",
  "profile.data.lastLogin": "Последний вход",
  "profile.data.lastLoginLater": "будет добавлено позже",
  "profile.data.changeName": "Изменить имя",
  "profile.data.fullName": "ФИО",
  "profile.security.title": "Безопасность",
  "profile.security.textLater": "В следующем блоке добавлю изменение имени и пароля + историю входов.",
  "profile.security.changePassword": "Смена пароля",
  "profile.security.currentPassword": "Текущий пароль",
  "profile.security.newPassword": "Новый пароль (мин. 6 символов)",
  "profile.logins.title": "История входов",
  "profile.logins.when": "Когда",
  "profile.logins.ip": "IP",
  "profile.logins.ua": "User-Agent",
  "enum.taskPriority.normal": "обычный",
  "enum.taskPriority.high": "высокий",
  "enum.taskPriority.urgent": "срочный",
  "enum.employeeStatus.onShift": "на смене",
  "enum.employeeStatus.break": "перерыв",
  "enum.employeeStatus.sick": "больничный",
  "enum.employeeStatus.dayOff": "выходной",
  "enum.notificationType.alarm": "тревога",
  "enum.notificationType.warning": "предупреждение",
  "enum.notificationType.info": "информация",
  "enum.notificationType.success": "успех",
  "enum.greenhouseStatus.active": "активна",
  "enum.greenhouseStatus.maintenance": "обслуживание",
  "enum.greenhouseStatus.off": "отключена",
  "enum.cultureStage.sowing": "Посев",
  "enum.cultureStage.growth": "Рост",
  "enum.cultureStage.flowering": "Цветение",
  "enum.cultureStage.fruiting": "Плодоношение",
  "enum.cultureStage.harvest": "Сбор урожая",
  "alerts.tempOutOfNorm": "температура вне нормы",
  "alerts.humidityOutOfNorm": "влажность вне нормы",
  "ai.title": "ИИ‑ассистент",
  "ai.subtitle": "Чат агронома‑эксперта. Контекст включает текущие данные теплиц.",
  "ai.ready": "Готов",
  "ai.quick.careTomatoes": "Уход за томатами",
  "ai.quick.optimalWatering": "Оптимальный полив",
  "ai.quick.pestControl": "Борьба с вредителями",
  "ai.quick.analyze": "Анализ теплицы",
  "ai.greenhouseSelect": "Контекст: теплица",
  "ai.greenhouseAll": "Все теплицы",
  "ai.dialog.title": "Диалог",
  "ai.refresh": "Обновить",
  "ai.typing": "Печатает…",
  "ai.empty": "История пустая. Задай вопрос или нажми быструю кнопку.",
  "ai.inputPlaceholder": "Напиши сообщение…",
  "ai.send": "Отправить",
  "ai.error.noReply": "Не удалось получить ответ",
  "watering.week.more": "и ещё",
  "error.network": "Ошибка сети. Повторите попытку.",
  "error.checkFields": "Проверьте поля",
  "error.saveFailed": "Не удалось сохранить",
  "error.createFailed": "Не удалось создать",
  "error.deleteFailed": "Не удалось удалить",
  "error.loginFailed": "Не удалось войти",
  "error.recordFailed": "Не удалось записать показания",
  "val.enterName": "Введите название",
  "val.enterTitle": "Введите название",
  "val.enterFullName": "Введите ФИО",
  "val.enterPosition": "Введите должность",
  "val.enterLogin": "Введите логин",
  "val.passwordMin": "Пароль минимум 6 символов",
  "val.selectGreenhouse": "Выберите теплицу",
  "val.areaPositive": "Площадь должна быть > 0",
  "val.durationPositive": "Длительность должна быть > 0",
  "val.volumePositive": "Объём должен быть > 0",
  "val.enterWateringType": "Укажите тип полива",
  "val.enterDate": "Укажите дату",
  "val.enterTime": "Укажите время",
  "val.tempMinLessMax": "temp_min должен быть меньше temp_max",
  "val.humidityMinLessMax": "humidity_min должен быть меньше humidity_max",
  "val.humidityRange": "Влажность должна быть 0–100",
  "val.co2Min": "CO2 должен быть ≥ 0",
  "db.title": "Просмотр базы данных",
  "db.subtitle": "Только для администратора. Просмотр таблиц SQLite.",
  "db.table": "Таблица",
  "db.columns": "Колонки",
  "db.fk": "Связи (FK)",
  "db.noFk": "Связей нет",
  "db.rows": "Строки",
  "db.limit": "Лимит",
  "db.exportCsv": "Экспорт CSV",
  "db.filters": "Фильтры",
  "db.selectColumn": "Выберите колонку",
  "db.value": "Значение",
  "db.sortAuto": "Сортировка: авто",
  "db.sortBy": "Сортировать по",
  "db.op.contains": "содержит",
  "db.op.eq": "равно",
  "db.op.gt": ">",
  "db.op.gte": "≥",
  "db.op.lt": "<",
  "db.op.lte": "≤",
  "db.op.isnull": "пусто (NULL)",
  "db.op.notnull": "не пусто",
  "db.safeEditHint": "CRUD доступен только для рабочих таблиц (теплицы/культуры/датчики/полив/задачи/сотрудники/уведомления).",
  "db.prev": "Назад",
  "db.next": "Вперёд",
  "db.sensorSim.title": "Симуляция данных датчиков",
  "db.sensorSim.enable": "Включить",
  "db.sensorSim.disable": "Выключить",
  "api.unauthorized": "Не авторизован",
  "api.forbidden": "Недостаточно прав",
  "api.badData": "Некорректные данные",
  "api.badParams": "Некорректные параметры",
  "api.badId": "Некорректный id",
  "api.greenhouseNotFound": "Теплица не найдена",
  "api.needIdOrAll": "Укажите id или all=true",
  "topbar.search": "Поиск…",
  "topbar.notifications": "Уведомления",
  "topbar.menu": "Меню",
  "topbar.profile": "Профиль",
  "topbar.logout": "Выйти",
  "forbidden.title": "403",
  "forbidden.text": "У вас нет прав для доступа к этому разделу.",
  "forbidden.home": "На главную",
  "forbidden.switchUser": "Сменить пользователя",
  "login.title": "Future Greenhouse",
  "login.subtitle": "Вход в систему управления теплицами",
  "login.login": "Логин",
  "login.password": "Пароль",
  "login.show": "Показать",
  "login.hide": "Скрыть",
  "login.signIn": "Войти",
  "login.signingIn": "Входим...",
  "login.adminOnly": "Регистрация доступна только через администратора.",
};

const KK: Record<I18nKey, string> = {
  "app.title": "Future Greenhouse",
  "sidebar.system": "Басқару жүйесі",
  "sidebar.user.online": "Онлайн",
  "common.loading": "Жүктелуде…",
  "common.search": "Іздеу…",
  "common.apply": "Қолдану",
  "common.reset": "Қалпына келтіру",
  "common.open": "Ашу",
  "common.add": "Қосу",
  "common.save": "Сақтау",
  "common.saving": "Сақталуда…",
  "common.cancel": "Болдырмау",
  "common.edit": "Өңдеу",
  "common.delete": "Жою",
  "common.viewOnly": "Тек көру",
  "common.notSpecified": "Көрсетілмеген",
  "nav.dashboard": "Басқару панелі",
  "nav.greenhouses": "Жылыжайлар",
  "nav.cultures": "Дақылдар",
  "nav.parameters": "Параметрлер",
  "nav.watering": "Суару",
  "nav.tasks": "Тапсырмалар",
  "nav.employees": "Қызметкерлер",
  "nav.reports": "Есептер",
  "nav.notifications": "Хабарландырулар",
  "nav.ai": "AI-көмекші",
  "nav.sensorEntry": "Датчиктерді енгізу",
  "nav.users": "Пайдаланушылар",
  "nav.db": "Деректер базасы",
  "dashboard.kpi.activeGreenhouses": "Белсенді жылыжайлар",
  "dashboard.kpi.avgTemp": "Орташа температура",
  "dashboard.kpi.cultures": "Өсірілетін дақылдар",
  "dashboard.kpi.staffToday": "Бүгінгі қызметкерлер",
  "dashboard.kpi.tasksCompletion": "Тапсырма орындалуы",
  "dashboard.period.day": "Күн",
  "dashboard.period.week": "Апта",
  "dashboard.period.month": "Ай",
  "dashboard.monitoring.title": "Жылыжай мониторингі (нақты уақыт)",
  "dashboard.monitoring.subtitle": "Әр 30 секунд сайын жаңартылады",
  "dashboard.table.greenhouse": "Жылыжай",
  "dashboard.table.temperature": "Температура",
  "dashboard.table.humidity": "Ылғалдылық",
  "dashboard.table.co2": "CO2",
  "dashboard.table.status": "Күйі",
  "dashboard.todayTasks.title": "Бүгінгі тапсырмалар",
  "dashboard.todayTasks.subtitle": "Орындалуын белгілеңіз",
  "dashboard.todayTasks.noTasks": "Бүгінге тапсырма жоқ.",
  "dashboard.charts.tempByGreenhouse": "Жылыжайлар бойынша температура",
  "dashboard.charts.co2ByGreenhouse": "Жылыжайлар бойынша CO₂",
  "dashboard.charts.tasksSplit": "Тапсырмалар: орындалған және ашық",
  "dashboard.charts.tasksDone": "Орындалған",
  "dashboard.charts.tasksOpen": "Ашық",
  "greenhouses.title": "Жылыжайлар",
  "greenhouses.subtitle":
    "Карточкалар (3 баған), ағымдағы көрсеткіштер мен күйлер. Рөлге қарай өңдеу батырмалары жасырылады.",
  "greenhouses.add": "+ Жылыжай қосу",
  "greenhouses.type": "Түрі",
  "greenhouses.area": "Ауданы",
  "greenhouses.temperature": "Температура",
  "greenhouses.humidity": "Ылғалдылық",
  "greenhouses.co2": "CO2",
  "greenhouses.nextWatering": "Келесі суару",
  "greenhouses.responsible": "Жауапты",
  "greenhouses.culturesNone": "Дақылдар көрсетілмеген",
  "greenhouses.confirmDelete": "Жылыжайды жою керек пе?",
  "greenhouses.modal.addTitle": "Жылыжай қосу",
  "greenhouses.modal.editTitle": "Жылыжайды өңдеу",
  "greenhouses.field.name": "Атауы",
  "greenhouses.field.type": "Құрылым түрі",
  "greenhouses.field.area": "Ауданы (м²)",
  "greenhouses.field.tempNorm": "Температура нормасы (min/max)",
  "greenhouses.field.humidityNorm": "Ылғалдылық нормасы (min/max)",
  "greenhouses.field.responsible": "Жауапты қызметкер",
  "greenhouses.field.status": "Күйі",
  "greenhouses.field.notes": "Ескертпелер",
  "greenhouses.type.glass": "Шыны",
  "greenhouses.type.poly": "Поликарбонат",
  "greenhouses.type.film": "Пленка",
  "greenhouses.status.active": "Белсенді",
  "greenhouses.status.maintenance": "Қызмет көрсету",
  "greenhouses.status.off": "Өшірулі",
  "cultures.title": "Дақылдар",
  "cultures.subtitle": "Дақылдар кестесі, жылыжай бойынша сүзгі, іздеу, өсу кезеңдері және модалка арқылы CRUD.",
  "cultures.add": "+ Дақыл қосу",
  "cultures.searchPlaceholder": "Атауы бойынша іздеу…",
  "cultures.allGreenhouses": "Барлық жылыжайлар",
  "cultures.table.name": "Атауы",
  "cultures.table.greenhouse": "Жылыжай",
  "cultures.table.section": "Секция",
  "cultures.table.planted": "Егу",
  "cultures.table.harvest": "Жинау",
  "cultures.table.norms": "Нормалар",
  "cultures.table.stage": "Кезең",
  "cultures.table.actions": "Әрекеттер",
  "cultures.modal.addTitle": "Дақыл қосу",
  "cultures.modal.editTitle": "Дақылды өңдеу",
  "cultures.field.name": "Атауы",
  "cultures.field.greenhouse": "Жылыжай",
  "cultures.field.section": "Секция",
  "cultures.field.plantedDate": "Егу күні",
  "cultures.field.harvestDate": "Жинау күні",
  "cultures.field.tempNorm": "Температура нормасы",
  "cultures.field.humidityNorm": "Ылғалдылық нормасы",
  "cultures.field.stage": "Өсу кезеңі",
  "cultures.field.progress": "Прогресс",
  "cultures.field.notes": "Ескертпелер",
  "cultures.notFound": "Ештеңе табылмады.",
  "cultures.confirmDelete": "Дақылды жою керек пе?",
  "parameters.title": "Параметрлерді бақылау",
  "parameters.subtitle": "Әр 10 секунд сайын жаңартылады",
  "parameters.range.day": "1 күн",
  "parameters.range.week": "7 күн",
  "parameters.temperature": "Температура",
  "parameters.humidity": "Ылғалдылық",
  "parameters.charts.temperature": "Температура графигі",
  "parameters.charts.humidity": "Ылғалдылық графигі",
  "parameters.charts.noData":
    "Таңдалған кезеңде жазба жоқ — «Деректер базасы» бөлімінде симуляцияны қосыңыз немесе жаңа өлшемдерді күтіңіз.",
  "parameters.table.title": "Барлық датчиктердің ағымдағы көрсеткіштері",
  "parameters.table.subtitle": "Нормадан ауытқыса — белгіленеді",
  "parameters.table.greenhouse": "Жылыжай",
  "parameters.table.temperature": "Температура",
  "parameters.table.humidity": "Ылғалдылық",
  "parameters.table.co2": "CO2",
  "parameters.table.time": "Уақыты",
  "watering.title": "Суаруды жоспарлау",
  "watering.subtitle": "Бүгінгі таймлайн + апталық жоспар. Оператор орындалған суаруды белгілей алады.",
  "watering.scheduledToday": "Бүгін жоспарланған",
  "watering.timeline.title": "Бүгінгі таймлайн",
  "watering.timeline.subtitle": "Уақыт бойынша тік лента",
  "watering.timeline.none": "Бүгінге жоспарланған суару жоқ.",
  "watering.status.done": "орындалды",
  "watering.status.planned": "жоспарланған",
  "watering.markDone": "Орындалуын белгілеу",
  "watering.add.title": "Суару қосу",
  "watering.add.subtitleAllowed": "Форма агроном/әкімшіге қолжетімді",
  "watering.add.subtitleDenied": "Қосу үшін құқық жеткіліксіз",
  "watering.field.greenhouse": "Жылыжай",
  "watering.field.type": "Суару түрі",
  "watering.field.date": "Күні",
  "watering.field.time": "Уақыты",
  "watering.field.duration": "Ұзақтығы (мин)",
  "watering.field.volume": "Көлемі (л)",
  "watering.field.notes": "Ескертпелер",
  "watering.add.adding": "Қосылуда…",
  "watering.add.add": "Қосу",
  "watering.confirmDelete": "Суару жазбасын жою керек пе?",
  "watering.week.title": "Алдағы апта күнтізбесі",
  "watering.week.subtitle": "Күндер бойынша қорытынды + тізім",
  "watering.week.none": "Жазба жоқ",
  "tasks.title": "Тапсырмалар",
  "tasks.subtitle": "Сүзгілер, басымдықтар, орындалуын белгілеу. Оператор тек өз тапсырмаларын көріп/белгілейді.",
  "tasks.total": "Барлығы",
  "tasks.filters.all": "Барлығы",
  "tasks.filters.active": "Белсенді",
  "tasks.filters.done": "Орындалған",
  "tasks.filters.urgent": "Шұғыл",
  "tasks.searchPlaceholder": "Іздеу…",
  "tasks.assignee": "Орындаушы",
  "tasks.greenhouse": "Жылыжай",
  "tasks.deadline": "Мерзім",
  "tasks.assigneeNotAssigned": "тағайындалмаған",
  "tasks.noneByFilter": "Таңдалған сүзгі бойынша тапсырма жоқ.",
  "tasks.create.title": "Тапсырма құру",
  "tasks.create.subtitleAllowed": "Агроном/әкімшіге қолжетімді",
  "tasks.create.subtitleDenied": "Құқық жеткіліксіз",
  "tasks.field.title": "Атауы",
  "tasks.field.description": "Сипаттама",
  "tasks.field.assignee": "Орындаушы",
  "tasks.field.greenhouse": "Жылыжай",
  "tasks.field.priority": "Басымдық",
  "tasks.field.deadline": "Мерзім",
  "tasks.priority.normal": "Қалыпты",
  "tasks.priority.high": "Жоғары",
  "tasks.priority.urgent": "Шұғыл",
  "tasks.create.creating": "Құрылуда…",
  "tasks.create.create": "Тапсырма құру",
  "employees.title": "Қызметкерлер",
  "employees.subtitle": "Қызметкерлер кестесі, мәртебе бойынша сүзгі, инициал-аватарлар. CRUD тек әкімшіге.",
  "employees.add": "+ Қызметкер қосу",
  "employees.filters.all": "Барлығы",
  "employees.searchPlaceholder": "Іздеу…",
  "employees.table.employee": "Қызметкер",
  "employees.table.position": "Лауазым",
  "employees.table.greenhouse": "Жылыжай",
  "employees.table.phone": "Телефон",
  "employees.table.taskCount": "Тапсырма саны",
  "employees.table.status": "Мәртебе",
  "employees.table.actions": "Әрекеттер",
  "employees.notFound": "Ештеңе табылмады.",
  "employees.confirmDelete": "Қызметкерді жою керек пе?",
  "employees.modal.addTitle": "Қызметкер қосу",
  "employees.modal.editTitle": "Қызметкерді өңдеу",
  "employees.field.fullName": "Аты-жөні",
  "employees.field.position": "Лауазым",
  "employees.field.greenhouse": "Жылыжай",
  "employees.field.phone": "Телефон",
  "employees.field.status": "Мәртебе",
  "employees.field.notes": "Ескертпелер",
  "employees.status.onShift": "ауысымда",
  "employees.status.break": "үзіліс",
  "employees.status.sick": "ауруханада",
  "employees.status.dayOff": "демалыс",
  "reports.title": "Есептер",
  "reports.subtitle": "KPI, кестелер және кеңейтілген графиктер. PDF және Excel экспорты («Қорытынды», «Кестелер», «Графиктер» парақтары).",
  "reports.period.day": "Күн",
  "reports.period.week": "Апта",
  "reports.period.month": "Ай",
  "reports.period.year": "Жыл",
  "reports.exportPdf": "PDF экспорт",
  "reports.exportExcel": "Excel экспорт",
  "reports.kpi.harvested": "Кезеңдегі өнім (партия)",
  "reports.kpi.water": "Су шығыны (л)",
  "reports.kpi.tasksCompletion": "Тапсырма орындалуы",
  "reports.chart.title": "Жылыжайлар бойынша өнім",
  "reports.chart.subtitle": "Демода “өнім” кезеңдегі `harvest_date` бар дақылдармен есептеледі.",
  "reports.table.title": "Жиынтық кесте",
  "reports.table.subtitle": "Жылыжайлар бойынша",
  "reports.table.greenhouse": "Жылыжай",
  "reports.table.harvested": "Өнім (партия)",
  "reports.tab.overview": "Шолу",
  "reports.overview.hint":
    "«Графиктер» бөлімінде — өнім, су, тапсырмалар, климат және тағы 6 талдау диаграммасы. «Деректер» — кестелер.",
  "reports.tab.charts": "Графиктер",
  "reports.tab.data": "Деректер",
  "reports.chart.tasksShare": "Тапсырмалар: орындалған / орындалмаған",
  "reports.chart.wateringShare": "Суғару: орындалған / күтуде",
  "reports.chart.taskPriorities": "Тапсырмалар басымдығы бойынша",
  "reports.chart.cultureStages": "Дақылдар сатысы бойынша",
  "reports.chart.avgTempGh": "Жылыжайлар бойынша орташа температура",
  "reports.chart.co2Daily": "CO₂ күндер бойынша",
  "reports.chart.notificationsByType": "Хабарландырулар түрі бойынша",
  "reports.charts.analyticsBlock": "Қосымша талдау (6 диаграмма)",
  "reports.legend.done": "Орындалған",
  "reports.legend.pending": "Орындалмаған / күтуде",
  "notifications.title": "Хабарландырулар",
  "notifications.unread": "Оқылмаған",
  "notifications.markAllRead": "Барлығын оқылды деп белгілеу",
  "notifications.new": "жаңа",
  "notifications.clickToMarkRead": "Оқылды деп белгілеу үшін басыңыз",
  "users.title": "Пайдаланушылар",
  "users.subtitle": "Пайдаланушыларды басқару (admin). Құру/өңдеу/бұғаттау/жою және әрекет журналы.",
  "users.create": "+ Пайдаланушы құру",
  "users.table.user": "Пайдаланушы",
  "users.table.login": "Логин",
  "users.table.role": "Рөл",
  "users.table.lastLogin": "Соңғы кіру",
  "users.table.status": "Мәртебе",
  "users.table.actions": "Әрекеттер",
  "users.employee": "Қызметкер",
  "users.employeeNone": "Қызметкер: —",
  "users.role.admin": "Әкімші",
  "users.role.director": "Директор",
  "users.role.agronomist": "Агроном",
  "users.role.worker": "Жұмысшы",
  "users.status.active": "белсенді",
  "users.status.blocked": "бұғатталған",
  "users.actions.block": "Бұғаттау",
  "users.actions.unblock": "Бұғаттан шығару",
  "users.none": "Пайдаланушы жоқ.",
  "users.logs.title": "Соңғы әрекеттер логы",
  "users.logs.subtitle": "Соңғы 50 жазба",
  "users.logs.empty": "Логтар бос.",
  "users.modal.createTitle": "Пайдаланушы құру",
  "users.modal.editTitle": "Пайдаланушыны өңдеу",
  "users.field.fullName": "Аты-жөні",
  "users.field.login": "Логин",
  "users.field.password": "Құпиясөз",
  "users.field.passwordHintEdit": "(өзгерту үшін толтырыңыз)",
  "users.field.passwordHintCreate": "кемінде 6 таңба",
  "users.field.role": "Рөл",
  "users.field.employeeLink": "Қызметкерге байлау",
  "users.field.employeeLinkNone": "— байланыстырылмаған —",
  "users.field.status": "Мәртебе",
  "users.confirmDelete": "Пайдаланушыны жою",
  "sensorEntry.title": "Датчик деректерін енгізу",
  "sensorEntry.subtitle": "Операторға арналған форма. Нормадан шықса, автоматты хабарландыру жасалады.",
  "sensorEntry.ready": "Дайын",
  "sensorEntry.noRights": "Құқық жеткіліксіз.",
  "sensorEntry.noRightsText": "Тек Оператор мен Әкімші үшін қолжетімді.",
  "sensorEntry.formTitle": "Көрсеткіштерді жазу",
  "sensorEntry.normHint": "Норма",
  "sensorEntry.temperature": "Температура (°C)",
  "sensorEntry.humidity": "Ылғалдылық (%)",
  "sensorEntry.co2": "CO2 (ppm)",
  "sensorEntry.datetime": "Күні/уақыты",
  "sensorEntry.badge.outOfNorm": "Нормадан тыс",
  "sensorEntry.badge.ok": "Норма",
  "sensorEntry.submit.saving": "Жазылуда…",
  "sensorEntry.submit": "Көрсеткіштерді жазу",
  "sensorEntry.recent.title": "Соңғы 10 жазба",
  "sensorEntry.recent.subtitle": "Ағымдағы оператор тарихы",
  "sensorEntry.recent.none": "Әзірге жазба жоқ.",
  "sensorEntry.toast.saved": "Көрсеткіштер жазылды",
  "sensorEntry.toast.savedWithDeviation": "Жазылды. Нормадан ауытқу бар.",
  "profile.role": "Рөл",
  "profile.data.title": "Профиль деректері",
  "profile.data.login": "Логин",
  "profile.data.lastLogin": "Соңғы кіру",
  "profile.data.lastLoginLater": "кейін қосылады",
  "profile.data.changeName": "Атын өзгерту",
  "profile.data.fullName": "Аты-жөні",
  "profile.security.title": "Қауіпсіздік",
  "profile.security.textLater": "Келесі блокта аты/құпиясөзді өзгерту және кіру тарихын қосамын.",
  "profile.security.changePassword": "Құпиясөзді өзгерту",
  "profile.security.currentPassword": "Ағымдағы құпиясөз",
  "profile.security.newPassword": "Жаңа құпиясөз (кемі 6 таңба)",
  "profile.logins.title": "Кіру тарихы",
  "profile.logins.when": "Қашан",
  "profile.logins.ip": "IP",
  "profile.logins.ua": "User-Agent",
  "enum.taskPriority.normal": "қалыпты",
  "enum.taskPriority.high": "жоғары",
  "enum.taskPriority.urgent": "шұғыл",
  "enum.employeeStatus.onShift": "ауысымда",
  "enum.employeeStatus.break": "үзіліс",
  "enum.employeeStatus.sick": "ауруханада",
  "enum.employeeStatus.dayOff": "демалыс",
  "enum.notificationType.alarm": "дабыл",
  "enum.notificationType.warning": "ескерту",
  "enum.notificationType.info": "ақпарат",
  "enum.notificationType.success": "сәтті",
  "enum.greenhouseStatus.active": "белсенді",
  "enum.greenhouseStatus.maintenance": "қызмет көрсету",
  "enum.greenhouseStatus.off": "өшірулі",
  "enum.cultureStage.sowing": "Егу",
  "enum.cultureStage.growth": "Өсу",
  "enum.cultureStage.flowering": "Гүлдеу",
  "enum.cultureStage.fruiting": "Жемістену",
  "enum.cultureStage.harvest": "Жинау",
  "alerts.tempOutOfNorm": "температура нормадан тыс",
  "alerts.humidityOutOfNorm": "ылғалдылық нормадан тыс",
  "ai.title": "AI‑көмекші",
  "ai.subtitle": "Агроном‑сарапшы чаты. Контекстке жылыжайлардың ағымдағы деректері кіреді.",
  "ai.ready": "Дайын",
  "ai.quick.careTomatoes": "Қызанақ күтімі",
  "ai.quick.optimalWatering": "Оңтайлы суару",
  "ai.quick.pestControl": "Зиянкестермен күрес",
  "ai.quick.analyze": "Жылыжай талдауы",
  "ai.greenhouseSelect": "Контекст: жылыжай",
  "ai.greenhouseAll": "Барлық жылыжайлар",
  "ai.dialog.title": "Диалог",
  "ai.refresh": "Жаңарту",
  "ai.typing": "Жазып жатыр…",
  "ai.empty": "Тарих бос. Сұрақ қойыңыз немесе жылдам батырманы басыңыз.",
  "ai.inputPlaceholder": "Хабарлама жазыңыз…",
  "ai.send": "Жіберу",
  "ai.error.noReply": "Жауап алу мүмкін болмады",
  "watering.week.more": "тағы",
  "error.network": "Желі қатесі. Қайта көріңіз.",
  "error.checkFields": "Өрістерді тексеріңіз",
  "error.saveFailed": "Сақтау мүмкін болмады",
  "error.createFailed": "Құру мүмкін болмады",
  "error.deleteFailed": "Жою мүмкін болмады",
  "error.loginFailed": "Кіру мүмкін болмады",
  "error.recordFailed": "Көрсеткіштерді жазу мүмкін болмады",
  "val.enterName": "Атауын енгізіңіз",
  "val.enterTitle": "Атауын енгізіңіз",
  "val.enterFullName": "Аты-жөнін енгізіңіз",
  "val.enterPosition": "Лауазымды енгізіңіз",
  "val.enterLogin": "Логин енгізіңіз",
  "val.passwordMin": "Құпиясөз кемінде 6 таңба",
  "val.selectGreenhouse": "Жылыжайды таңдаңыз",
  "val.areaPositive": "Ауданы 0-ден үлкен болуы керек",
  "val.durationPositive": "Ұзақтығы 0-ден үлкен болуы керек",
  "val.volumePositive": "Көлемі 0-ден үлкен болуы керек",
  "val.enterWateringType": "Суару түрін көрсетіңіз",
  "val.enterDate": "Күнін көрсетіңіз",
  "val.enterTime": "Уақытын көрсетіңіз",
  "val.tempMinLessMax": "min температура max-тан кіші болуы керек",
  "val.humidityMinLessMax": "min ылғалдылық max-тан кіші болуы керек",
  "val.humidityRange": "Ылғалдылық 0–100 болуы керек",
  "val.co2Min": "CO2 ≥ 0 болуы керек",
  "db.title": "Деректер базасын қарау",
  "db.subtitle": "Тек әкімшіге. SQLite кестелерін көру (read-only).",
  "db.table": "Кесте",
  "db.columns": "Бағандар",
  "db.fk": "Байланыстар (FK)",
  "db.noFk": "Байланыс жоқ",
  "db.rows": "Жолдар",
  "db.limit": "Лимит",
  "db.exportCsv": "CSV экспорт",
  "db.filters": "Сүзгілер",
  "db.selectColumn": "Бағанды таңдаңыз",
  "db.value": "Мәні",
  "db.sortAuto": "Сұрыптау: авто",
  "db.sortBy": "Сұрыптау",
  "db.op.contains": "құрамында",
  "db.op.eq": "тең",
  "db.op.gt": ">",
  "db.op.gte": "≥",
  "db.op.lt": "<",
  "db.op.lte": "≤",
  "db.op.isnull": "бос (NULL)",
  "db.op.notnull": "бос емес",
  "db.safeEditHint": "CRUD тек жұмыс кестелері үшін (жылыжай/дақыл/датчик/суару/тапсырма/қызметкер/хабарландыру).",
  "db.prev": "Артқа",
  "db.next": "Алға",
  "db.sensorSim.title": "Датчик деректерін симуляциялау",
  "db.sensorSim.enable": "Қосу",
  "db.sensorSim.disable": "Өшіру",
  "api.unauthorized": "Авторизация жоқ",
  "api.forbidden": "Құқық жеткіліксіз",
  "api.badData": "Деректер қате",
  "api.badParams": "Параметрлер қате",
  "api.badId": "ID қате",
  "api.greenhouseNotFound": "Жылыжай табылмады",
  "api.needIdOrAll": "id көрсетіңіз немесе all=true",
  "topbar.search": "Іздеу…",
  "topbar.notifications": "Хабарландырулар",
  "topbar.menu": "Мәзір",
  "topbar.profile": "Профиль",
  "topbar.logout": "Шығу",
  "forbidden.title": "403",
  "forbidden.text": "Бұл бөлімге кіруге құқығыңыз жоқ.",
  "forbidden.home": "Басты бет",
  "forbidden.switchUser": "Пайдаланушыны ауыстыру",
  "login.title": "Future Greenhouse",
  "login.subtitle": "Жылыжай басқару жүйесіне кіру",
  "login.login": "Логин",
  "login.password": "Құпиясөз",
  "login.show": "Көрсету",
  "login.hide": "Жасыру",
  "login.signIn": "Кіру",
  "login.signingIn": "Кіруде…",
  "login.adminOnly": "Тіркелу тек әкімші арқылы қолжетімді.",
};

export function t(locale: Locale, key: I18nKey): string {
  const dict = locale === "kk" ? KK : RU;
  return dict[key] ?? RU[key] ?? key;
}

