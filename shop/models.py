from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Category(models.Model):
    name = models.CharField(max_length=200, verbose_name='Название')
    slug = models.SlugField(max_length=200, unique=True, verbose_name='Slug')
    description = models.TextField(blank=True, verbose_name='Описание')
    icon = models.ImageField(upload_to='categories/', blank=True, null=True, verbose_name='Иконка')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name

class Game(models.Model):
    PLATFORM_CHOICES = [
        ('PC', 'PC'),
        ('PS5', 'PlayStation 5'),
        ('PS4', 'PlayStation 4'),
        ('XBOX_SERIES', 'Xbox Series X/S'),
        ('XBOX_ONE', 'Xbox One'),
        ('SWITCH', 'Nintendo Switch'),
        ('MULTI', 'Мультиплатформа'),
    ]

    title = models.CharField(max_length=300, verbose_name='Название')
    slug = models.SlugField(max_length=300, unique=True, verbose_name='Slug')
    description = models.TextField(verbose_name='Описание')
    short_description = models.CharField(max_length=500, blank=True, verbose_name='Краткое описание')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='games', verbose_name='Категория')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, verbose_name='Платформа')

    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    old_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='Старая цена')
    discount_percentage = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name='Процент скидки')

    cover_image = models.ImageField(upload_to='games/covers/', verbose_name='Обложка')
    screenshot_1 = models.ImageField(upload_to='games/screenshots/', blank=True, null=True, verbose_name='Скриншот 1')
    screenshot_2 = models.ImageField(upload_to='games/screenshots/', blank=True, null=True, verbose_name='Скриншот 2')
    screenshot_3 = models.ImageField(upload_to='games/screenshots/', blank=True, null=True, verbose_name='Скриншот 3')

    developer = models.CharField(max_length=200, verbose_name='Разработчик')
    publisher = models.CharField(max_length=200, verbose_name='Издатель')
    release_date = models.DateField(verbose_name='Дата выхода')
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0, validators=[MinValueValidator(0), MaxValueValidator(10)], verbose_name='Рейтинг')

    in_stock = models.BooleanField(default=True, verbose_name='В наличии')
    is_featured = models.BooleanField(default=False, verbose_name='Рекомендуемое')
    is_new = models.BooleanField(default=False, verbose_name='Новинка')

    views = models.IntegerField(default=0, verbose_name='Просмотры')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Игра'
        verbose_name_plural = 'Игры'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def final_price(self):
        if self.discount_percentage > 0:
            from decimal import Decimal
            discount = Decimal(str(self.discount_percentage)) / Decimal('100')
            return self.price * (Decimal('1') - discount)
        return self.price

class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, verbose_name='Пользователь')
    session_key = models.CharField(max_length=40, null=True, blank=True, verbose_name='Ключ сессии')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'

    def __str__(self):
        return f"Корзина {self.id}"

    @property
    def total_cost(self):
        return sum(item.total_price for item in self.items.all())

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', verbose_name='Корзина')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, verbose_name='Игра')
    quantity = models.PositiveIntegerField(default=1, verbose_name='Количество')
    added_at = models.DateTimeField(auto_now_add=True, verbose_name='Добавлено')

    class Meta:
        verbose_name = 'Элемент корзины'
        verbose_name_plural = 'Элементы корзины'
        unique_together = ['cart', 'game']

    def __str__(self):
        return f"{self.game.title} x {self.quantity}"

    @property
    def total_price(self):
        return self.game.final_price * self.quantity

class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Ожидает оплаты'),
        ('PAID', 'Оплачен'),
        ('PROCESSING', 'В обработке'),
        ('COMPLETED', 'Завершен'),
        ('CANCELLED', 'Отменен'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name='Пользователь')
    order_number = models.CharField(max_length=50, unique=True, verbose_name='Номер заказа')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name='Статус')

    first_name = models.CharField(max_length=100, verbose_name='Имя')
    last_name = models.CharField(max_length=100, verbose_name='Фамилия')
    email = models.EmailField(verbose_name='Email')
    phone = models.CharField(max_length=20, verbose_name='Телефон')

    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Общая стоимость')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлен')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='Оплачен')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def __str__(self):
        return f"Заказ #{self.order_number}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name='Заказ')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, verbose_name='Игра')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    quantity = models.PositiveIntegerField(default=1, verbose_name='Количество')

    class Meta:
        verbose_name = 'Элемент заказа'
        verbose_name_plural = 'Элементы заказа'

    def __str__(self):
        return f"{self.game.title} x {self.quantity}"

    @property
    def total_price(self):
        return self.price * self.quantity

class Review(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='reviews', verbose_name='Игра')
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Пользователь')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], verbose_name='Оценка')
    comment = models.TextField(verbose_name='Комментарий')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлен')

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        ordering = ['-created_at']
        unique_together = ['game', 'user']

    def __str__(self):
        return f"Отзыв от {self.user.username} на {self.game.title}"
