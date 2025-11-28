from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional
import uvicorn
import os
import uuid
from datetime import datetime
from pydantic import BaseModel
import shutil
import zipfile
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER
from io import BytesIO
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import logging
import json
import random

app = FastAPI(title="Certificate Generation Service API")

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# CORS настройки для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Простая база данных в памяти (для демо)
users_db = {
    "foundation": {
        "username": "foundation",
        "password": "foundation123",
        "disabled": False,
        "organization": "foundation",
    },
    "lyceum": {
        "username": "lyceum",
        "password": "lyceum123",
        "disabled": False,
        "organization": "lyceum",
    },
    "ft": {
        "username": "ft",
        "password": "ft123",
        "disabled": False,
        "organization": "ft",
    },
    "university": {
        "username": "university",
        "password": "university123",
        "disabled": False,
        "organization": "university",
    },
    "gymnasium": {
        "username": "gymnasium",
        "password": "gymnasium123",
        "disabled": False,
        "organization": "gymnasium",
    },
    # Старые пользователи для совместимости
    "admin": {
        "username": "admin",
        "password": "admin123",
        "disabled": False,
        "organization": "foundation",
    },
    "user": {
        "username": "user",
        "password": "user123",
        "disabled": False,
        "organization": "foundation",
    }
}

templates_db: List[dict] = []
certificates_db: List[dict] = []
# Файл для хранения мероприятий
EVENTS_DB_FILE = Path("events_db.json")

# Функция загрузки мероприятий из файла
def load_events_db() -> List[dict]:
    """Загружает мероприятия из файла"""
    if EVENTS_DB_FILE.exists():
        try:
            with open(EVENTS_DB_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading events_db: {e}")
            return []
    return []

# Функция сохранения мероприятий в файл
def save_events_db(events: List[dict]):
    """Сохраняет мероприятия в файл"""
    try:
        with open(EVENTS_DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(events, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving events_db: {e}")

# Загружаем мероприятия при запуске
events_db: List[dict] = load_events_db()  # Хранилище мероприятий

# Создаем папки для хранения файлов
UPLOAD_DIR = Path("uploads")
TEMPLATES_DIR = UPLOAD_DIR / "templates"
CERTIFICATES_DIR = UPLOAD_DIR / "certificates"
BASE_TEMPLATES_DIR = Path("templates")
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
CERTIFICATES_DIR.mkdir(parents=True, exist_ok=True)

# Функция инициализации базовых шаблонов
def initialize_base_templates():
    """Инициализирует базовые шаблоны при первом запуске"""
    base_templates = [
        {
            "name": "Классический сертификат",
            "type": "svg",
            "file": "classic_certificate.svg"
        },
        {
            "name": "Современный сертификат",
            "type": "html",
            "file": "modern_certificate.html"
        },
        {
            "name": "Элегантный сертификат",
            "type": "svg",
            "file": "elegant_certificate.svg"
        },
        {
            "name": "Минималистичный сертификат",
            "type": "html",
            "file": "minimal_certificate.html"
        }
    ]
    
    for template_info in base_templates:
        # Проверяем, не существует ли уже такой шаблон
        existing = next((t for t in templates_db if t["name"] == template_info["name"]), None)
        if existing:
            continue
        
        template_file = BASE_TEMPLATES_DIR / template_info["file"]
        if not template_file.exists():
            continue
        
        template_id = str(uuid.uuid4())
        dest_file = TEMPLATES_DIR / f"{template_id}{template_file.suffix}"
        
        # Копируем файл шаблона
        shutil.copy(template_file, dest_file)
        
        template = {
            "id": template_id,
            "name": template_info["name"],
            "type": template_info["type"],
            "file_url": f"/api/templates/{template_id}/file",
            "preview_url": None
        }
        templates_db.append(template)
    
    if templates_db:
        print(f"✅ Инициализировано {len(templates_db)} базовых шаблонов")

# OAuth2 схема
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Модели данных
class Participant(BaseModel):
    fio: str
    email: str
    role: str
    place: Optional[int] = None

class CertificateTemplate(BaseModel):
    id: str
    name: str
    type: str
    file_url: Optional[str] = None
    preview_url: Optional[str] = None

class EventRole(BaseModel):
    name: str
    color: str

class Event(BaseModel):
    id: str
    name: str
    organization_id: str
    created_at: str
    description: Optional[str] = None
    roles: Optional[List[EventRole]] = []

class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    roles: Optional[List[str]] = []

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    roles: Optional[List[str]] = None

class CertificateGenerationRequest(BaseModel):
    template_id: str
    participants: List[Participant]
    event_name: str
    issue_date: Optional[str] = None
    send_email: Optional[bool] = False
    email_subject: Optional[str] = None
    email_body: Optional[str] = None

# Функция генерации случайного цвета для роли
def generate_random_color() -> str:
    """Генерирует случайный цвет в формате HEX"""
    colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
        "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52BE80",
        "#E74C3C", "#3498DB", "#9B59B6", "#1ABC9C", "#F39C12",
        "#E67E22", "#34495E", "#16A085", "#27AE60", "#2980B9"
    ]
    return random.choice(colors)

# Функция проверки пользователя
def verify_user(username: str, password: str):
    user = users_db.get(username)
    if not user or user["password"] != password or user["disabled"]:
        return None
    return user

# Зависимость для получения текущего пользователя
async def get_current_user(token: str = Depends(oauth2_scheme)):
    # В реальном приложении здесь должна быть проверка токена
    # Для демо извлекаем username из токена формата "mock_token_{username}"
    try:
        if token and token.startswith("mock_token_"):
            username = token.replace("mock_token_", "")
            user = users_db.get(username)
            if user:
                return {"username": username, "organization": user.get("organization", "foundation")}
    except Exception as e:
        print(f"Error in get_current_user: {e}")
    # Fallback для совместимости
    return {"username": "admin", "organization": "foundation"}

# ========== АВТОРИЗАЦИЯ ==========
@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    print(f"Login attempt: username={form_data.username}")
    user = verify_user(form_data.username, form_data.password)
    if not user:
        print(f"Login failed: user not found or wrong password")
        raise HTTPException(
            status_code=401,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print(f"Login successful: username={user['username']}, organization={user.get('organization', 'foundation')}")
    # В реальном приложении здесь должен быть JWT токен
    return {
        "access_token": f"mock_token_{user['username']}",
        "token_type": "bearer",
        "organization": user.get("organization", "foundation")
    }

# ========== ШАБЛОНЫ ==========
@app.get("/api/templates", response_model=List[CertificateTemplate])
async def get_templates(current_user: dict = Depends(get_current_user)):
    return templates_db

@app.post("/api/templates/upload", response_model=CertificateTemplate)
async def upload_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    type: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    template_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    file_path = TEMPLATES_DIR / f"{template_id}{file_extension}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    template = {
        "id": template_id,
        "name": name,
        "type": type,
        "file_url": f"/api/templates/{template_id}/file",
        "preview_url": None
    }
    templates_db.append(template)
    
    return template

@app.get("/api/templates/{template_id}/file")
async def get_template_file(template_id: str):
    template = next((t for t in templates_db if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    # Находим файл
    for file_path in TEMPLATES_DIR.glob(f"{template_id}.*"):
        return FileResponse(file_path)
    
    raise HTTPException(status_code=404, detail="Файл шаблона не найден")

@app.put("/api/templates/{template_id}")
async def update_template(
    template_id: str,
    content: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    template = next((t for t in templates_db if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    # Находим файл и обновляем его содержимое
    for file_path in TEMPLATES_DIR.glob(f"{template_id}.*"):
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        break
    
    return template

@app.delete("/api/templates/{template_id}")
async def delete_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    template = next((t for t in templates_db if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    templates_db.remove(template)
    
    # Удаляем файл
    for file_path in TEMPLATES_DIR.glob(f"{template_id}.*"):
        file_path.unlink()
    
    return {"message": "Шаблон удален"}

# ========== МЕРОПРИЯТИЯ ==========
@app.post("/api/events", response_model=Event, status_code=201)
async def create_event(
    event_data: EventCreate,
    current_user: dict = Depends(get_current_user)
):
    """Создать новое мероприятие"""
    try:
        print(f"=== CREATE EVENT REQUEST ===")
        print(f"Event data: {event_data}")
        print(f"Current user: {current_user}")
        
        username = current_user.get("username", "admin")
        user = users_db.get(username, {})
        organization_id = user.get("organization", "foundation")
        print(f"Organization ID: {organization_id}")
        
        event_id = str(uuid.uuid4())
        # Обрабатываем роли: создаем объекты с цветами
        roles = []
        print(f"Event data roles: {event_data.roles}, type: {type(event_data.roles)}")
        if event_data.roles is not None:
            if isinstance(event_data.roles, list) and len(event_data.roles) > 0:
                print(f"Processing {len(event_data.roles)} roles")
                for role_name in event_data.roles:
                    if role_name and str(role_name).strip():  # Пропускаем пустые роли
                        roles.append({
                            "name": str(role_name).strip(),
                            "color": generate_random_color()
                        })
        print(f"Final roles: {roles}")
        
        event = {
            "id": event_id,
            "name": event_data.name,
            "organization_id": organization_id,
            "created_at": datetime.now().isoformat(),
            "description": event_data.description,
            "roles": roles
        }
        events_db.append(event)
        save_events_db(events_db)  # Сохраняем в файл
        print(f"Event created: {event}")
        print(f"Total events: {len(events_db)}")
        return event
    except Exception as e:
        print(f"ERROR in create_event: {e}")
        import traceback
        traceback.print_exc()
        raise

@app.get("/api/events", response_model=List[Event])
async def get_events(current_user: dict = Depends(get_current_user)):
    """Получить все мероприятия текущей организации"""
    # Получаем organization_id из токена (для демо используем organization из users_db)
    username = current_user.get("username", "admin")
    user = users_db.get(username, {})
    organization_id = user.get("organization", "foundation")
    print(f"Getting events for user: {username}, organization: {organization_id}")
    print(f"Total events in DB: {len(events_db)}")
    
    # Фильтруем мероприятия по организации
    organization_events = [e for e in events_db if e.get("organization_id") == organization_id]
    print(f"Filtered events: {len(organization_events)}")
    return organization_events

@app.get("/api/events/{event_id}", response_model=Event)
async def get_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Получить мероприятие по ID"""
    event = next((e for e in events_db if e["id"] == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")
    
    # Проверяем, что мероприятие принадлежит организации пользователя
    username = current_user.get("username", "admin")
    user = users_db.get(username, {})
    organization_id = user.get("organization", "foundation")
    
    if event.get("organization_id") != organization_id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    return event

@app.put("/api/events/{event_id}", response_model=Event)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Обновить мероприятие"""
    try:
        print(f"=== UPDATE EVENT REQUEST ===")
        print(f"Event ID: {event_id}")
        print(f"Event data: {event_data}")
        print(f"Current user: {current_user}")
        
        event = next((e for e in events_db if e["id"] == event_id), None)
        if not event:
            print(f"Event not found: {event_id}")
            raise HTTPException(status_code=404, detail="Мероприятие не найдено")
        
        # Проверяем, что мероприятие принадлежит организации пользователя
        username = current_user.get("username", "admin")
        user = users_db.get(username, {})
        organization_id = user.get("organization", "foundation")
        
        if event.get("organization_id") != organization_id:
            print(f"Access denied: event org {event.get('organization_id')} != user org {organization_id}")
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        if event_data.name is not None:
            event["name"] = event_data.name
        if event_data.description is not None:
            event["description"] = event_data.description
        if event_data.roles is not None:
            # Обновляем роли: сохраняем существующие цвета, добавляем новые с цветами
            print(f"Updating roles: {event_data.roles}, type: {type(event_data.roles)}")
            existing_roles = {r["name"]: r["color"] for r in event.get("roles", [])}
            new_roles = []
            if isinstance(event_data.roles, list):
                for role_name in event_data.roles:
                    if role_name and str(role_name).strip():
                        role_name_clean = str(role_name).strip()
                        # Используем существующий цвет или генерируем новый
                        color = existing_roles.get(role_name_clean, generate_random_color())
                        new_roles.append({
                            "name": role_name_clean,
                            "color": color
                        })
            print(f"New roles: {new_roles}")
            event["roles"] = new_roles
        
        save_events_db(events_db)  # Сохраняем в файл
        print(f"Event updated successfully: {event}")
        return event
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in update_event: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении мероприятия: {str(e)}")

@app.delete("/api/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Удалить мероприятие"""
    event = next((e for e in events_db if e["id"] == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")
    
    # Проверяем, что мероприятие принадлежит организации пользователя
    username = current_user.get("username", "admin")
    user = users_db.get(username, {})
    organization_id = user.get("organization", "foundation")
    
    if event.get("organization_id") != organization_id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    events_db.remove(event)
    save_events_db(events_db)  # Сохраняем в файл
    return {"message": "Мероприятие удалено"}

# ========== УЧАСТНИКИ ==========
@app.post("/api/participants/parse", response_model=List[Participant])
async def parse_participants_file(
    file: UploadFile = File(...),
    event_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Парсит файл участников и фильтрует по ролям мероприятия"""
    # В реальном приложении здесь должен быть парсинг файла
    # Для демо возвращаем пустой список
    
    # Если указан event_id, получаем роли мероприятия для фильтрации
    allowed_roles = None
    if event_id:
        event = next((e for e in events_db if e["id"] == event_id), None)
        if event and event.get("roles"):
            allowed_roles = {r["name"].lower() for r in event["roles"]}
    
    # Здесь будет парсинг файла, но пока возвращаем пустой список
    # В реальной реализации нужно:
    # 1. Распарсить файл (Excel/CSV)
    # 2. Если allowed_roles не None, отфильтровать участников по ролям
    # 3. Вернуть только участников с разрешенными ролями
    
    return []

def replace_email_placeholders(text: str, participant: Participant, event_name: str, issue_date: Optional[str] = None) -> str:
    """Заменяет плейсхолдеры в тексте письма на реальные данные"""
    # Словарь плейсхолдеров (поддерживаем русские и английские варианты)
    placeholders = {
        # ФИО
        '{имя}': participant.fio,
        '{fio}': participant.fio,
        '{Имя}': participant.fio,
        '{ФИО}': participant.fio,
        # Email
        '{email}': participant.email,
        '{Email}': participant.email,
        # Роль
        '{роль}': participant.role,
        '{role}': participant.role,
        '{Роль}': participant.role,
        # Место (если не указано, заменяем на пустую строку)
        '{место}': str(participant.place) if participant.place else '',
        '{place}': str(participant.place) if participant.place else '',
        '{Место}': str(participant.place) if participant.place else '',
        # Название мероприятия
        '{название мероприятия}': event_name,
        '{event_name}': event_name,
        '{название}': event_name,
        '{event}': event_name,
        '{Название мероприятия}': event_name,
        # Дата
        '{дата}': issue_date if issue_date else '',
        '{issue_date}': issue_date if issue_date else '',
        '{Дата}': issue_date if issue_date else '',
        '{date}': issue_date if issue_date else '',
    }
    
    # Заменяем все плейсхолдеры
    result = text
    for placeholder, value in placeholders.items():
        result = result.replace(placeholder, value)
    
    return result

def send_email_with_certificate(
    to_email: str,
    subject: str,
    body: str,
    certificate_path: Optional[Path] = None
) -> bool:
    """
    Отправляет email с сертификатом
    
    Для демо: логирует письмо вместо реальной отправки
    Для продакшена: настройте SMTP параметры
    """
    try:
        # В реальном приложении здесь должна быть настройка SMTP
        # Пример для Gmail:
        # smtp_server = "smtp.gmail.com"
        # smtp_port = 587
        # smtp_user = "your_email@gmail.com"
        # smtp_password = "your_app_password"
        
        # Для демо просто логируем
        logging.info(f"📧 Email отправлен:")
        logging.info(f"   Кому: {to_email}")
        logging.info(f"   Тема: {subject}")
        logging.info(f"   Текст: {body}")
        if certificate_path:
            logging.info(f"   Вложение: {certificate_path.name}")
        
        # Раскомментируйте для реальной отправки:
        # msg = MIMEMultipart()
        # msg['From'] = smtp_user
        # msg['To'] = to_email
        # msg['Subject'] = subject
        # msg.attach(MIMEText(body, 'plain', 'utf-8'))
        # 
        # if certificate_path and certificate_path.exists():
        #     with open(certificate_path, 'rb') as f:
        #         part = MIMEBase('application', 'octet-stream')
        #         part.set_payload(f.read())
        #         encoders.encode_base64(part)
        #         part.add_header('Content-Disposition', f'attachment; filename={certificate_path.name}')
        #         msg.attach(part)
        # 
        # with smtplib.SMTP(smtp_server, smtp_port) as server:
        #     server.starttls()
        #     server.login(smtp_user, smtp_password)
        #     server.send_message(msg)
        
        return True
    except Exception as e:
        logging.error(f"Ошибка при отправке email: {e}")
        return False

def generate_pdf_certificate(participant: Participant, template_content: str, template_type: str, event_name: str, issue_date: str = None):
    """Генерирует PDF сертификат на основе шаблона"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    # Стили
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#5500d8'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    name_style = ParagraphStyle(
        'CustomName',
        parent=styles['Heading2'],
        fontSize=20,
        textColor=colors.black,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.black,
        spaceAfter=15,
        alignment=TA_CENTER
    )
    
    # Заменяем плейсхолдеры в шаблоне
    content = template_content
    
    # Заменяем стандартные плейсхолдеры
    replacements = {
        '{{fio}}': participant.fio,
        '{{email}}': participant.email,
        '{{role}}': participant.role,
        '{{place}}': str(participant.place) if participant.place else '',
        '{{event_name}}': event_name,
        '{{issue_date}}': issue_date if issue_date else datetime.now().strftime('%d.%m.%Y'),
        '{fio}': participant.fio,
        '{email}': participant.email,
        '{role}': participant.role,
        '{place}': str(participant.place) if participant.place else '',
        '{event_name}': event_name,
        '{issue_date}': issue_date if issue_date else datetime.now().strftime('%d.%m.%Y'),
    }
    
    for placeholder, value in replacements.items():
        content = content.replace(placeholder, value)
    
    if template_type == 'svg':
        # Для SVG извлекаем текст и создаем простой сертификат
        # Удаляем SVG теги и оставляем только текст
        text_content = re.sub(r'<[^>]+>', '', content)
        lines = [line.strip() for line in text_content.split('\n') if line.strip()]
        
        # Добавляем заголовок
        story.append(Spacer(1, 60*mm))
        story.append(Paragraph("СЕРТИФИКАТ", title_style))
        story.append(Spacer(1, 20*mm))
        
        # Добавляем имя участника
        story.append(Paragraph(participant.fio, name_style))
        story.append(Spacer(1, 15*mm))
        
        # Добавляем текст сертификата
        cert_text = f"за участие в мероприятии<br/>{event_name}"
        if participant.role != 'участник':
            cert_text += f"<br/>в качестве {participant.role}"
        if participant.place:
            cert_text += f"<br/>и занятие {participant.place} места"
        
        story.append(Paragraph(cert_text, body_style))
        story.append(Spacer(1, 20*mm))
        
        if issue_date:
            story.append(Paragraph(f"Дата выдачи: {issue_date}", body_style))
    else:
        # Для HTML извлекаем текст из HTML
        text_content = re.sub(r'<[^>]+>', '', content)
        lines = [line.strip() for line in text_content.split('\n') if line.strip()]
        
        story.append(Spacer(1, 40*mm))
        for line in lines[:10]:  # Берем первые 10 строк
            if line:
                story.append(Paragraph(line, body_style))
                story.append(Spacer(1, 5*mm))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

# ========== СЕРТИФИКАТЫ ==========
@app.post("/api/certificates/generate")
async def generate_certificates(
    request: CertificateGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    # Проверяем наличие шаблона
    template = next((t for t in templates_db if t["id"] == request.template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    # Загружаем содержимое шаблона
    template_file_path = None
    for file_path in TEMPLATES_DIR.glob(f"{request.template_id}.*"):
        template_file_path = file_path
        break
    
    if not template_file_path or not template_file_path.exists():
        raise HTTPException(status_code=404, detail="Файл шаблона не найден")
    
    template_content = template_file_path.read_text(encoding='utf-8')
    
    # Генерируем сертификаты
    certificate_ids = []
    zip_path = CERTIFICATES_DIR / f"certificates_{uuid.uuid4()}.zip"
    
    emails_sent = 0
    with zipfile.ZipFile(zip_path, 'w') as zip_file:
        for participant in request.participants:
            cert_id = str(uuid.uuid4())
            certificate_ids.append(cert_id)
            
            # Генерируем PDF
            pdf_buffer = generate_pdf_certificate(
                participant,
                template_content,
                template["type"],
                request.event_name,
                request.issue_date
            )
            
            # Сохраняем PDF файл
            cert_file = CERTIFICATES_DIR / f"{cert_id}.pdf"
            with open(cert_file, 'wb') as f:
                f.write(pdf_buffer.getvalue())
            
            # Добавляем в ZIP
            zip_file.write(cert_file, f"{participant.fio}_certificate.pdf")
            
            # Отправляем email, если включено
            if request.send_email and request.email_subject and request.email_body:
                # Заменяем плейсхолдеры в теме и тексте письма
                email_subject = replace_email_placeholders(
                    request.email_subject,
                    participant,
                    request.event_name,
                    request.issue_date
                )
                email_body = replace_email_placeholders(
                    request.email_body,
                    participant,
                    request.event_name,
                    request.issue_date
                )
                
                # Отправляем письмо
                if send_email_with_certificate(
                    to_email=participant.email,
                    subject=email_subject,
                    body=email_body,
                    certificate_path=cert_file
                ):
                    emails_sent += 1
    
    response_data = {
        "certificate_ids": certificate_ids,
        "zip_url": f"/api/certificates/download/{zip_path.name}",
        "message": f"Сгенерировано {len(certificate_ids)} сертификатов"
    }
    
    if request.send_email:
        response_data["message"] += f" и отправлено {emails_sent} писем по email"
    
    return response_data

@app.get("/api/certificates/download/{filename}")
async def download_certificates_zip(filename: str):
    zip_path = CERTIFICATES_DIR / filename
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(zip_path, media_type="application/zip", filename=filename)

@app.get("/api/certificates/{certificate_id}/download")
async def download_certificate(certificate_id: str):
    cert_file = CERTIFICATES_DIR / f"{certificate_id}.pdf"
    if not cert_file.exists():
        raise HTTPException(status_code=404, detail="Сертификат не найден")
    return FileResponse(cert_file, media_type="application/pdf")

# Инициализация базовых шаблонов при старте
@app.on_event("startup")
async def startup_event():
    initialize_base_templates()

if __name__ == "__main__":
    print("🚀 Запуск сервера API...")
    print("📝 Учетные данные для входа:")
    print("   Логин: admin / Пароль: admin123")
    print("   Логин: user / Пароль: user123")
    print("🌐 API доступен по адресу: http://localhost:8000")
    print("📚 Документация: http://localhost:8000/docs")
    # Инициализируем шаблоны перед запуском
    initialize_base_templates()
    uvicorn.run(app, host="0.0.0.0", port=8000)

