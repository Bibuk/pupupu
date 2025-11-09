@echo off
chcp 65001 > nul
title XIDE Game Store - Запуск сервиса

echo ╔═══════════════════════════════════════════╗
echo ║   XIDE GAME STORE - АВТОЗАПУСК           ║
echo ╚═══════════════════════════════════════════╝
echo.
echo [1/3] Активация виртуального окружения Python...

:: Проверка существования venv
if not exist "venv\Scripts\activate.bat" (
    echo [ОШИБКА] Виртуальное окружение не найдено!
    echo Создайте его командой: python -m venv venv
    pause
    exit /b 1
)

:: Активация venv
call venv\Scripts\activate.bat

echo [✓] Виртуальное окружение активировано
echo.
echo [2/3] Запуск Django сервера...
echo       └─ API будет доступно на http://127.0.0.1:8000
echo.

:: Запуск Django в новом окне терминала
start "Django API Server" cmd /k "cd /d %~dp0 && venv\Scripts\activate.bat && python manage.py runserver"

:: Ожидание запуска Django (10 секунд)
timeout /t 10 /nobreak > nul

echo [✓] Django сервер запущен
echo.
echo [3/3] Запуск Electron приложения...
echo       └─ Ожидайте открытия окна приложения...
echo.

:: Переход в директорию Electron приложения и запуск
cd desktop-electron-app

:: Проверка установки node_modules
if not exist "node_modules" (
    echo [!] Зависимости не установлены. Устанавливаю npm пакеты...
    call npm install
    if errorlevel 1 (
        echo [ОШИБКА] Не удалось установить зависимости!
        echo Выполните вручную: cd desktop-electron-app ^&^& npm install
        pause
        exit /b 1
    )
    echo [✓] Зависимости установлены
    echo.
)

:: Запуск Electron приложения
call npm start

:: После закрытия приложения
cd ..
echo.
echo ╔═══════════════════════════════════════════╗
echo ║   Приложение закрыто                      ║
echo ╚═══════════════════════════════════════════╝
echo.
echo [!] Django сервер продолжает работать в фоновом режиме
echo     Для остановки закройте окно "Django API Server"
echo.
pause
