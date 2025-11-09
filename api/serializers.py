from rest_framework import serializers
from shop.models import Game, Category, Cart, CartItem, Order, OrderItem, Review
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
    games_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'games_count', 'created_at']

    def get_games_count(self, obj):
        return obj.games.filter(in_stock=True).count()

class GameListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            'id', 'title', 'slug', 'short_description', 'category', 'category_name',
            'platform', 'price', 'old_price', 'discount_percentage', 'final_price',
            'cover_image', 'developer', 'publisher', 'rating', 'in_stock',
            'is_featured', 'is_new', 'release_date'
        ]
    
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None

class GameDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cover_image = serializers.SerializerMethodField()
    screenshot_1 = serializers.SerializerMethodField()
    screenshot_2 = serializers.SerializerMethodField()
    screenshot_3 = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            'id', 'title', 'slug', 'description', 'short_description',
            'category', 'category_name', 'platform', 'price', 'old_price',
            'discount_percentage', 'final_price', 'cover_image',
            'screenshot_1', 'screenshot_2', 'screenshot_3',
            'developer', 'publisher', 'release_date', 'rating',
            'in_stock', 'is_featured', 'is_new', 'views',
            'created_at', 'updated_at'
        ]
    
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None
    
    def get_screenshot_1(self, obj):
        if obj.screenshot_1:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.screenshot_1.url)
            return obj.screenshot_1.url
        return None
    
    def get_screenshot_2(self, obj):
        if obj.screenshot_2:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.screenshot_2.url)
            return obj.screenshot_2.url
        return None
    
    def get_screenshot_3(self, obj):
        if obj.screenshot_3:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.screenshot_3.url)
            return obj.screenshot_3.url
        return None

class CartItemSerializer(serializers.ModelSerializer):
    game = GameListSerializer(read_only=True)
    game_id = serializers.IntegerField(write_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'game', 'game_id', 'quantity', 'total_price', 'added_at']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    total_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'total_items', 'created_at', 'updated_at']
    
    def get_total_price(self, obj):
        return obj.total_cost

class OrderItemSerializer(serializers.ModelSerializer):
    game = GameListSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'game', 'price', 'quantity', 'total_price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'first_name', 'last_name',
            'email', 'phone', 'total_price', 'items',
            'created_at', 'updated_at', 'paid_at'
        ]
        read_only_fields = ['order_number', 'created_at', 'updated_at']

class ReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'game', 'user', 'user_username', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']
