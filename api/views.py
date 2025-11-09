from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from shop.models import Game, Category, Cart, CartItem, Order, OrderItem, Review
from .serializers import (
    GameListSerializer, GameDetailSerializer, CategorySerializer,
    CartSerializer, CartItemSerializer, OrderSerializer, ReviewSerializer
)
import uuid

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

class GameViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Game.objects.filter(in_stock=True)
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'developer', 'publisher']
    ordering_fields = ['price', 'rating', 'created_at', 'title']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GameDetailSerializer
        return GameListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        platform = self.request.query_params.get('platform')
        if platform:
            queryset = queryset.filter(platform=platform)

        is_featured = self.request.query_params.get('featured')
        if is_featured == 'true':
            queryset = queryset.filter(is_featured=True)

        is_new = self.request.query_params.get('new')
        if is_new == 'true':
            queryset = queryset.filter(is_new=True)

        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        game = self.get_object()
        related_games = Game.objects.filter(
            category=game.category,
            in_stock=True
        ).exclude(id=game.id)[:4]
        serializer = GameListSerializer(related_games, many=True)
        return Response(serializer.data)

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Cart.objects.filter(user=self.request.user)
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.create()
            session_key = self.request.session.session_key
        return Cart.objects.filter(session_key=session_key)

    def get_or_create_cart(self):
        if self.request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(user=self.request.user)
        else:
            session_key = self.request.session.session_key
            if not session_key:
                self.request.session.create()
                session_key = self.request.session.session_key
            cart, created = Cart.objects.get_or_create(session_key=session_key)
        return cart

    @action(detail=False, methods=['get'])
    def current(self, request):
        cart = self.get_or_create_cart()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        game_id = request.data.get('game_id')
        quantity = int(request.data.get('quantity', 1))

        game = get_object_or_404(Game, id=game_id, in_stock=True)
        cart = self.get_or_create_cart()

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            game=game,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def update_item(self, request):
        item_id = request.data.get('item_id')
        quantity = int(request.data.get('quantity', 1))

        cart = self.get_or_create_cart()
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        if quantity > 0:
            cart_item.quantity = quantity
            cart_item.save()
        else:
            cart_item.delete()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        item_id = request.data.get('item_id')
        cart = self.get_or_create_cart()
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        cart = self.get_or_create_cart()
        cart.items.all().delete()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def create(self, request):
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
            return Response(
                {'error': 'Для оформления заказа необходимо войти в систему'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not cart.items.exists():
            return Response(
                {'error': 'Корзина пуста'},
                status=status.HTTP_400_BAD_REQUEST
            )


        order = Order.objects.create(
            user=request.user,
            order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
            first_name=request.data.get('first_name', request.user.first_name or ''),
            last_name=request.data.get('last_name', request.user.last_name or ''),
            email=request.data.get('email', request.user.email or ''),
            phone=request.data.get('phone', ''),
            total_price=cart.total_cost,
            status='COMPLETED'
        )


        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                game=cart_item.game,
                price=cart_item.game.final_price,
                quantity=cart_item.quantity
            )


        cart.items.all().delete()

        serializer = self.get_serializer(order)
        return Response({
            'order': serializer.data,
            'message': 'Заказ успешно оплачен! Игры добавлены в библиотеку.'
        }, status=status.HTTP_201_CREATED)

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        game_id = self.request.query_params.get('game_id')
        if game_id:
            return Review.objects.filter(game_id=game_id)
        return Review.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)



@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Необходимо указать username и password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'success': True,
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })
    else:
        return Response(
            {'error': 'Неверное имя пользователя или пароль'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not username or not email or not password:
        return Response(
            {'error': 'Необходимо указать username, email и password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Пользователь с таким именем уже существует'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Пользователь с таким email уже существует'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    login(request, user)
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'success': True,
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    if request.user.is_authenticated:
        try:
            request.user.auth_token.delete()
        except:
            pass
    logout(request)
    return Response({'success': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    user = request.user

    orders = Order.objects.filter(user=user)
    completed_orders = orders.filter(status='COMPLETED')
    total_spent = sum(order.total_price for order in completed_orders)
    games_owned = sum(order.items.count() for order in completed_orders)
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'stats': {
            'games_owned': games_owned,
            'total_orders': orders.count(),
            'total_spent': float(total_spent),
            'achievements': 0,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_library_view(request):
    orders = Order.objects.filter(user=request.user, status='COMPLETED')
    games = []
    game_ids = set()
    
    for order in orders:
        for item in order.items.all():
            if item.game.id not in game_ids:
                games.append(item.game)
                game_ids.add(item.game.id)

    serializer = GameListSerializer(games, many=True, context={'request': request})
    return Response(serializer.data)
