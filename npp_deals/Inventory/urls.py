from django.urls import path
from .views import (
    ProductListCreateView,
    ProductDetailUpdateView,
    send_product_email,
    send_group_email,
)

urlpatterns = [
    # Example "normal" routes for products:
    path("products/", ProductListCreateView.as_view(), name="product_list"),
    path("products/<int:pk>/", ProductDetailUpdateView.as_view(), name="product_detail"),

    # ✅ Our new single-step route to send email + set last_sent
    path("products/<int:pk>/send-email/", send_product_email, name="send_product_email"),

    # ✅ Optional: A route to send group email for multiple IDs
    path("products/send-group-email/", send_group_email, name="send_group_email"),
]
