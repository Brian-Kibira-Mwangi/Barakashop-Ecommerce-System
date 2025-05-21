export async function POST(req) {
  try {
    const body = await req.json();
    const { phone, amount } = body;

    if (!phone || !amount) {
      return new Response(JSON.stringify({ message: "Phone and amount are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const consumerKey = process.env.NEXT_PUBLIC_MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.NEXT_PUBLIC_MPESA_CONSUMER_SECRET;
    const shortcode = process.env.NEXT_PUBLIC_MPESA_SHORTCODE;
    const passkey = process.env.NEXT_PUBLIC_MPESA_PASSKEY;
    const callbackURL = process.env.NEXT_PUBLIC_MPESA_CALLBACK_URL;

    // Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const tokenResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    // Initiate STK Push
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: phone,
          PartyB: shortcode,
          PhoneNumber: phone,
          CallBackURL: callbackURL,
          AccountReference: "Cart Payment",
          TransactionDesc: "Payment for cart items",
        }),
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("M-Pesa Payment Error:", error);
    return new Response(JSON.stringify({ message: "Payment failed", error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
