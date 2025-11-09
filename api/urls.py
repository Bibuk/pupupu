from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, GameViewSet, CartViewSet, OrderViewSet, ReviewViewSet
from .views_auth import login_view, register_view, logout_view, current_user_view, user_library_view

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'games', GameViewSet, basename='game')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('rest_framework.urls')),
    path('login/', login_view, name='api_login'),
    path('register/', register_view, name='api_register'),
    path('logout/', logout_view, name='api_logout'),
    path('user/current/', current_user_view, name='current_user'),
    path('user/library/', user_library_view, name='user_library'),
]
