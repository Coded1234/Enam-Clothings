# Paystack Test Cards

## Successful Transactions

### Nigerian Cards (NGN)
**Mastercard - Success**
- Card Number: `5061 0208 1040 0032 410`
- CVV: `123`
- Expiry: Any future date (e.g., `12/25`)
- PIN: `1111`
- OTP: `123456`

**Verve - Success**
- Card Number: `5060 6666 6666 6666 666`
- CVV: `123`
- Expiry: Any future date
- PIN: `1234`
- OTP: `123456`

**Visa - Success**
- Card Number: `4084 0840 8408 4081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`
- OTP: `123456`

## Failed Transactions

**Insufficient Funds**
- Card Number: `5060 9905 8000 0000 17`
- CVV: `123`
- Expiry: Any future date
- PIN: `1234`

**Invalid CVV**
- Card Number: `5060 6666 6666 6666 666`
- CVV: `000`
- Expiry: Any future date

## Bank Account Test Details

**Account Transfer**
- Account Number: `0000000000`
- Bank: Any bank from dropdown

## USSD Test

**Test USSD Code**
- Dial: `*737*000*amount#`
- This will simulate a successful USSD transaction

## Mobile Money Test

**Ghana Mobile Money**
- Phone Number: `0551234567`
- Mobile Money Provider: MTN
- OTP: `123456`

## Testing Steps

1. **Initialize Payment**
   - Complete checkout with any products
   - Select "Pay with Paystack"
   - Confirm order

2. **On Paystack Payment Page**
   - Choose payment method (Card/Bank/Mobile Money/USSD)
   - Enter test credentials above
   - Complete payment flow

3. **Verification**
   - You'll be redirected back to your site
   - Order status should update to "Confirmed"
   - Payment status should show "Paid"

## Important Notes

- **Test Mode**: Always use test keys (sk_test_...) for testing
- **Amount**: You can test with any amount (minimum GH₵1)
- **Currency**: GHS (Ghana Cedis) is the default currency
- **No Real Money**: Test transactions don't involve real money
- **Reset Data**: Test transactions can be viewed in Paystack test dashboard

## Common Test Scenarios

### Scenario 1: Successful Card Payment
1. Add items to cart (total: GH₵100)
2. Checkout with test email
3. Use successful Mastercard above
4. Enter PIN and OTP
5. ✅ Payment successful → Order confirmed

### Scenario 2: Failed Payment (Insufficient Funds)
1. Add items to cart
2. Use "Insufficient Funds" card
3. ❌ Payment fails → Order remains pending
4. User can retry payment

### Scenario 3: Abandoned Payment
1. Add items to cart
2. Start payment but close Paystack modal
3. Order created but payment not completed
4. Order remains in "Pending" status

## Webhooks Testing

If you've set up webhooks with ngrok:

1. Make a test payment
2. Check your server console for webhook events
3. You should see: "Payment successful: [reference]"
4. Order should auto-update even if verification page isn't reached

## Live Mode Checklist

Before going live:
- [ ] Get KYC verified on Paystack
- [ ] Replace test keys with live keys
- [ ] Test with small real transaction
- [ ] Set up production webhook URL
- [ ] Enable live mode in Paystack dashboard
- [ ] Monitor first few transactions closely

## Support

If you encounter issues:
1. Check server logs for errors
2. Verify Paystack keys are correct
3. Ensure CLIENT_URL matches your frontend
4. Check Paystack dashboard for transaction details
5. Contact Paystack support: support@paystack.com
