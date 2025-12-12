import axios from "axios";
import { updateProduct } from "./api"; // Ensure this points to the correct API function

const API_URL = "https://api.kit.com/v4/broadcasts";
const API_KEY = "kit_a0a183e8fd744ca557d96126e488ae22";

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-Kit-Api-Key": API_KEY,
};

/**
 * Send Individual Emails & Update Last Sent
 */
export async function sendIndividualEmails(selectedProducts) {
  if (!selectedProducts || selectedProducts.length === 0) {
    console.error("No products selected for individual email.");
    return;
  }

  for (const product of selectedProducts) {
    if (!product || !product.title) {
      console.error("Skipping invalid product:", product);
      continue;
    }

    // Standardize lead time and price formatting as needed
    let leadTime = product.lead_time || "";
    if (leadTime.includes("Days")) {
      leadTime = leadTime.replace("Days", "Business Days");
    }
    let price = product.price || "0";
    try {
      price = parseFloat(price).toFixed(2);
    } catch {
      // Leave as is
    }

    // Build the email body
    const emailBody = buildFurnitureEmail({
      subject: product.title || "",
      imageUrl: product.image_url || "",
      price,
      moq: product.moq || "0",
      qty: product.qty || "0",
      sku: product.sku || "",
      fob: product.fob || "",
      leadTime,
      brand: product.brand || "",
      material: product.material || "",
      color: product.color || "",
      dimensions: formatDimensions(product),
      condition: product.condition || "",
    });

    const emailData = {
      subject: (product.title || "").trim(),
      content: emailBody,
      public: false, // Draft mode
      email_template_id: null,
    };

    try {
      const response = await axios.post(API_URL, emailData, { headers });
      if (response.status === 201) {
        console.log(`✅ Email draft successfully created for: ${product.title}`);
      
        if (product.id) {
          try {
            console.log(`⏳ Updating last_sent for Product ID: ${product.id}`);
            await updateLastSent(product.id);
            console.log(`✅ last_sent successfully updated for: ${product.id}`);
          } catch (err) {
            console.error(`❌ Failed to update last_sent for ${product.id}:`, err);
          }
        } else {
          console.error(`❌ Invalid product ID for last_sent update:`, product);
        }
      } else {
        console.error(`❌ Failed to send email for ${product.title}:`, response.data);
      }
    } catch (error) {
      console.error(`Error sending email for ${product.title}:`, error);
    }
  }
}

/**
 * Send Group Email & Update Last Sent for All Products
 */
export async function sendGroupEmail(selectedProducts) {
  if (!selectedProducts || selectedProducts.length === 0) {
    console.error("No products selected for group email.");
    return;
  }

  let combinedHTML = "";
  for (const product of selectedProducts) {
    if (!product || !product.title) {
      console.error("Skipping invalid product in group:", product);
      continue;
    }

    let leadTime = product.lead_time || "";
    if (leadTime.includes("Days")) {
      leadTime = leadTime.replace("Days", "Business Days");
    }
    let price = product.price || "0";
    try {
      price = parseFloat(price).toFixed(2);
    } catch {
      // Leave as is
    }

    combinedHTML += buildFurnitureEmail({
      subject: product.title || "",
      imageUrl: product.image_url || "",
      price,
      moq: product.moq || "0",
      qty: product.qty || "0",
      sku: product.sku || "",
      fob: product.fob || "",
      leadTime,
      brand: product.brand || "",
      material: product.material || "",
      color: product.color || "",
      dimensions: formatDimensions(product),
      condition: product.condition || "",
    });

    combinedHTML += "<hr>";
  }

  const emailData = {
    subject: `Group Deal: ${selectedProducts.length} Products Available!`,
    content: combinedHTML,
    public: false,
    email_template_id: null,
  };

  try {
    const response = await axios.post(API_URL, emailData, { headers });
    if (response.status === 201) {
      console.log("✅ Group email draft successfully created.");
    
      for (const product of selectedProducts) {
        if (product && product.id) {
          try {
            console.log(`⏳ Updating last_sent for Product ID: ${product.id}`);
            await updateLastSent(product.id);
            console.log(`✅ last_sent successfully updated for: ${product.id}`);
          } catch (err) {
            console.error(`❌ Failed to update last_sent for ${product.id}:`, err);
          }
        } else {
          console.error(`❌ Invalid product ID for last_sent update:`, product);
        }
      }
    } else {
      console.error("❌ Failed to send group email:", response.data);
    }
  } catch (error) {
    console.error("Error sending group email:", error);
  }
}

/**
 * Update Last Sent Timestamp in DB
 * The updateProduct function (from your api.js) returns the parsed JSON,
 * so we remove the check on response.status and simply await the update.
 */
async function updateLastSent(productId) {
  if (!productId) {
    console.error("❌ updateLastSent called with invalid product ID.");
    return;
  }

  try {
    console.log(`⏳ Sending update request for last_sent: ${productId}`);
    await updateProduct(productId, { last_sent: new Date().toISOString() });
    console.log(`✅ Successfully updated last_sent for Product ID: ${productId}`);
  } catch (err) {
    console.error(`❌ Error updating last_sent for product ${productId}:`, err);
  }
}

/**
 * Format dimensions helper
 */
function formatDimensions(product) {
  const parts = [];
  if (product.width) parts.push(`${product.width}"W`);
  if (product.depth) parts.push(`${product.depth}"D`);
  if (product.height) parts.push(`${product.height}"H`);
  return parts.join(" x ");
}

/**
 * Build Furniture Email
 */
function buildFurnitureEmail({
  subject,
  imageUrl,
  price,
  moq,
  qty,
  sku,
  fob,
  leadTime,
  brand,
  material,
  color,
  dimensions,
  condition,
}) {
  let emailBody = `
    <div style="text-align:center; padding:20px;">
        <h2 style="font-size:18px; margin-bottom:20px;">${subject}</h2>
        <img src="${imageUrl}" alt="${subject}" style="max-width:300px; max-height:300px; object-fit:contain; display:block; margin:auto; margin-top:40px; margin-bottom:40px;"/>
        <p style="font-size:18px; margin-top:40px;">$${price} EA, MOQ ${moq}, ${qty} Available.</p>
  `;

  if (sku) emailBody += `<p style="font-size:18px;">SKU: ${sku}</p>`;
  if (brand) emailBody += `<p style="font-size:18px;">Brand: ${brand}</p>`;
  if (material) emailBody += `<p style="font-size:18px;">Material: ${material}</p>`;
  if (color) emailBody += `<p style="font-size:18px;">Color: ${color}</p>`;
  if (dimensions) emailBody += `<p style="font-size:18px;">Dimensions: ${dimensions}</p>`;
  if (condition) emailBody += `<p style="font-size:18px;">Condition: ${condition}</p>`;
  if (fob) emailBody += `<p style="font-size:18px;">FOB: ${fob}</p>`;
  if (leadTime) emailBody += `<p style="font-size:18px;">Lead Time: ${leadTime}</p>`;

  emailBody += `</div>`;

  return emailBody;
}
