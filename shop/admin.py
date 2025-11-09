from django.contrib import admin
from .models import Category, Game, Cart, CartItem, Order, OrderItem, Review

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['game', 'price', 'quantity', 'total_price']

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'platform', 'price', 'discount_percentage', 'in_stock', 'is_featured', 'created_at']
    list_filter = ['category', 'platform', 'in_stock', 'is_featured', 'is_new']
    prepopulated_fields = {'slug': ('title',)}
    search_fields = ['title', 'developer', 'publisher']
    list_editable = ['price', 'in_stock', 'is_featured']
    readonly_fields = ['views', 'created_at', 'updated_at']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'total_price', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order_number', 'email', 'first_name', 'last_name']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline]

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_key', 'total_items', 'total_price', 'created_at']
    readonly_fields = ['created_at', 'updated_at']

    def total_price(self, obj):
        return obj.total_cost
    total_price.short_description = 'Общая стоимость'

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'game', 'quantity', 'total_price', 'added_at']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['game', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['game__title', 'user__username', 'comment']
