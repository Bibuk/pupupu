from django.apps import AppConfig

class ShopConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'shop'
    verbose_name = 'Магазин'

    def ready(self):
        from django.contrib import admin
        admin.site.site_header = "Xide - Панель управления"
        admin.site.site_title = "Xide Admin"
        admin.site.index_title = "Добро пожаловать в Xide"
