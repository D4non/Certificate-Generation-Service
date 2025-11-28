# Бэкенд API для сервиса генерации сертификатов

FastAPI бэкенд для работы с фронтендом.

## Установка

```bash
cd backend
pip install -r requirements.txt
```

## Запуск

```bash
python main.py
```

Или через uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Учетные данные для входа

- **Логин:** `admin` / **Пароль:** `admin123`
- **Логин:** `user` / **Пароль:** `user123`

## API Endpoints

- `POST /api/auth/login` - Авторизация
- `GET /api/templates` - Список шаблонов
- `POST /api/templates/upload` - Загрузка шаблона
- `DELETE /api/templates/{id}` - Удаление шаблона
- `POST /api/participants/parse` - Парсинг файла участников
- `POST /api/certificates/generate` - Генерация сертификатов
- `GET /api/certificates/download/{filename}` - Скачивание ZIP архива

## Документация API

После запуска сервера доступна автоматическая документация:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## ⚠️ Важно

Это демо-версия бэкенда. В продакшене необходимо:
- Использовать хеширование паролей
- Реализовать JWT токены
- Добавить базу данных
- Реализовать генерацию PDF сертификатов
- Добавить отправку email

