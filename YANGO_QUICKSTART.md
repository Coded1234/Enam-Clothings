# Quick Start: Yango Delivery Integration

## ✅ What's Been Implemented

### Backend (`server/`)
- ✅ **Shipping Controller** (`controllers/shippingController.js`)
  - Calculate shipping rates
  - Get delivery options
  - Geocoding with fallback
  - Distance-based pricing
  
- ✅ **Shipping Routes** (`routes/shipping.js`)
  - POST `/api/shipping/calculate` - Calculate rate for address
  - POST `/api/shipping/options` - Get delivery options

- ✅ **Database Updates** (`models/Order.js`)
  - Added `shippingDetails` JSONB field
  - Stores carrier, service type, delivery time, distance

- ✅ **Server Configuration** (`server.js`)
  - Registered shipping routes
  - Ready for requests

### Frontend (`client/`)
- ✅ **Checkout Page** Updates
  - Address form with city and postal code fields
  - "Calculate Shipping" button
  - Real-time rate display
  - Shipping details preview (carrier, time, distance)
  - Validation before proceeding

- ✅ **Cart Page** Updates
  - Shows "Calculated at checkout" for shipping
  - Removed static shipping fees

- ✅ **Order Summary** Updates
  - Accepts dynamic shipping cost
  - Stores shipping details with order

### Environment Setup
- ✅ `.env` file updated with Yango configuration
- ✅ Store location coordinates configured

## 🚀 How to Test (Without Yango API)

The system works **immediately** without Yango credentials using fallback mode:

### 1. Start the Server
```bash
cd server
npm run dev
```

### 2. Start the Client
```bash
cd client
npm start
```

### 3. Test the Flow

1. **Add items to cart**
2. **Go to checkout**
3. **Fill in shipping form:**
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Phone: +233200620026
   - Address: 123 Main Street, East Legon
   - City: Accra
   - Postal Code: GA-123-4567 (optional)

4. **Click "Calculate Shipping Cost"**
   - System geocodes the address
   - Calculates distance from store
   - Returns shipping rate (e.g., GH₵45)
   - Shows estimated delivery time

5. **Proceed to payment**
   - Shipping cost included in total
   - Complete order normally

### Example Test Addresses

**Close (Accra area):**
```
Address: Osu, Oxford Street
City: Accra
Expected: GH₵15-30 (5-10 km)
```

**Medium (Greater Accra):**
```
Address: Tema Community 1
City: Tema
Expected: GH₵40-60 (20-25 km)
```

**Far (Other regions):**
```
Address: Kejetia Market
City: Kumasi
Expected: GH₵150+ (250+ km)
```

## 🔧 With Yango API (Optional)

### 1. Get Credentials
- Sign up at https://b2b.yango.com/
- Get API Key and Client ID

### 2. Update `.env`
```env
YANGO_API_KEY=your_actual_api_key
YANGO_CLIENT_ID=your_actual_client_id
```

### 3. Restart Server
```bash
npm run dev
```

Now the system will use real Yango rates instead of estimates!

## 📊 How Fallback Pricing Works

**Without Yango API**, the system uses:

1. **Free geocoding** (OpenStreetMap/Nominatim)
2. **Distance calculation** (Haversine formula)
3. **Smart pricing**:
   ```
   0-5 km:    GH₵15 (base rate)
   5-20 km:   GH₵15 + (distance × 2)
   20-50 km:  GH₵15 + (distance × 1.8)
   50+ km:    GH₵15 + (distance × 1.5)
   ```

4. **Estimated delivery times**:
   ```
   0-10 km:   Same day - 1 business day
   10-30 km:  1-2 business days
   30-100 km: 2-3 business days
   100+ km:   3-5 business days
   ```

## 🎯 API Usage Examples

### Calculate Shipping
```bash
curl -X POST http://localhost:5000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "address": "Osu, Oxford Street",
    "city": "Accra",
    "phone": "+233200620026"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shippingFee": 25,
    "estimatedDeliveryTime": "Same day - 1 business day",
    "distance": 5.2,
    "carrier": "Standard Delivery",
    "serviceType": "standard",
    "destinationCoords": {
      "latitude": 5.6500,
      "longitude": -0.2000
    }
  }
}
```

### Get Delivery Options
```bash
curl -X POST http://localhost:5000/api/shipping/options \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "address": "East Legon",
    "city": "Accra"
  }'
```

## ⚠️ Troubleshooting

### "Could not locate address"
**Solution**: 
- Add more details (e.g., "East Legon, Accra" vs just "Legon")
- Use well-known locations
- Include landmarks if possible

### Shipping button disabled
**Solution**:
- Fill all required fields (marked with *)
- Enter both address AND city
- Phone number is optional for calculation

### High shipping costs
**Solution**:
- Verify store coordinates in `.env` are correct
- Check customer's city is correct
- Review pricing formula if needed

### API errors in console
**Solution**:
- Check if server is running
- Verify you're logged in (JWT token required)
- Check network tab for actual error

## 🔐 Security Note

The shipping calculation requires authentication (JWT token). Users must be logged in to:
- Calculate shipping rates
- Get delivery options
- Place orders

This prevents abuse and rate limiting issues.

## 📈 Next Steps

1. **Test thoroughly** with various addresses
2. **Get Yango API credentials** for production
3. **Adjust pricing** in `calculatePriceByDistance()` if needed
4. **Update store location** to your actual warehouse
5. **Monitor logs** for any geocoding failures
6. **Consider caching** rates for frequently used addresses

## ✨ Benefits

- ✅ **No upfront costs** - works without API
- ✅ **Fair pricing** - based on actual distance
- ✅ **Transparency** - customers see exact costs
- ✅ **Flexibility** - easy to upgrade to Yango API
- ✅ **Reliability** - fallback system always works
- ✅ **User-friendly** - simple one-click calculation

---

**Status**: 🟢 **Ready to Use!**

Start testing now. No Yango API required for development and testing!
