@echo off
chcp 65001 >nul
REM تشغيل لوحة التوقيت في Chrome بملء الشاشة مع السماح بتشغيل الجرس تلقائيًا
REM أغلق جميع نوافذ Chrome قبل التشغيل حتى تُطبَّق الخيارات
start "" chrome --kiosk --autoplay-policy=no-user-gesture-required "%~dp0index.html"
