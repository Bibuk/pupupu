from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Q, Count
from django.http import JsonResponse
from .models import Game, Category, Cart, CartItem, Order, OrderItem
from .context_processors import get_or_create_cart
import uuid
from datetime import datetime

def index(request):
    featured_games = Game.objects.filter(is_featured=True, in_stock=True)[:8]
    new_games = Game.objects.filter(is_new=True, in_stock=True)[:8]
    categories = Category.objects.all()[:6]

    context = {
        'featured_games': featured_games,
        'new_games': new_games,
        'categories': categories,
    }
    return render(request, 'shop/index.html', context)

def catalog(request, category_slug=None):
    games = Game.objects.filter(in_stock=True)
    categories = Category.objects.all()
    selected_category = None

    if category_slug:
        selected_category = get_object_or_404(Category, slug=category_slug)
        games = games.filter(category=selected_category)

    platform = request.GET.get('platform')
    if platform:
        games = games.filter(platform=platform)

    sort = request.GET.get('sort', '-created_at')
    if sort in ['price', '-price', '-created_at', 'title', '-rating']:
        games = games.order_by(sort)

    context = {
        'games': games,
        'categories': categories,
        'selected_category': selected_category,
        'platforms': Game.PLATFORM_CHOICES,
    }
    return render(request, 'shop/catalog.html', context)

def game_detail(request, slug):
    game = get_object_or_404(Game, slug=slug)
    game.views += 1
    game.save(update_fields=['views'])

    related_games = Game.objects.filter(
        category=game.category,
        in_stock=True
    ).exclude(id=game.id)[:4]

    context = {
        'game': game,
        'related_games': related_games,
    }
    return render(request, 'shop/game_detail.html', context)

def cart_view(request):
    cart = get_or_create_cart(request)
    context = {
        'cart': cart,
    }
    return render(request, 'shop/cart.html', context)

def add_to_cart(request, game_id):
    game = get_object_or_404(Game, id=game_id)
    cart = get_or_create_cart(request)

    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        game=game,
        defaults={'quantity': 1}
    )

    if not created:
        cart_item.quantity += 1
        cart_item.save()

    messages.success(request, f'{game.title} добавлена в корзину!')

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'cart_items_count': cart.total_items,
            'message': f'{game.title} добавлена в корзину!'
        })

    return redirect('shop:cart')

def remove_from_cart(request, item_id):
    cart = get_or_create_cart(request)
    cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
    game_title = cart_item.game.title
    cart_item.delete()

    messages.success(request, f'{game_title} удалена из корзины!')
    return redirect('shop:cart')

def update_cart_item(request, item_id):
    if request.method == 'POST':
        cart = get_or_create_cart(request)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        quantity = int(request.POST.get('quantity', 1))

        if quantity > 0:
            cart_item.quantity = quantity
            cart_item.save()
        else:
            cart_item.delete()

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'cart_total': float(cart.total_price),
                'item_total': float(cart_item.total_price) if quantity > 0 else 0
            })

    return redirect('shop:cart')

@login_required
def checkout(request):
    cart = get_or_create_cart(request)

    if not cart.items.exists():
        messages.warning(request, 'Ваша корзина пуста!')
        return redirect('shop:catalog')

    if request.method == 'POST':
        order = Order.objects.create(
            user=request.user,
            order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
            first_name=request.POST.get('first_name'),
            last_name=request.POST.get('last_name'),
            email=request.POST.get('email'),
            phone=request.POST.get('phone'),
            total_price=cart.total_cost,
            status='PENDING'
        )

        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                game=cart_item.game,
                price=cart_item.game.final_price,
                quantity=cart_item.quantity
            )

        cart.items.all().delete()

        messages.success(request, f'Заказ #{order.order_number} успешно создан!')
        return redirect('shop:order_detail', order_number=order.order_number)

    context = {
        'cart': cart,
    }
    return render(request, 'shop/checkout.html', context)

@login_required
def order_detail(request, order_number):
    order = get_object_or_404(Order, order_number=order_number, user=request.user)
    context = {
        'order': order,
    }
    return render(request, 'shop/order_detail.html', context)

@login_required
def payment_page(request, order_number):
    order = get_object_or_404(Order, order_number=order_number, user=request.user)
    
    if order.status != 'PENDING':
        messages.info(request, 'Этот заказ уже обработан!')
        return redirect('shop:order_detail', order_number=order.order_number)
    
    context = {
        'order': order,
    }
    return render(request, 'shop/payment.html', context)

@login_required
def process_payment(request, order_number):
    if request.method == 'POST':
        order = get_object_or_404(Order, order_number=order_number, user=request.user)
        
        if order.status == 'PENDING':
            card_number = request.POST.get('card_number', '').replace(' ', '')
            card_name = request.POST.get('card_name')
            
            if len(card_number) == 16 and card_name:
                order.status = 'PAID'
                order.paid_at = datetime.now()
                order.save()
                
                messages.success(request, f'Оплата успешно проведена! Заказ #{order.order_number} оплачен.')
                return redirect('shop:order_detail', order_number=order.order_number)
            else:
                messages.error(request, 'Ошибка обработки платежа. Проверьте данные карты.')
                return redirect('shop:payment_page', order_number=order.order_number)
        else:
            messages.info(request, 'Этот заказ уже оплачен!')
            return redirect('shop:order_detail', order_number=order.order_number)
    
    return redirect('shop:index')

def search(request):
    query = request.GET.get('q', '')
    games = Game.objects.none()

    if query:
        games = Game.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(developer__icontains=query) |
            Q(publisher__icontains=query),
            in_stock=True
        )

    context = {
        'games': games,
        'query': query,
    }
    return render(request, 'shop/search.html', context)

def register_view(request):
    if request.user.is_authenticated:
        return redirect('shop:index')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        
        if password1 != password2:
            messages.error(request, 'Пароли не совпадают!')
            return redirect('shop:register')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Пользователь с таким именем уже существует!')
            return redirect('shop:register')
        
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Пользователь с таким email уже существует!')
            return redirect('shop:register')
        
        user = User.objects.create_user(username=username, email=email, password=password1)
        user.save()
        
        login(request, user)
        messages.success(request, f'Добро пожаловать, {username}!')
        return redirect('shop:index')
    
    return render(request, 'shop/register.html')

def login_view(request):
    if request.user.is_authenticated:
        return redirect('shop:index')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, f'Добро пожаловать, {username}!')
            next_url = request.GET.get('next', 'shop:index')
            return redirect(next_url)
        else:
            messages.error(request, 'Неверное имя пользователя или пароль!')
            return redirect('shop:login')
    
    return render(request, 'shop/login.html')

def logout_view(request):
    logout(request)
    messages.success(request, 'Вы успешно вышли из системы!')
    return redirect('shop:index')

def profile_view(request):
    if not request.user.is_authenticated:
        return redirect('shop:login')
    
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    
    total_games = 0
    for order in orders:
        total_games += order.items.count()
    
    context = {
        'orders': orders,
        'total_spent': total_games,
    }
    return render(request, 'shop/profile.html', context)

@login_required
def edit_profile_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        current_password = request.POST.get('current_password', '')
        new_password = request.POST.get('new_password', '')
        confirm_password = request.POST.get('confirm_password', '')
        
        user = request.user
        
        if username != user.username:
            if User.objects.filter(username=username).exists():
                messages.error(request, 'Пользователь с таким именем уже существует!')
                return redirect('shop:edit_profile')
            user.username = username
        
        if email != user.email:
            if User.objects.filter(email=email).exists():
                messages.error(request, 'Пользователь с таким email уже существует!')
                return redirect('shop:edit_profile')
            user.email = email
        
        user.first_name = first_name
        user.last_name = last_name
        
        if new_password:
            if not current_password:
                messages.error(request, 'Введите текущий пароль для смены!')
                return redirect('shop:edit_profile')
            
            if not user.check_password(current_password):
                messages.error(request, 'Неверный текущий пароль!')
                return redirect('shop:edit_profile')
            
            if new_password != confirm_password:
                messages.error(request, 'Новые пароли не совпадают!')
                return redirect('shop:edit_profile')
            
            if len(new_password) < 6:
                messages.error(request, 'Пароль должен содержать минимум 6 символов!')
                return redirect('shop:edit_profile')
            
            user.set_password(new_password)
            messages.success(request, 'Пароль успешно изменен! Войдите снова с новым паролем.')
            user.save()
            logout(request)
            return redirect('shop:login')
        
        user.save()
        messages.success(request, 'Профиль успешно обновлен!')
        return redirect('shop:profile')
    
    return render(request, 'shop/edit_profile.html')

def check_username(request):
    """API endpoint для проверки существования username"""
    username = request.GET.get('username', '')
    exists = User.objects.filter(username=username).exists()
    return JsonResponse({'exists': exists})

def check_email(request):
    """API endpoint для проверки существования email"""
    email = request.GET.get('email', '')
    exists = User.objects.filter(email=email).exists()
    return JsonResponse({'exists': exists})
