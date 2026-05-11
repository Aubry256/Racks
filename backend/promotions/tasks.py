"""promotions/tasks.py — Celery Beat scheduled tasks"""
from celery import shared_task
from django.utils import timezone
from django.core.cache import cache

@shared_task
def check_and_activate_promotions():
    from .views import Promotion, _apply_promo_prices
    for promo in Promotion.objects.filter(status='scheduled', starts_at__lte=timezone.now()):
        promo.status = 'live'; promo.save()
        _apply_promo_prices(promo); cache.delete('promotions:active')

@shared_task
def check_and_end_promotions():
    from .views import Promotion, _clear_promo_prices, _get_qualifying_products
    for promo in Promotion.objects.filter(status='live', ends_at__isnull=False, ends_at__lte=timezone.now()):
        promo.status = 'ended'; promo.save(); _clear_promo_prices(promo)
    for promo in Promotion.objects.filter(status='live', auto_end_on_stockout=True):
        if not _get_qualifying_products(promo).filter(stock_qty__gt=0).exists():
            promo.status = 'ended'; promo.save(); _clear_promo_prices(promo)
