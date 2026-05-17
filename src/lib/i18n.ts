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
  | "reports.chart.avgHumGh"
  | "reports.chart.tasksCompletionDaily"
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
  | "ai.tab.chat"
  | "ai.tab.forecast"
  | "ai.tab.health"
  | "ai.tab.recommendations"
  | "ai.tab.map"
  | "ai.tab.vision"
  | "ai.tab.planner"
  | "ai.map.title"
  | "ai.map.subtitle"
  | "ai.map.refresh"
  | "ai.map.legend.ok"
  | "ai.map.legend.warn"
  | "ai.map.legend.alert"
  | "ai.map.summaryLoading"
  | "ai.map.summaryFailed"
  | "ai.map.noGreenhouses"
  | "ai.vision.title"
  | "ai.vision.subtitle"
  | "ai.vision.dropHint"
  | "ai.vision.pick"
  | "ai.vision.analyze"
  | "ai.vision.analyzing"
  | "ai.vision.limit"
  | "ai.vision.diagnosis"
  | "ai.vision.confidence"
  | "ai.vision.issues"
  | "ai.vision.actions"
  | "ai.vision.prevention"
  | "ai.vision.failed"
  | "ai.planner.title"
  | "ai.planner.subtitle"
  | "ai.planner.generate"
  | "ai.planner.generating"
  | "ai.planner.accept"
  | "ai.planner.saved"
  | "ai.planner.empty"
  | "ai.planner.failed"
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
  | "ai.training.guide.ai.how"
  | "ai.training.guide.ai.purpose"
  | "ai.training.guide.reports.how"
  | "ai.training.guide.reports.purpose"
  | "ai.training.guide.employees.how"
  | "ai.training.guide.employees.purpose"
  | "ai.training.guide.sensorEntry.how"
  | "ai.training.guide.sensorEntry.purpose"
  | "ai.training.guide.notifications.how"
  | "ai.training.guide.notifications.purpose"
  | "ai.training.guide.tasks.tip"
  | "ai.training.guide.tasks.how"
  | "ai.training.guide.tasks.purpose"
  | "ai.training.guide.watering.how"
  | "ai.training.guide.watering.purpose"
  | "ai.training.guide.parameters.how"
  | "ai.training.guide.parameters.purpose"
  | "ai.training.guide.cultures.how"
  | "ai.training.guide.cultures.purpose"
  | "ai.training.guide.greenhouses.how"
  | "ai.training.guide.greenhouses.purpose"
  | "ai.training.guide.dashboard.how"
  | "ai.training.guide.dashboard.purpose"
  | "ai.anomaly.legendAnomaly"
  | "ai.training.back"
  | "ai.training.howTo"
  | "ai.training.forWhat"
  | "ai.training.module"
  | "ai.training.completeHint"
  | "ai.training.pickRoleAgain"
  | "ai.training.roleAgronomistDesc"
  | "ai.training.roleAgronomist"
  | "ai.training.roleWorkerDesc"
  | "ai.training.roleWorker"
  | "ai.training.pickRole"
  | "cultures.hint.body"
  | "cultures.hint.title"
  | "notifications.empty"
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
  | "tasks.markDone"
  | "ai.forecast.title"
  | "ai.forecast.subtitle"
  | "ai.forecast.run"
  | "ai.forecast.empty"
  | "ai.health.title"
  | "ai.health.subtitle"
  | "ai.health.score"
  | "ai.recommendations.title"
  | "ai.recommendations.subtitle"
  | "ai.recommendations.refresh"
  | "dashboard.aiRecommendations.title"
  | "parameters.aiAnalyze"
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
  | "hardware.title"
  | "hardware.subtitle"
  | "hardware.temperature"
  | "hardware.humidity"
  | "hardware.online"
  | "hardware.offline"
  | "hardware.source"
  | "hardware.updated"
  | "hardware.saveToDb"
  | "hardware.savedOk"
  | "hardware.error"
  | "hardware.hint"
  | "hardware.greenhouse"
  | "hardware.greenhouseN"
  | "users.syncTeam"
  | "users.syncDone"
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
  "nav.db": "Живой датчик",
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
  "reports.chart.avgHumGh": "Средняя влажность по теплицам",
  "reports.chart.tasksCompletionDaily": "Выполнение задач по дням (%)",
  "reports.charts.analyticsBlock": "Дополнительная аналитика",
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
  "ai.tab.chat": "Чат",
  "ai.tab.forecast": "Прогноз",
  "ai.tab.health": "Здоровье",
  "ai.tab.recommendations": "Советы",
  "ai.tab.map": "Карта",
  "ai.tab.vision": "Фото",
  "ai.tab.planner": "План",
  "ai.map.title": "Интерактивная карта теплиц",
  "ai.map.subtitle": "Тепловая карта хозяйства: зелёный — норма, красный — проблемы. Нажмите на блок для AI-сводки.",
  "ai.map.refresh": "Обновить",
  "ai.map.legend.ok": "Норма",
  "ai.map.legend.warn": "Внимание",
  "ai.map.legend.alert": "Тревога",
  "ai.map.summaryLoading": "Формируем AI-сводку…",
  "ai.map.summaryFailed": "Не удалось получить сводку",
  "ai.map.noGreenhouses": "В базе нет теплиц. Выполните npm run db:seed или добавьте теплицы вручную.",
  "ai.vision.title": "Анализ фото растений",
  "ai.vision.subtitle": "Загрузите снимок с телефона — GPT-4o Vision определит болезнь или дефицит и подскажет действия.",
  "ai.vision.dropHint": "Сфотографируйте растение или выберите файл",
  "ai.vision.pick": "Выбрать фото",
  "ai.vision.analyze": "Анализировать",
  "ai.vision.analyzing": "Анализ…",
  "ai.vision.limit": "JPEG, PNG или WebP, до 5 МБ",
  "ai.vision.diagnosis": "Диагноз",
  "ai.vision.confidence": "Уверенность",
  "ai.vision.issues": "Наблюдения",
  "ai.vision.actions": "Что делать",
  "ai.vision.prevention": "Профилактика",
  "ai.vision.failed": "Не удалось проанализировать фото",
  "ai.planner.title": "AI-планировщик недели",
  "ai.planner.subtitle": "План на 7 дней по теплицам, задачам и поливу. Можно отредактировать и принять.",
  "ai.planner.generate": "Составить план",
  "ai.planner.generating": "Составляем…",
  "ai.planner.accept": "Принять план",
  "ai.planner.saved": "План сохранён в системе",
  "ai.planner.empty": "Нажмите «Составить план», чтобы сгенерировать расписание.",
  "ai.planner.failed": "Не удалось составить план",
  "tasks.markDone": "Отметить выполненной",
  "ai.info.training.data": "Тексты подсказок в приложении (не требует интернета).",
  "ai.info.training.body": "Пошаговый тур по разделам меню в зависимости от роли: оператор или агроном. Без тестов на память — только что за что отвечает и как пользоваться.",
  "ai.info.training.title": "Инструкция для новых сотрудников",
  "ai.info.planner.data": "Задачи, полив и список теплиц.",
  "ai.info.planner.body": "ИИ предлагает план работ на 7 дней с учётом открытых задач и расписания полива. План можно отредактировать и сохранить в системе.",
  "ai.info.planner.title": "Как работает планировщик",
  "ai.info.vision.data": "Только загруженное изображение (без сохранения в БД).",
  "ai.info.vision.body": "Вы загружаете снимок растения, листа или урожая. Фото отправляется в GPT-4o Vision: модель опишет состояние и предложит, что проверить или сделать. Снимок в базе не хранится.",
  "ai.info.vision.title": "Как работает анализ фото",
  "ai.info.recommendations.data": "Датчики, задачи, полив и статусы теплиц.",
  "ai.info.recommendations.body": "Список подсказок строится по правилам: температура или влажность вне нормы, просроченные задачи, статус теплицы. Обновляется при открытии вкладки.",
  "ai.info.recommendations.title": "Как работают советы",
  "ai.info.anomaly.data": "История датчиков за 7 или 14 дней по выбранной теплице.",
  "ai.info.anomaly.body": "Программа сравнивает каждое новое замерение с обычным уровнем за выбранный период. Резкий скачок или сильное отклонение от привычного — отмечается красной точкой. OpenAI здесь не используется — расчёт идёт на сервере по вашим данным.",
  "ai.info.anomaly.title": "Как работает поиск аномалий",
  "ai.info.forecast.data": "Показания датчиков за 7 дней и допустимые нормы из карточки теплицы.",
  "ai.info.forecast.body": "Система смотрит, как менялись температура и влажность за последние 7 дней, и продолжает эту тенденцию на ближайшие дни. Если прогноз выходит за зелёную зону норм теплицы — показываем предупреждение. Это ориентир для агронома, а не точный прогноз погоды.",
  "ai.info.forecast.title": "Как работает прогноз",
  "ai.info.map.data": "Текущие показания, задачи и полив по каждой теплице.",
  "ai.info.map.body": "Цвет блока показывает «здоровье» теплицы от 0 до 100%: учитываются датчики, просроченные задачи и полив. Нажмите на блок — получите краткую текстовую сводку от ИИ.",
  "ai.info.map.title": "Как работает карта",
  "ai.info.chat.data": "Теплицы, датчики, задачи, полив и культуры из базы данных.",
  "ai.info.chat.body": "Вы задаёте вопрос обычными словами. Ассистент подставляет актуальные данные из базы: теплицы, датчики, задачи, полив. Ответ формирует нейросеть GPT-4o-mini; история диалога сохраняется в системе.",
  "ai.info.chat.title": "Как работает чат",
  "ai.info.dataLabel": "Источник данных",
  "ai.training.s5.text": "Карта теплиц, прогноз, анализ фото и план недели — во вкладке «ИИ». Внизу каждой вкладки есть пояснение.",
  "ai.training.s5.title": "ИИ-ассистент",
  "ai.training.s4.a2": "Ответственному оператору",
  "ai.training.s4.a1": "Только агроному",
  "ai.training.s4.q": "Куда приходит уведомление о новой задаче?",
  "ai.training.s4.text": "При новой задаче приходит уведомление в колокольчик. Алерты датчиков видят все.",
  "ai.training.s4.title": "Уведомления",
  "ai.training.s3.a2": "Только директор",
  "ai.training.s3.a1": "Назначенный оператор (рабочий)",
  "ai.training.s3.q": "Кто может отметить задачу выполненной?",
  "ai.training.s3.text": "Вам приходят задачи в разделе «Задачи». Отметьте выполнение галочкой или кнопкой.",
  "ai.training.s3.title": "Задачи",
  "ai.training.s2.a3": "В профиле пользователя",
  "ai.training.s2.a2": "В разделе «Параметры»",
  "ai.training.s2.a1": "Только в отчётах за месяц",
  "ai.training.s2.q": "Где смотреть текущие показания датчиков?",
  "ai.training.s2.text": "На странице «Параметры» смотрите графики температуры и влажности в реальном времени.",
  "ai.training.s2.title": "Параметры",
  "ai.training.s1.text": "Future Greenhouse объединяет датчики, задачи, полив и ИИ. Вы будете отвечать за свою теплицу.",
  "notifications.empty": "Новых уведомлений нет. Сообщения о задачах и датчиках появятся здесь автоматически.",
  "cultures.hint.title": "Откуда берутся данные в таблице",
  "cultures.hint.body": "Каждая строка — культура в конкретной теплице и секции. Посев и сбор — даты, которые вносит агроном. Нормы температуры и влажности — целевые условия для этой культуры. Стадия (посев → рост → цветение → плодоношение → сбор) задаётся вручную; полоска показывает примерный прогресс по этапам. В карточке теплицы отображаются те же названия культур из этой таблицы.",
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
  "ai.training.s1.title": "Добро пожаловать",
  "ai.training.wrong": "Не совсем. Прочитайте подсказку ещё раз.",
  "ai.training.correct": "Верно! Можно идти дальше.",
  "ai.training.score": "Правильных ответов",
  "ai.training.complete": "Тур завершён!",
  "ai.training.restart": "Пройти снова",
  "ai.training.finish": "Завершить",
  "ai.training.next": "Далее",
  "ai.training.guide": "AI-гид",
  "ai.training.progress": "Шаг",
  "ai.training.subtitle": "Интерактивный тур для новых операторов с проверкой знаний.",
  "ai.training.title": "Режим обучения",
  "ai.anomaly.flagOk": "В норме",
  "ai.anomaly.flagHum": "Аномалия влажности",
  "ai.anomaly.flagTemp": "Аномалия температуры",
  "ai.anomaly.legend": "● Крупная красная точка — аномалия (статистический выброс или резкий скачок)",
  "ai.anomaly.chartHum": "Влажность %",
  "ai.anomaly.chartTemp": "Температура °C",
  "ai.anomaly.failed": "Не удалось построить анализ",
  "ai.anomaly.days": "дн.",
  "ai.anomaly.run": "Найти аномалии",
  "ai.anomaly.subtitle": "Красные точки на графике — необычные скачки температуры и влажности по истории датчиков.",
  "ai.anomaly.title": "Детектор аномалий",
  "ai.vision.hint": "Можно загружать растение, плод, лист, урожай или проблему на фото.",
  "ai.tab.training": "Обучение",
  "ai.tab.anomaly": "Аномалии",
  "ai.forecast.title": "AI-аналитика и прогноз",
  "ai.forecast.subtitle": "История 7 дней и прогноз на 3 дня с зонами риска (зелёная / жёлтая / красная).",
  "ai.forecast.run": "Построить прогноз",
  "ai.forecast.empty": "Выберите теплицу и нажмите «Построить прогноз».",
  "ai.health.title": "Здоровье теплиц",
  "ai.health.subtitle": "Оценка 0–100% по датчикам, задачам и поливу.",
  "ai.health.score": "Здоровье",
  "ai.recommendations.title": "AI-рекомендации",
  "ai.recommendations.subtitle": "Автоматические советы по данным системы.",
  "ai.recommendations.refresh": "Обновить",
  "dashboard.aiRecommendations.title": "AI-советы",
  "parameters.aiAnalyze": "AI-анализ",
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
  "db.title": "Живой датчик ESP32",
  "db.subtitle":
    "Показания с вашего контроллера в реальном времени. Для защиты: подключите ESP32 к той же Wi‑Fi сети, что и компьютер с системой.",
  "hardware.title": "Температура и влажность с датчика",
  "hardware.subtitle":
    "Данные приходят с платы ESP32 по Wi‑Fi. Обновление каждые 2–3 секунды. Можно записать замер в базу — он появится в «Параметрах» и отчётах.",
  "hardware.temperature": "Температура",
  "hardware.humidity": "Влажность",
  "hardware.online": "Датчик на связи",
  "hardware.offline": "Нет связи",
  "hardware.source": "Адрес контроллера",
  "hardware.updated": "Последнее обновление",
  "hardware.saveToDb": "Записать в базу",
  "hardware.savedOk": "Показание сохранено в базе данных",
  "hardware.error": "Не удалось получить данные с контроллера",
  "hardware.hint":
    "Если статус «Нет связи»: проверьте, что ESP32 включён, в той же сети Wi‑Fi, и IP верный (по умолчанию 10.233.53.143). В `.env.local` можно задать `ARDUINO_SENSOR_URL=http://…/`.",
  "hardware.greenhouse": "Теплица для записи",
  "hardware.greenhouseN": "Теплица №",
  "users.syncTeam": "Создать аккаунты команды",
  "users.syncDone": "Аккаунты команды уже в системе",
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
    "Карточки (3 колонки), текущие показатели и статусы. Кнопки редактирования скрываются по роли.",
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
    "На вкладке «Графики» — урожай, вода, задачи, климат и ещё 6 диаграмм аналитики. На «Данные» — таблицы.",
  "reports.tab.charts": "Графиктер",
  "reports.tab.data": "Деректер",
  "reports.chart.tasksShare": "Тапсырмалар: орындалған / орындалмаған",
  "reports.chart.wateringShare": "Суғару: орындалған / күтуде",
  "reports.chart.taskPriorities": "Тапсырмалар басымдығы бойынша",
  "reports.chart.cultureStages": "Дақылдар сатысы бойынша",
  "reports.chart.avgTempGh": "Жылыжайлар бойынша орташа температура",
  "reports.chart.co2Daily": "CO₂ күндер бойынша",
  "reports.chart.notificationsByType": "Хабарландырулар түрі бойынша",
  "reports.chart.avgHumGh": "Жылыжайлар бойынша орташа ылғалдылық",
  "reports.chart.tasksCompletionDaily": "Күндер бойынша тапсырма орындалуы (%)",
  "reports.charts.analyticsBlock": "Қосымша талдау",
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
  "ai.tab.chat": "Чат",
  "ai.tab.forecast": "Болжам",
  "ai.tab.health": "Денсаулық",
  "ai.tab.recommendations": "Кеңестер",
  "ai.tab.map": "Карта",
  "ai.tab.vision": "Фото",
  "ai.tab.planner": "Жоспар",
  "ai.map.title": "Жылыжайлардың интерактивті картасы",
  "ai.map.subtitle": "Жылу картасы: жасыл — норма, қызыл — мәселе. AI-қорытынды үшін басыңыз.",
  "ai.map.refresh": "Жаңарту",
  "ai.map.legend.ok": "Норма",
  "ai.map.legend.warn": "Назар",
  "ai.map.legend.alert": "Дабыл",
  "ai.map.summaryLoading": "AI-қорытынды дайындалуда…",
  "ai.map.summaryFailed": "Қорытынды алынбады",
  "ai.map.noGreenhouses": "Базада жылыжай жоқ. npm run db:seed орындаңыз немесе қолмен қосыңыз.",
  "ai.vision.title": "Өсімдік фотосын талдау",
  "ai.vision.subtitle": "Телефоннан сурет жүктеңіз — GPT-4o Vision ауру немесе тапшылықты анықтайды.",
  "ai.vision.dropHint": "Өсімдікті суретке түсіріңіз немесе файл таңдаңыз",
  "ai.vision.pick": "Фото таңдау",
  "ai.vision.analyze": "Талдау",
  "ai.vision.analyzing": "Талдау…",
  "ai.vision.limit": "JPEG, PNG немесе WebP, 5 МБ-қа дейін",
  "ai.vision.diagnosis": "Диагноз",
  "ai.vision.confidence": "Сенімділік",
  "ai.vision.issues": "Бақылау",
  "ai.vision.actions": "Не істеу керек",
  "ai.vision.prevention": "Алдын алу",
  "ai.vision.failed": "Фото талданбады",
  "ai.planner.title": "AI апта жоспарлаушысы",
  "ai.planner.subtitle": "7 күндік жоспар: жылыжайлар, тапсырмалар, суару. Өңдеуге және қабылдауға болады.",
  "ai.planner.generate": "Жоспар құру",
  "ai.planner.generating": "Құрылады…",
  "ai.planner.accept": "Жоспарды қабылдау",
  "ai.planner.saved": "Жоспар сақталды",
  "ai.planner.empty": "«Жоспар құру» батырмасын басыңыз.",
  "ai.planner.failed": "Жоспар құрылмады",
  "ai.forecast.title": "AI-талдау және болжам",
  "ai.forecast.subtitle": "7 күн тарихы және 3 күнге болжам (жасыл / сары / қызыл аймақтар).",
  "ai.forecast.run": "Болжам құру",
  "ai.forecast.empty": "Жылыжайды таңдап, «Болжам құру» батырмасын басыңыз.",
  "ai.health.title": "Жылыжай денсаулығы",
  "ai.health.subtitle": "Датчиктер, тапсырмалар және суғару бойынша 0–100%.",
  "ai.health.score": "Денсаулық",
  "ai.recommendations.title": "AI-ұсыныстар",
  "ai.recommendations.subtitle": "Жүйе деректері бойынша автоматты кеңестер.",
  "ai.recommendations.refresh": "Жаңарту",
  "dashboard.aiRecommendations.title": "AI-кеңестер",
  "parameters.aiAnalyze": "AI-талдау",
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
  "db.title": "Живой датчик ESP32",
  "db.subtitle":
    "Показания с вашего контроллера в реальном времени. Для защиты: подключите ESP32 к той же Wi‑Fi сети, что и компьютер с системой.",
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
  "parameters.charts.noData": "Нет записей за выбранный период — включите симуляцию в разделе «База данных» или подождите новые замеры.",
  "tasks.markDone": "Отметить выполненной",
  "ai.info.training.data": "Статический контент в приложении (i18n).",
  "ai.info.training.body": "Локальный сценарий онбординга: шаги и вопросы без отправки в OpenAI. Для новых операторов.",
  "ai.info.training.title": "Режим обучения",
  "ai.info.planner.data": "tasks, watering_schedule, greenhouses; сохранение в app_settings (ai_week_plan).",
  "ai.info.planner.body": "GPT-4o-mini строит план на 7 дней по открытым задачам и поливам. Можно редактировать и сохранить.",
  "ai.info.planner.title": "Как работает планировщик",
  "ai.info.vision.data": "Загрузка файла → /api/ai/vision → OpenAI gpt-4o (не сохраняется в БД).",
  "ai.info.vision.body": "Изображение отправляется в GPT-4o Vision. Подходит растение, плод, лист, урожай — модель опишет состояние и даст рекомендации.",
  "ai.info.vision.title": "Как работает анализ фото",
  "ai.info.recommendations.data": "Датчики, tasks, watering_schedule, greenhouses.",
  "ai.info.recommendations.body": "Правила на сервере: отклонения датчиков, просрочки, статус теплицы. Обновляются при открытии вкладки.",
  "ai.info.recommendations.title": "Как работают советы",
  "ai.info.anomaly.data": "sensor_data за 7/14 дней по выбранной теплице.",
  "ai.info.anomaly.body": "Z-score по истории и порог резкого скачка между соседними точками. Без вызова OpenAI — быстрый математический анализ.",
  "ai.info.anomaly.title": "Как работает детектор",
  "ai.info.forecast.data": "sensor_data за 7 дней; нормы temp/humidity из greenhouses.",
  "ai.info.forecast.body": "Линейная экстраполяция по 7 дням истории датчиков + зоны риска по нормам теплицы.",
  "ai.info.forecast.title": "Как работает прогноз",
  "ai.info.map.data": "computeGreenhouseHealth(); при клике — buildSingleGreenhouseContext + gpt-4o-mini.",
  "ai.info.map.body": "Цвет блока = оценка здоровья 0–100% (датчики, просроченные задачи, полив). Клик — краткая AI-сводка по теплице.",
  "ai.info.map.title": "Как работает карта",
  "ai.info.chat.data": "Таблицы greenhouses, sensor_data, tasks, watering_schedule, cultures; OPENAI_API_KEY.",
  "ai.info.chat.body": "GPT-4o-mini отвечает с учётом текущих показаний теплиц, задач и полива из базы. История сохраняется в ai_chat_history.",
  "ai.info.chat.title": "Как работает чат",
  "ai.info.dataLabel": "Источник данных",
  "ai.training.s5.text": "Карта теплиц, прогноз, анализ фото и план недели — во вкладке «ИИ». Внизу каждой вкладки есть пояснение.",
  "ai.training.s5.title": "ИИ-ассистент",
  "ai.training.s4.a2": "Ответственному оператору",
  "ai.training.s4.a1": "Только агроному",
  "ai.training.s4.q": "Куда приходит уведомление о новой задаче?",
  "ai.training.s4.text": "При новой задаче приходит уведомление в колокольчик. Алерты датчиков видят все.",
  "ai.training.s4.title": "Уведомления",
  "ai.training.s3.a2": "Только директор",
  "ai.training.s3.a1": "Назначенный оператор (рабочий)",
  "ai.training.s3.q": "Кто может отметить задачу выполненной?",
  "ai.training.s3.text": "Вам приходят задачи в разделе «Задачи». Отметьте выполнение галочкой или кнопкой.",
  "ai.training.s3.title": "Задачи",
  "ai.training.s2.a3": "В профиле пользователя",
  "ai.training.s2.a2": "В разделе «Параметры»",
  "ai.training.s2.a1": "Только в отчётах за месяц",
  "ai.training.s2.q": "Где смотреть текущие показания датчиков?",
  "ai.training.s2.text": "На странице «Параметры» смотрите графики температуры и влажности в реальном времени.",
  "ai.training.s2.title": "Параметры",
  "ai.training.s1.text": "Future Greenhouse объединяет датчики, задачи, полив и ИИ. Вы будете отвечать за свою теплицу.",
  "ai.training.s1.title": "Добро пожаловать",
  "ai.training.wrong": "Не совсем. Прочитайте подсказку ещё раз.",
  "ai.training.correct": "Верно! Можно идти дальше.",
  "ai.training.score": "Правильных ответов",
  "ai.training.complete": "Тур завершён!",
  "ai.training.restart": "Пройти снова",
  "ai.training.finish": "Завершить",
  "ai.training.next": "Далее",
  "ai.training.guide": "AI-гид",
  "ai.training.progress": "Шаг",
  "ai.training.subtitle": "Интерактивный тур для новых операторов с проверкой знаний.",
  "ai.training.title": "Режим обучения",
  "ai.anomaly.flagOk": "В норме",
  "ai.anomaly.flagHum": "Аномалия влажности",
  "ai.anomaly.flagTemp": "Аномалия температуры",
  "ai.anomaly.legend": "● Крупная красная точка — аномалия (статистический выброс или резкий скачок)",
  "ai.anomaly.chartHum": "Влажность %",
  "ai.anomaly.chartTemp": "Температура °C",
  "ai.anomaly.failed": "Не удалось построить анализ",
  "ai.anomaly.days": "дн.",
  "ai.anomaly.run": "Найти аномалии",
  "ai.anomaly.subtitle": "Красные точки на графике — необычные скачки температуры и влажности по истории датчиков.",
  "ai.anomaly.title": "Детектор аномалий",
  "ai.vision.hint": "Можно загружать растение, плод, лист, урожай или проблему на фото.",
  "ai.tab.training": "Обучение",
  "ai.tab.anomaly": "Аномалии",
  "notifications.empty": "Новых уведомлений нет. Сообщения о задачах и датчиках появятся здесь автоматически.",
  "cultures.hint.title": "Откуда берутся данные в таблице",
  "cultures.hint.body": "Каждая строка — культура в конкретной теплице и секции. Посев и сбор — даты, которые вносит агроном. Нормы температуры и влажности — целевые условия для этой культуры. Стадия (посев → рост → цветение → плодоношение → сбор) задаётся вручную; полоска показывает примерный прогресс по этапам. В карточке теплицы отображаются те же названия культур из этой таблицы.",
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
  "hardware.title": "Температура и влажность с датчика",
  "hardware.subtitle":
    "Данные приходят с платы ESP32 по Wi‑Fi. Обновление каждые 2–3 секунды. Можно записать замер в базу — он появится в «Параметрах» и отчётах.",
  "hardware.temperature": "Температура",
  "hardware.humidity": "Влажность",
  "hardware.online": "Датчик на связи",
  "hardware.offline": "Нет связи",
  "hardware.source": "Адрес контроллера",
  "hardware.updated": "Последнее обновление",
  "hardware.saveToDb": "Записать в базу",
  "hardware.savedOk": "Показание сохранено в базе данных",
  "hardware.error": "Не удалось получить данные с контроллера",
  "hardware.hint":
    "Если статус «Нет связи»: проверьте, что ESP32 включён, в той же сети Wi‑Fi, и IP верный (по умолчанию 10.233.53.143). В `.env.local` можно задать `ARDUINO_SENSOR_URL=http://…/`.",
  "hardware.greenhouse": "Теплица для записи",
  "hardware.greenhouseN": "Теплица №",
  "users.syncTeam": "Создать аккаунты команды",
  "users.syncDone": "Аккаунты команды уже в системе",
};

export function t(locale: Locale, key: I18nKey): string {
  const dict = locale === "kk" ? KK : RU;
  return dict[key] ?? RU[key] ?? key;
}

