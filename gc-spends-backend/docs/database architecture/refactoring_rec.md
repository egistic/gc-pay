Ниже — “crash test” текущей схемы и план действий, чтобы модуль «Платежи» на FastAPI уверенно рос в сторону микросервисов без болей в данных, миграциях и продуктиве.

# 1) Ключевые риски и проблемные места в схеме БД

## 1.1 Статусы как `VARCHAR`

* **Риск:** расхождения значений, опечатки, сложность миграций и аналитики.
* **Решение:** явные enum-типы в БД и/или справочники: `payment_request_status`, `distribution_status`, `sub_registrar_assignment_status`, `document_status`, `contract_type`. Добавить CHECK-констрейнты и миграции на приведение данных.

## 1.2 Денежные поля и валюты

* **Риск:** смешение валют, неправильная агрегация `amount_total/vat_total`, проблемы с масштабом (scale) и округлением.
* **Решение:** хранить суммы в валюте строки + денормализованную сумму в «базовой валюте» по курсу на дату (нужна таблица `exchange_rates(date, currency_code, rate)`). Для отчётности — материализованные представления. Жёстко фиксировать `NUMERIC(18,2)` и `scale` из `currencies`.

## 1.3 Связь “сплитованных” заявок

* **Риск:** рекурсия через `original_request_id` без ограничений → циклы, «висячие» потомки.
* **Решение:** CHECK `original_request_id != id`, индекс на `original_request_id`, CASCADE-поведение запретить; вместо удаления — soft delete и «закрытие» дерева. Хранить `split_group_id` + `split_sequence` для целостности.

## 1.4 Soft delete и внешние ключи

* **Риск:** `deleted = true` ломает отчёты и внешние связи (строки, файлы, события остаются «живыми»).
* **Решение:** повсеместно фильтровать `deleted=false` через представления; запретить soft delete для узлов с активными дочерними; предусмотреть «архивацию» группой (request + lines + files + events).

## 1.5 Логи событий (`request_events.payload VARCHAR(4000)`)

* **Риск:** 4000 символов мало, JSON ломается, нет схемы, нет поиска.
* **Решение:** `JSONB` + JSON-схемы на уровне приложения; индексы GIN для частых ключей; «snapshots» хранить отдельно (версионирование заявки).

## 1.6 Требования к документам vs фактические файлы

* **Риск:** расхождение `article_required_docs` и `line_required_docs`; нельзя доказать полноту комплекта; файл может удалиться/переименоваться.
* **Решение:** строгий реестр типов документов; `line_required_docs.file_id` NOT NULL для `is_provided=true`; триггер, который запрещает изменение статуса без файла; валидация маски имени и типа (см. стандарт наименование).

## 1.7 RBAC + позиции + делегирование во времени

* **Риск:** пересекающиеся периоды, множественные роли → неоднозначность «кто сейчас имеет право».
* **Решение:** уникальные ограничения на перекрытия периодов (exclusion constraints); вычисление «эффективных» прав на дату/время (`valid_from/valid_to`). Логику прав держать в сервисе авторизации, а не распылять по запросам.

## 1.8 Контракты и строки заявок

* **Риск:** неочевидная кардинальность `payment_request_lines ↔ line_contracts` (1\:N? N:1?), связь сплитов и контрактов.
* **Решение:** явно зафиксировать бизнес-правило: одна строка может быть покрыта несколькими контрактами (тогда N:1 в `line_contracts` на `line_id`), либо ровно одним. Добавить уникальные индексы/валидаторы под выбранное правило.

## 1.9 Идемпотентность создания заявок

* **Риск:** дубли («двойной клик», retry, многопоточность), мы это уже наблюдали ранее.
* **Решение:** `idempotency_key` на уровне запроса (уникальный), optimistic locking (версионное поле `updated_at`/`row_version`), транзакции уровня строки, серверная блокировка повторной отправки.

## 1.10 Производительность

* **Риск:** тяжёлые джойны (events, files, roles, positions), рост таблиц, отчёты «за всё время».
* **Решение:** обязательные индексы (см. §4), материализованные вьюхи под отчёты, денормализация ключевых атрибутов (контрагент, статья, статус, дата), партиционирование по дате создания для `request_events`/`request_files`.

## 1.11 Приоритезация платежей

* **Риск:** «приоритет» разрозненно хранится/считается «на лету», не воспроизводим.
* **Решение:** ввести модель приоритета в БД: хранить **влияние** (impact) и **срочность** (urgency), вычислять ранг 1/2/3 по методике; сохранять дату/основание перерасчёта; логировать историю изменения приоритета. Методика фиксирует уровни и критерии влияния/срочности, а также правило эскалации со временем.

## 1.12 Файлохранилище и стандарт имён

* **Риск:** потеря соответствия типа документа и имени файла, коллизии, спецсимволы.
* **Решение:** хранить «сырой» UUID-файл в сторидже + «человеческое» имя отдельно; валидировать маску имени и тип файла на бэкенде согласно стандарту; не полагаться на `file_name` как на уникальный.

## 1.13 Межсервисные FK (на будущее)

* **Риск:** в микросервисах FK через границы — антипаттерн (слабая связанность ломается).
* **Решение:** в монолите пока допустимо, но по мере декомпозиции убрать межсервисные FK, перейти на асинхронные интеграции (event-carried state transfer) и локальные read-модели.

---

# 2) Мини-рефактор модели под модуль «Платежи» (с учётом FastAPI)

## 2.1 Новые/уточнённые таблицы

* `payment_priority`

  * `request_id` (FK)
  * `impact` ENUM(`HIGH`,`MEDIUM`)
  * `urgency` ENUM(`HIGH`,`MEDIUM`)
  * `priority_rank` SMALLINT (1..3) — по методике; пересчитывается по правилам эскалации
  * `reason`, `calculated_at`, `next_recalc_at`
* `exchange_rates(date, currency_code, rate)` с уникальным `(date,currency_code)`
* `idempotency_keys(key, scope, request_hash, created_at)` с уникальным `(key, scope)`

## 2.2 Поля/ограничения

* Все статусы → enum-типы (Alembic миграции c data backfill).
* `payment_requests.original_request_id` → добавить `split_group_id` (UUID), уникальность `(split_group_id, split_sequence)`.
* `request_events.payload` → `JSONB` + GIN индекс.
* `line_required_docs`: CHECK `is_provided=false OR file_id IS NOT NULL`.
* Денежные суммы: CHECK `amount_total>=0`, `vat_total>=0`, согласованность валют.

---

# 3) API-слой (FastAPI) — практические моменты

## 3.1 Надёжность

* Идемпотентность POST `/payment-requests` через заголовок `Idempotency-Key`.
* Optimistic locking: `If-Match: <row_version>` при PATCH.
* Валидации Pydantic v2 + `Annotated` + `typing_extensions` для строгих типов.

## 3.2 Доменные сервисы (монолитный старт)

* `payments` (заявки, строки, приоритет)
* `documents` (файлы, требования, маски имён)
* `directory` (контрагенты, валюты, ставки НДС, статьи)
* `workflow` (назначения, отчёты суб-регистратора, маршруты)
* `contracts` (контракты, экспортные контракты)
* `audit` (events + snapshots)

Сразу выделить слои: `routers` → `services` → `repos` → `models`. Запретить бизнес-логику в `routers`.

## 3.3 События и интеграции

* События домена (outbox): `PaymentRequestCreated`, `PriorityChanged`, `DocumentsCompleted`, `Distributed`, `Approved`.
* Транспорт: Kafka/Redpanda (позже), пока — outbox таблица + фоновые воркеры (APScheduler/Celery-beat).

---

# 4) Индексы (минимум необходимый)

* `payment_requests`:

  * `idx_pr_number_uk`, `idx_pr_counterparty`, `idx_pr_status`, `idx_pr_due_date`, `idx_pr_created_at`, `idx_pr_split_group_seq`
* `payment_request_lines`:

  * `idx_prl_request`, `idx_prl_article`, `idx_prl_status`
* `request_events`:

  * `idx_re_request`, `idx_re_event_type`, `gin_re_payload`
* `request_files`:

  * `idx_rf_request`, `idx_rf_doc_type`
* `sub_registrar_assignments`:

  * `idx_sra_request`, `idx_sra_user`, `idx_sra_status`
* `sub_registrar_reports`:

  * `idx_srr_request`, `idx_srr_status`
* `distributor_requests`:

  * `idx_dr_original_request`, `idx_dr_status`, `idx_dr_article`
* `expense_splits`:

  * `idx_es_request`, `idx_es_article`, `idx_es_contract`
* `line_required_docs`:

  * `idx_lrd_line`, `idx_lrd_doc_type`, `idx_lrd_file`
* `contracts`, `export_contracts`:

  * по `counterparty_id`, `contract_number`, `contract_date`
* `payment_priority`:

  * `idx_pp_request`, `idx_pp_rank`, `idx_pp_next_recalc`

---

# 5) Миграции и данные

1. **Подготовка enum-типов** → временные колонки → бэкофисный скрипт маппинга → свитч статусов → Drop старых колонок.
2. **Backfill приоритета**: рассчитать `impact/urgency/rank` по правилам (см. методику), создать историю пересчётов.
3. **Маски файлов**: миграция имён в «чистый» формат, вынесение UUID-имён в сторидж.
4. **Индексация**: добавить индексы «безопастно» (concurrently).
5. **Материализованные вьюхи** для отчётов (обновление по расписанию).

---

# 6) Переход к микросервисам (дорожная карта)

**Границы (bounded contexts):**

* `identity` (users/roles/delegation/positions) — БД своя
* `directory` (справочники) — своя БД
* `payments` (заявки/строки/приоритет) — своя БД
* `docs` (файлы и требования) — своя БД + Object Storage (S3/MinIO)
* `workflow` (назначения/репорты/маршруты) — своя БД
* `contracts` — своя БД

**Принципы:**

* Без кросс-FK между сервисами; обмен — через события и вытягивание read-моделей.
* **Outbox pattern**, idempotency consumerов, схемы событий (Avro/JSON Schema).
* Консистентность — сага оркестрации для длинных процессов (заявка → документы → распределение → оплата).

---

# 7) Тестирование

* **Unit**: бизнес-правила (приоритет, статусы, сплиты, проверки документов).
* **Contract tests**: Pacto/Pact между фронтом и FastAPI (OpenAPI как контракт).
* **E2E**: docker-compose окружение с тестовым Postgres + MinIO; сценарии по ролям.
* **Нагрузка**: PG Bench + профилирование «тяжёлых» отчётов.

---

# 8) Следующие шаги для тикета «Платежи»

1. Ввести `payment_priority` и API:

   * `POST /payment-requests/{id}/priority: {impact, urgency}` → calc `priority_rank` (1/2/3) и расписание эскалации. Основание — методика.
2. Идемпотентный `POST /payment-requests` c `Idempotency-Key`.
3. Перевести статусы `payment_requests.status` и `distribution_status` на enum.
4. Добавить индексы из §4.
5. Проверки `line_required_docs` (CHECK+триггер) и валидация масок имён при загрузке.
6. События `PaymentRequestCreated`, `PriorityChanged`, `DocumentsCompleted` (outbox).


