# Paystack Payment Integration Setup Guide

## Prerequisites
- A Paystack account (sign up at https://paystack.com)
- Access to your Paystack dashboard

## Step 1: Get Your Paystack API Keys

1. Log in to your Paystack Dashboard at https://dashboard.paystack.com
2. Navigate to **Settings** → **API Keys & Webhooks**
3. You'll find two types of keys:
   - **Test Keys** (for testing): `sk_test_...` and `pk_test_...`
   - **Live Keys** (for production): `sk_live_...` and `pk_live_...`

## Step 2: Configure Environment Variables

Update your `.env` file in the `server` directory:

```env
# Paystack Configuration
# For Testing (use test keys)
PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_key_here

# For Production (use live keys)
# PAYSTACK_SECRET_KEY=sk_live_your_actual_secret_key_here
# PAYSTACK_PUBLIC_KEY=pk_live_your_actual_public_key_here

# Important: Make sure CLIENT_URL is correct
CLIENT_URL=http://localhost:3000
```

## Step 3: Set Up Webhook (Optional but Recommended)

Webhooks allow Paystack to notify your server about payment events in real-time.

1. Go to **Settings** → **API Keys & Webhooks** in Paystack Dashboard
2. Scroll to **Webhook URL** section
3. Add your webhook URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/api/payment/webhook`
   - **Production**: `https://yourdomain.com/api/payment/webhook`
4. Save the webhook URL

### For Local Testing with ngrok:
```bash
# Install ngrok
npm install -g ngrok

# Start your server on port 5000
npm run dev

# In another terminal, expose port 5000
ngrok http 5000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Add this to Paystack: https://abc123.ngrok.io/api/payment/webhook
```

## Step 4: Test the Integration

### Test Mode Payment:
1. Use Paystack test cards for testing
2. **Successful Payment**: 
   - Card: `5061 0208 1040 0032 410`
   - CVV: `123`
   - Expiry: Any future date
   - PIN: `1111`
   - OTP: `123456`

3. **Failed Payment**:
   - Card: `5060 9905 8000 0000 17`
   - CVV: `123`
   - Expiry: Any future date

### Full Test Flow:
1. Add products to cart
2. Proceed to checkout
3. Fill in shipping information
4. Select "Pay with Paystack" as payment method
5. Complete the order
6. You'll be redirected to Paystack payment page
7. Use test card details
8. Complete payment
9. You'll be redirected back with verification

## Step 5: Go Live

When ready for production:

1. **Complete Paystack Account Verification**:
   - Submit business documents
   - Verify bank account
   - Complete KYC requirements

2. **Switch to Live Keys**:
   - Update `.env` with live keys (`sk_live_...` and `pk_live_...`)
   - Update webhook URL to production URL
   - Test thoroughly before going live

3. **Enable Live Mode** in Paystack Dashboard

## Payment Flow

```
Customer → Checkout → Order Created → Paystack Payment Page → Payment Success
                                                                      ↓
                                                            Redirect to Verify Page
                                                                      ↓
                                                            Order Status Updated
                                                                      ↓
                                                            Clear Cart & Show Success
```

## Supported Payment Methods

Paystack supports multiple payment methods in Ghana:
- Credit/Debit Cards (Visa, Mastercard, Verve)
- Mobile Money (MTN, Vodafone, AirtelTigo)
- Bank Transfer
- USSD
- Ghana QR Code

## Troubleshooting

### Issue: Payment initialization fails
**Solution**: 
- Check if `PAYSTACK_SECRET_KEY` is set correctly in `.env`
- Ensure key starts with `sk_test_` (test) or `sk_live_` (live)
- Check server logs for detailed error messages

### Issue: Payment succeeds but order not updated
**Solution**:
- Check webhook configuration
- Verify webhook URL is accessible
- Check server logs for webhook errors
- Ensure database connection is working

### Issue: Redirect URL not working
**Solution**:
- Verify `CLIENT_URL` in `.env` matches your frontend URL
- Check if PaymentVerify route is properly configured
- Ensure reference parameter is being passed correctly

## Security Best Practices

1. **Never expose your SECRET_KEY**: Only use it on the server-side
2. **Use HTTPS in production**: Required for PCI compliance
3. **Validate webhook signatures**: Already implemented in the code
4. **Keep keys secure**: Don't commit `.env` file to version control
5. **Use test keys for development**: Never use live keys in development
6. **Implement proper error handling**: Don't expose sensitive error details to users

## Support

- Paystack Documentation: https://paystack.com/docs
- Paystack Support: support@paystack.com
- Integration Help: https://paystack.com/docs/payments/accept-payments

## Testing Checklist

- [ ] Paystack keys configured in `.env`
- [ ] Server restarts after `.env` update
- [ ] Able to place order and redirect to Paystack
- [ ] Test card payment completes successfully
- [ ] Payment verification works
- [ ] Order status updates after payment
- [ ] Cart clears after successful payment
- [ ] Order confirmation email sent (if configured)
- [ ] Webhook receives payment notifications
- [ ] Failed payments handled gracefully
