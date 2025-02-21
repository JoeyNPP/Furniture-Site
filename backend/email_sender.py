import axios from "axios";

const API_URL = "https://api.kit.com/v4/broadcasts";  // Same API endpoint
const API_KEY = "kit_a0a183e8fd744ca557d96126e488ae22";  // Your API Key

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-Kit-Api-Key": API_KEY,
};

// ✅ Send Individual Emails
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

    const emailData = {
      subject: product.title,
      content: buildEmailBody(product),  // ✅ Build email with corrected format
      public: false,  // Save as draft
      email_template_id: null,
    };

    try {
      const response = await axios.post(API_URL, emailData, { headers });
      if (response.status === 201) {
        console.log(`Email draft created for: ${product.title}`);
      } else {
        console.error(`Failed to send email for ${product.title}:`, response.data);
      }
    } catch (error) {
      console.error(`Error sending email for ${product?.title || "undefined"}:`, error);
    }
  }
}

// ✅ Send Group Email
export async function sendGroupEmail(selectedProducts) {
  if (!selectedProducts || selectedProducts.length === 0) {
    console.error("No products selected for group email.");
    return;
  }

  const emailData = {
    subject: `Group Deal: ${selectedProducts.length} Products Available!`,
    content: selectedProducts.map(buildEmailBody).join("<hr>"),  // ✅ Combine multiple products
    public: false,  // Save as draft
    email_template_id: null,
  };

  try {
    const response = await axios.post(API_URL, emailData, { headers });
    if (response.status === 201) {
      console.log("Group email draft created successfully.");
    } else {
      console.error("Failed to send group email:", response.data);
    }
  } catch (error) {
    console.error("Error sending group email:", error);
  }
}

// ✅ Build the HTML Email Exactly Like Python Code
function buildEmailBody(product) {
  // ✅ Prepare Fields (Format Like Python)
  const title = (product.title || "").trim();
  const imageUrl = product.image_url || "";
  const amazonUrl = product.amazon_url || "";
  const walmartUrl = product.walmart_url || "";
  const ebayUrl = product.ebay_url || "";
  const price = product.price ? parseFloat(product.price).toFixed(2) : "0.00";
  const moq = product.moq || "0";
  const qty = product.qty || "0";
  const asin = product.asin || "";
  const fob = product.fob || "";
  const expDate = product.exp_date || "";
  let leadTime = product.lead_time || "";

  // ✅ Fix "Days" to "Business Days" like Python
  if (leadTime.includes("Days")) {
    leadTime = leadTime.replace("Days", "Business Days");
  }

  // ✅ Start the Email HTML
  let emailBody = `
    <div style="padding: 20px 0;">
      <div style="text-align:center; margin-bottom: 60px;">
        <h2 style="font-size:18px; margin-bottom: 20px;">${title}</h2>
        <img src="${imageUrl}" alt="${title}"
             style="max-width:300px; max-height:300px; width:auto; height:auto; object-fit:contain;
                    display:block; margin-left:auto; margin-right:auto; margin-top:40px; margin-bottom:40px;"/>
  `;

  // ✅ Add Buttons
  if (amazonUrl.includes("https")) {
    emailBody += `
      <a href="${amazonUrl}"
         style="background-color:#FF9900; color:white; padding:15px 25px; text-align:center;
                text-decoration:none; display:inline-block; font-size:16px; margin:5px; border-radius:5px;">
         Amazon Link
      </a>`;
  }
  if (walmartUrl.includes("https")) {
    emailBody += `
      <a href="${walmartUrl}"
         style="background-color:#0071CE; color:white; padding:15px 25px; text-align:center;
                text-decoration:none; display:inline-block; font-size:16px; margin:5px; border-radius:5px;">
         Walmart Link
      </a>`;
  }
  if (ebayUrl.includes("https")) {
    emailBody += `
      <a href="${ebayUrl}"
         style="background-color:#E53238; color:white; padding:15px 25px; text-align:center;
                text-decoration:none; display:inline-block; font-size:16px; margin:5px; border-radius:5px;">
         eBay Link
      </a>`;
  }

  // ✅ Add Product Details
  emailBody += `
        <p style="font-size:18px; margin-top:40px; margin-bottom: 10px;">
          $${price} EA, MOQ ${moq}, ${qty} Available.
        </p>`;

  if (asin) {
    emailBody += `<p style="font-size:18px; margin-bottom: 10px;">ASIN: ${asin}</p>`;
  }
  if (fob) {
    emailBody += `<p style="font-size:18px; margin-bottom: 10px;">FOB: ${fob}</p>`;
  }
  if (expDate) {
    emailBody += `<p style="font-size:18px; margin-bottom: 10px;">Expiration Date: ${expDate}</p>`;
  }

  emailBody += `<p style="font-size:18px; margin-bottom: 20px;">Lead Time: ${leadTime}</p></div></div>`;

  return emailBody;
}
