from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import JsonResponse
from rest_framework.decorators import api_view
from .models import Product
import requests
import json

@api_view(["POST"])
def send_product_email(request, pk):
    """
    Single endpoint that:
      - Finds product by ID
      - Sends email to Kit
      - Updates last_sent in DB
      - Returns JSON
    """
    product = get_object_or_404(Product, pk=pk)

    # Build simple email data
    email_data = {
        "subject": product.title,
        "content": f"<h1>{product.title}</h1> ... your HTML ...",
        "public": False,
        "email_template_id": None
    }

    # Send request to Kit
    KIT_API_URL = "https://api.kit.com/v4/broadcasts"
    HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Kit-Api-Key": "kit_a0a183e8fd744ca557d96126e488ae22"
    }

    r = requests.post(KIT_API_URL, data=json.dumps(email_data), headers=HEADERS)

    if r.status_code == 201:
        # Mark product as sent
        product.last_sent = timezone.now()
        product.save()
        return JsonResponse({
            "success": True,
            "product_id": pk,
            "last_sent": product.last_sent.isoformat()
        })
    else:
        return JsonResponse({
            "success": False,
            "error": r.text
        }, status=400)


@api_view(["POST"])
def send_group_email(request):
    """
    Example multi-product approach:
      - request.data = { "product_ids": [1, 2, 3] }
      - Combine HTML, send 1 broadcast
      - Update last_sent for each
    """
    product_ids = request.data.get("product_ids", [])
    products = Product.objects.filter(pk__in=product_ids)

    # Build combined email
    combined_content = ""
    for p in products:
        combined_content += f"<h2>{p.title}</h2>..."

    email_data = {
        "subject": f"Group Deal: {len(products)} Products",
        "content": combined_content,
        "public": False,
        "email_template_id": None
    }

    KIT_API_URL = "https://api.kit.com/v4/broadcasts"
    HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Kit-Api-Key": "kit_a0a183e8fd744ca557d96126e488ae22"
    }

    r = requests.post(KIT_API_URL, data=json.dumps(email_data), headers=HEADERS)

    if r.status_code == 201:
        # Mark all as sent
        now = timezone.now()
        for p in products:
            p.last_sent = now
            p.save()
        return JsonResponse({"success": True, "count": len(products)})
    else:
        return JsonResponse({"success": False, "error": r.text}, status=400)
