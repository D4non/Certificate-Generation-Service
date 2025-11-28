# Инструкция по работе с Git

## Первоначальная настройка (один раз)

### 1. Настройте аутентификацию GitHub

**Вариант A: SSH ключ (рекомендуется)**

```bash
# Проверьте, есть ли SSH ключ
ls -la ~/.ssh/id_ed25519.pub

# Если нет, создайте:
ssh-keygen -t ed25519 -C "your_email@example.com"
# Нажмите Enter для всех вопросов

# Скопируйте публичный ключ
cat ~/.ssh/id_ed25519.pub

# Добавьте его в GitHub:
# 1. Откройте https://github.com/settings/keys
# 2. Нажмите "New SSH key"
# 3. Вставьте скопированный ключ
# 4. Сохраните

# Измените remote на SSH
git remote set-url origin git@github.com:D4non/Certificate-Generation-Service.git
```

**Вариант B: Personal Access Token**

1. Откройте: https://github.com/settings/tokens
2. Нажмите "Generate new token (classic)"
3. Выберите scope: `repo` (все галочки в разделе repo)
4. Скопируйте токен
5. Используйте токен вместо пароля при push

### 2. Выполните первый push

```bash
cd "/home/daniil/Рабочий стол/Certificate Generation Service"
git push -u origin main
```

---

## Ежедневная работа (после каждого изменения)

Когда вы внесли изменения в код, выполните эти команды:

```bash
cd "/home/daniil/Рабочий стол/Certificate Generation Service"

# 1. Посмотрите, что изменилось
git status

# 2. Добавьте все изменения
git add .

# 3. Создайте коммит с описанием
git commit -m "Описание ваших изменений"

# 4. Отправьте в GitHub
git push
```

### Пример:

```bash
cd "/home/daniil/Рабочий стол/Certificate Generation Service"
git add .
git commit -m "Добавлена функция создания мероприятий"
git push
```

---

## Полезные команды

```bash
# Посмотреть историю коммитов
git log --oneline

# Посмотреть изменения в файлах
git diff

# Отменить изменения в файле (до git add)
git checkout -- имя_файла

# Отменить git add (но оставить изменения)
git reset

# Посмотреть текущую ветку
git branch
```

---

## Быстрый способ (скрипт)

Если хотите использовать скрипт для быстрого push:

```bash
./git-push.sh
```

Скрипт автоматически:
1. Добавит все изменения
2. Создаст коммит с текущей датой/временем
3. Отправит в GitHub

