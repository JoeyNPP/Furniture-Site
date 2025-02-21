from django.db import models
from django.utils.timezone import now

class Vendor(models.Model):
    name = models.CharField(max_length=200)
    contact_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    moq = models.PositiveIntegerField(default=0, help_text="Minimum order quantity")
    qty = models.PositiveIntegerField(default=0, help_text="Quantity available")
    lead_time = models.PositiveIntegerField(default=0, help_text="Lead time in days")
    exp_date = models.DateField(null=True, blank=True)
    vendor_product_id = models.CharField(max_length=100, blank=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="products")
    upc = models.CharField(max_length=50, blank=True)
    url = models.URLField(max_length=1000, blank=True)
    walmart_url = models.URLField(max_length=1000, blank=True)
    ebay_url = models.URLField(max_length=1000, blank=True)
    image_url = models.URLField(max_length=1000, blank=True)
    is_out_of_stock = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now_add=True)

    offer_date = models.DateTimeField(
        blank=True,
        null=True,
        default=now,  # auto-set if blank
        help_text="When the product was first or newly offered. User can edit if re-offered."
    )
    last_sent = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp of the most recent email sent for this product."
    )

    def __str__(self):
        return self.title


class EmailLog(models.Model):
    subject = models.CharField(max_length=255)
    recipient = models.EmailField()
    message = models.TextField()
    status = models.CharField(max_length=50, choices=[("Sent", "Sent"), ("Failed", "Failed")])
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} to {self.recipient}"
