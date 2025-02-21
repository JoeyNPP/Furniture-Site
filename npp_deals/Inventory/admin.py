from django.contrib import admin
from .models import Product, Vendor

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'price', 'qty', 'is_out_of_stock')

@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_email', 'phone', 'date_added')
