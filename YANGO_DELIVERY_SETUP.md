# Yango Delivery Integration Setup

This e-commerce platform now uses **Yango Delivery API** for real-time shipping rate calculations based on customer addresses.

## Features

- **Live Shipping Rates**: Real-time shipping cost calculation based on distance and location
- **Multiple Carriers**: Support for different service types (Express, Standard, Economy)
- **Geocoding**: Automatic address to coordinates conversion
- **Fallback System**: Automatic fallback to estimated rates if API is unavailable
- **Distance-based Pricing**: Smart pricing based on delivery distance

## How It Works

1. **Address Input**: Customer enters full delivery address including city
2. **Calculate Shipping**: System sends address to Yango API
3. **Geocoding**: Address is converted to GPS coordinates
4. **Rate Calculation**: Yango calculates exact shipping cost based on:
   - Distance from store to delivery address
   - Service type (Express/Standard/Economy)
   - Package size and weight
5. **Display**: Real-time rate shown to customer with estimated delivery time
6. **Checkout**: Selected shipping rate applied to order total

## Setup Instructions

### 1. Get Yango API Credentials

Visit [Yango Delivery B2B Portal](https://b2b.yango.com/) and:

1. Create a business account
2. Complete the verification process
3. Navigate to API Settings
4. Copy your:
   - **API Key** (Bearer token)
   - **Client ID**

### 2. Configure Environment Variables

Add the following to your `server/.env` file:

```env
# Yango Delivery API Configuration
YANGO_API_URL=https://b2b.yango.com/api/b2b
YANGO_API_KEY=your_yango_api_key_here
YANGO_CLIENT_ID=your_yango_client_id_here

# Store Location (your warehouse/store GPS coordinates)
STORE_LATITUDE=5.6037
STORE_LONGITUDE=-0.1870
STORE_ADDRESS=Accra, Ghana
```

**To find your store coordinates:**
- Visit [Google Maps](https://maps.google.com)
- Right-click on your store location
- Click on the coordinates to copy them
- Format: First number is Latitude, second is Longitude

### 3. API Endpoints

#### Calculate Shipping Rate
```
POST /api/shipping/calculate
```

**Request Body:**
```json
{
  "address": "123 Main Street, East Legon",
  "city": "Accra",
  "postalCode": "GA-123-4567",
  "phone": "+233200620026"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shippingFee": 45,
    "estimatedDeliveryTime": "1-2 business days",
    "distance": 12.5,
    "carrier": "Yango Delivery",
    "serviceType": "standard",
    "destinationCoords": {
      "latitude": 5.6500,
      "longitude": -0.2000,
      "formattedAddress": "East Legon, Accra, Ghana"
    }
  }
}
```

#### Get Delivery Options
```
POST /api/shipping/options
```

Returns multiple delivery options (Express, Standard, Economy) with different rates and delivery times.

### 4. Fallback System

If Yango API is unavailable or credentials are not configured, the system automatically:

1. Uses free OpenStreetMap geocoding (Nominatim)
2. Calculates distance using Haversine formula
3. Applies distance-based pricing formula
4. Returns estimated delivery time

**Fallback Pricing Structure (in GHS):**
- Base price: GH₵15
- 0-5 km: GH₵15
- 5-20 km: GH₵15 + (distance × GH₵2)
- 20-50 km: GH₵15 + (distance × GH₵1.8)
- 50+ km: GH₵15 + (distance × GH₵1.5)

### 5. Testing Without API Credentials

The system works without Yango credentials! It will:
- Use free geocoding services
- Calculate shipping based on distance
- Show estimated delivery times
- Mark rates as "estimated" in the UI

This allows you to test the feature immediately before getting API access.

### 6. Database Migration

The Order model now includes a `shippingDetails` field (JSONB) that stores:
- Carrier name
- Service type
- Estimated delivery time
- Distance
- GPS coordinates

**Migration will run automatically** when you restart the server.

### 7. Frontend Usage

#### In Cart Page
- Shows "Calculated at checkout" for shipping
- Removed static shipping fees

#### In Checkout Page
- Enter full address + city
- Click "Calculate Shipping Cost" button
- See real-time rate with delivery time
- Distance and carrier information displayed
- Must calculate before proceeding to payment

### 8. Supported Cities in Ghana

The system works with any city in Ghana, including:
- Accra
- Kumasi
- Takoradi
- Tamale
- Cape Coast
- Tema
- Obuasi
- Koforidua
- Sunyani
- Ho

And many more! The geocoding service covers all regions.

## Customization

### Modify Pricing Formula

Edit `server/controllers/shippingController.js`:

```javascript
function calculatePriceByDistance(distanceKm) {
  const basePrice = 15; // Change base price
  const pricePerKm = 2;  // Change per-km rate
  
  // Add your custom pricing logic
  if (distanceKm <= 5) {
    return Math.round(basePrice);
  }
  // ... more conditions
}
```

### Change Store Location

Update coordinates in `.env`:
```env
STORE_LATITUDE=your_latitude
STORE_LONGITUDE=your_longitude
STORE_ADDRESS=Your Store Address
```

### Add More Service Types

Modify `getYangoDeliveryOptions()` function to add:
- Same-day delivery
- Next-day delivery
- Weekend delivery
- Special handling options

## Troubleshooting

### "Could not locate address"
- Ensure city name is correct
- Try adding more details to address
- Check if address is within Ghana

### Shipping not calculating
- Verify all required fields are filled
- Check browser console for errors
- Verify API credentials if using Yango

### High shipping costs
- Review pricing formula in `calculatePriceByDistance()`
- Check store location coordinates
- Verify customer address is correct

## API Rate Limits

**Free Geocoding (Nominatim):**
- 1 request per second
- Use with User-Agent header (already configured)
- Automatic retry on failure

**Yango API:**
- Depends on your plan
- Check with Yango support for limits
- Consider caching rates for repeated addresses

## Security Notes

- API keys stored in `.env` (not committed to git)
- Authentication required for shipping endpoints
- Address validation implemented
- Rate limiting recommended for production

## Future Enhancements

- [ ] Cache shipping rates for common addresses
- [ ] Multiple pickup locations support
- [ ] Real-time tracking integration
- [ ] Delivery scheduling
- [ ] Special delivery instructions
- [ ] Package insurance options
- [ ] Bulk shipping discounts

## Support

For Yango API issues:
- Email: support@yango.com
- Documentation: https://b2b.yango.com/docs

For integration issues:
- Check server logs
- Verify environment variables
- Test with fallback system first

---

**Status**: ✅ Ready for use with or without Yango API credentials
