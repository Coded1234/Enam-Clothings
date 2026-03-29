const axios = require("axios");
const { validateGhanaPhone } = require("../utils/inputValidation");
const logger = require("../config/logger");

// Yango Delivery API Configuration
const YANGO_API_URL =
  process.env.YANGO_API_URL || "https://b2b.yango.com/api/b2b";
const YANGO_API_KEY = process.env.YANGO_API_KEY;
const YANGO_CLIENT_ID = process.env.YANGO_CLIENT_ID;

// Store coordinates (your warehouse/store location)
const STORE_LOCATION = {
  latitude: parseFloat(process.env.STORE_LATITUDE) || 5.6037,
  longitude: parseFloat(process.env.STORE_LONGITUDE) || -0.187,
  address: process.env.STORE_ADDRESS || "Accra, Ghana",
};

// Road distance multiplier (used when routing API fails)
// Accra's road network typically adds 40-60% to straight-line distance
const ROAD_MULTIPLIER = parseFloat(process.env.ROAD_DISTANCE_MULTIPLIER) || 1.5;

function createClientError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.expose = true;
  return error;
}

async function computeShippingQuote(input = {}) {
  const { address, city, postalCode, phone } = input;

  if (!address || !city) {
    throw createClientError("Address and city are required", 400);
  }

  const phoneCheck = validateGhanaPhone(phone, { required: false });
  if (!phoneCheck.ok) {
    throw createClientError(phoneCheck.message, 400);
  }

  const destinationCoords = await geocodeAddress({
    address,
    city,
    postalCode,
  });

  if (!destinationCoords) {
    throw createClientError(
      "Could not locate the provided address. Please enter a valid address in Ghana.",
      400,
    );
  }

  const shippingRate = await getYangoShippingRate(
    STORE_LOCATION,
    destinationCoords,
    {
      address,
      city,
      postalCode,
      phone: phoneCheck.phone || phone,
    },
  );

  return {
    shippingFee: shippingRate.price,
    estimatedDeliveryTime: shippingRate.estimatedTime,
    distance: shippingRate.distance,
    carrier: "Yango Delivery",
    serviceType: shippingRate.serviceType,
    destinationCoords,
  };
}

exports.computeShippingQuote = computeShippingQuote;

/**
 * Calculate shipping rate using Yango Delivery API
 */
exports.calculateShippingRate = async (req, res) => {
  try {
    const quote = await computeShippingQuote(req.body || {});

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    if (error?.expose && error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    logger.error("Shipping calculation error", { error: error.message });

    // Fallback to static rates if API fails
    const fallbackRate = calculateFallbackRate(req.body);

    res.json({
      success: true,
      data: {
        shippingFee: fallbackRate,
        estimatedDeliveryTime: "2-5 business days",
        distance: null,
        carrier: "Standard Delivery",
        serviceType: "standard",
        fallback: true,
      },
      warning:
        "Using estimated shipping rate. Actual rate will be calculated during delivery.",
    });
  }
};

/**
 * Get available delivery options for an address
 */
exports.getDeliveryOptions = async (req, res) => {
  try {
    const { address, city, postalCode } = req.body;

    if (!address || !city) {
      return res.status(400).json({
        success: false,
        message: "Address and city are required",
      });
    }

    // Geocode destination
    const destinationCoords = await geocodeAddress({
      address,
      city,
      postalCode,
    });

    if (!destinationCoords) {
      return res.status(400).json({
        success: false,
        message: "Could not locate the provided address",
      });
    }

    // Get multiple delivery options from Yango
    const options = await getYangoDeliveryOptions(
      STORE_LOCATION,
      destinationCoords,
    );

    res.json({
      success: true,
      data: {
        options,
        storeLocation: STORE_LOCATION.address,
      },
    });
  } catch (error) {
    logger.error("Get delivery options error", { error: error.message });

    // Return fallback options
    res.json({
      success: true,
      data: {
        options: [
          {
            id: "standard",
            name: "Standard Delivery",
            price: calculateFallbackRate(req.body),
            estimatedTime: "2-5 business days",
            serviceType: "standard",
          },
        ],
        fallback: true,
      },
    });
  }
};

/**
 * Geocode address to coordinates using multiple services
 */
async function geocodeAddress({ address, city, postalCode }) {
  try {
    // Try Nominatim (OpenStreetMap) first - free and reliable
    const query = `${address}, ${city}, Ghana`;
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gh&limit=1`;

    const response = await axios.get(nominatimUrl, {
      headers: {
        "User-Agent": "EcommerceWebsite/1.0",
      },
      timeout: 5000,
    });

    if (response.data && response.data.length > 0) {
      return {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon),
        formattedAddress: response.data[0].display_name,
      };
    }

    // Fallback: Try with just city if full address fails
    const cityQuery = `${city}, Ghana`;
    const cityResponse = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}&countrycodes=gh&limit=1`,
      {
        headers: { "User-Agent": "EcommerceWebsite/1.0" },
        timeout: 5000,
      },
    );

    if (cityResponse.data && cityResponse.data.length > 0) {
      return {
        latitude: parseFloat(cityResponse.data[0].lat),
        longitude: parseFloat(cityResponse.data[0].lon),
        formattedAddress: cityResponse.data[0].display_name,
      };
    }

    return null;
  } catch (error) {
    logger.error("Geocoding error", { error: error.message });
    return null;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * This gives straight-line distance "as the crow flies"
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate actual road distance using OSRM routing API
 * This gives real driving distance following roads
 */
async function calculateRoadDistance(lat1, lon1, lat2, lon2) {
  try {
    // Use OSRM (Open Source Routing Machine) for road distance
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;

    logger.info("Calculating road distance", {
      origin: { lat: lat1, lon: lon1 },
      destination: { lat: lat2, lon: lon2 },
    });

    const response = await axios.get(url, {
      timeout: 8000, // Increased timeout for Vercel
      headers: {
        "User-Agent": "EcommerceWebsite/1.0",
        Accept: "application/json",
      },
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      // Distance is in meters, convert to km
      const distanceKm = response.data.routes[0].distance / 1000;
      logger.info("Road distance calculated", {
        distanceKm: Number(distanceKm.toFixed(2)),
      });
      return distanceKm;
    }

    // Fallback if no routes found
    logger.warn("No routes found; using straight-line fallback");
    const straightLine = calculateDistance(lat1, lon1, lat2, lon2);
    return straightLine * ROAD_MULTIPLIER;
  } catch (error) {
    logger.error("Road distance calculation error", { error: error.message });
    // Fallback to straight-line distance with road multiplier
    const straightLine = calculateDistance(lat1, lon1, lat2, lon2);
    const estimated = straightLine * ROAD_MULTIPLIER;
    logger.info("Using road distance fallback estimate", {
      straightLineKm: Number(straightLine.toFixed(2)),
      multiplier: ROAD_MULTIPLIER,
      estimatedKm: Number(estimated.toFixed(2)),
    });
    return estimated;
  }
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get shipping rate from Yango Delivery API
 */
async function getYangoShippingRate(origin, destination, deliveryInfo) {
  try {
    if (!YANGO_API_KEY || !YANGO_CLIENT_ID) {
      throw new Error("Yango API credentials not configured");
    }

    // Calculate actual road distance (not straight-line)
    const distance = await calculateRoadDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    );

    // Yango API request for delivery cost estimate
    const requestData = {
      client_id: YANGO_CLIENT_ID,
      route_points: [
        {
          coordinates: [origin.longitude, origin.latitude],
          fullname: "Store",
        },
        {
          coordinates: [destination.longitude, destination.latitude],
          fullname: deliveryInfo.address,
          phone: deliveryInfo.phone || "+233000000000",
        },
      ],
      items: [
        {
          quantity: 1,
          size: { length: 0.3, width: 0.3, height: 0.2 }, // Default package size
          weight: 2, // Default weight in kg
        },
      ],
      requirements: {
        taxi_class: "express",
      },
    };

    const response = await axios.post(
      `${YANGO_API_URL}/v1/offers/calculate`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${YANGO_API_KEY}`,
        },
        timeout: 10000,
      },
    );

    if (
      response.data &&
      response.data.offers &&
      response.data.offers.length > 0
    ) {
      const offer = response.data.offers[0];
      return {
        price:
          parseFloat(offer.price_total) || calculatePriceByDistance(distance),
        estimatedTime: offer.eta || "2-5 business days",
        distance: Math.round(distance * 10) / 10,
        serviceType: offer.taxi_class || "express",
        offerId: offer.offer_id,
      };
    }

    // If API returns no offers, calculate by distance
    return {
      price: calculatePriceByDistance(distance),
      estimatedTime: estimateDeliveryTime(distance),
      distance: Math.round(distance * 10) / 10,
      serviceType: "standard",
    };
  } catch (error) {
    logger.error("Yango API error", { error: error.message });

    // Fallback to distance-based calculation with road distance
    const distance = await calculateRoadDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    );

    return {
      price: calculatePriceByDistance(distance),
      estimatedTime: estimateDeliveryTime(distance),
      distance: Math.round(distance * 10) / 10,
      serviceType: "standard",
    };
  }
}

/**
 * Get multiple delivery options from Yango
 */
async function getYangoDeliveryOptions(origin, destination) {
  try {
    const distance = await calculateRoadDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    );

    // Return different service levels based on distance
    const options = [];

    // Express delivery (for short distances)
    if (distance < 20) {
      options.push({
        id: "express",
        name: "Express Delivery",
        price: calculatePriceByDistance(distance) * 1.5,
        estimatedTime: "Same day",
        serviceType: "express",
        description: "Get your order delivered today",
      });
    }

    // Standard delivery
    options.push({
      id: "standard",
      name: "Standard Delivery",
      price: calculatePriceByDistance(distance),
      estimatedTime: estimateDeliveryTime(distance),
      serviceType: "standard",
      description: "Regular delivery service",
    });

    // Economy delivery (for longer distances)
    if (distance > 50) {
      options.push({
        id: "economy",
        name: "Economy Delivery",
        price: calculatePriceByDistance(distance) * 0.8,
        estimatedTime: "5-7 business days",
        serviceType: "economy",
        description: "Budget-friendly delivery option",
      });
    }

    return options;
  } catch (error) {
    logger.error("Get delivery options error", { error: error.message });
    throw error;
  }
}

/**
 * Calculate shipping price based on distance (in GHS).
 * First 3 km are free; fee is calculated on (distance - 3) km.
 */
function calculatePriceByDistance(distanceKm) {
  const effectiveKm = Math.max(0, distanceKm - 3); // Deduct 3 km before calculating fee
  const basePrice = 15; // GHS
  const pricePerKm = 2; // GHS per km

  if (effectiveKm <= 5) {
    return Math.round(basePrice);
  } else if (effectiveKm <= 20) {
    return Math.round(basePrice + effectiveKm * pricePerKm);
  } else if (effectiveKm <= 50) {
    return Math.round(basePrice + effectiveKm * 1.8);
  } else {
    return Math.round(basePrice + effectiveKm * 1.5);
  }
}

/**
 * Estimate delivery time based on distance
 */
function estimateDeliveryTime(distanceKm) {
  if (distanceKm <= 10) {
    return "Same day - 1 business day";
  } else if (distanceKm <= 30) {
    return "1-2 business days";
  } else if (distanceKm <= 100) {
    return "2-3 business days";
  } else {
    return "3-5 business days";
  }
}

/**
 * Fallback rate calculation (static)
 */
function calculateFallbackRate(deliveryInfo) {
  // Default fallback rate
  return 50; // GHS 50 flat rate
}
