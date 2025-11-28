#!/bin/bash

# Скрипт для автоматического push изменений в GitHub

cd "$(dirname "$0")"

# Проверяем, есть ли изменения
if [ -z "$(git status --porcelain)" ]; then
    echo "Нет изменений для коммита"
    exit 0
fi

# Добавляем все изменения
git add .

# Создаем коммит с текущей датой и временем
COMMIT_MSG="Update: $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG"

# Push в GitHub
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Изменения успешно отправлены в GitHub"
else
    echo "❌ Ошибка при отправке изменений"
    exit 1
fi

