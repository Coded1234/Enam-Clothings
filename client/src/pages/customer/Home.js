import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeaturedProducts } from "../../redux/slices/productSlice";
import ProductCard from "../../components/customer/ProductCard";
import IMAGES from "../../config/images";
import {
  FiTruck,
  FiRefreshCw,
  FiShield,
  FiHeadphones,
  FiArrowRight,
} from "react-icons/fi";
import api from "../../utils/api";

const Home = () => {
  const dispatch = useDispatch();
  const { featuredProducts, loading } = useSelector((state) => state.products);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    fetchTestimonials();
  }, [dispatch]);

  const fetchTestimonials = async () => {
    try {
      const response = await api.get("/reviews/testimonials?limit=3");
      setTestimonials(response.data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setTestimonialsLoading(false);
    }
  };

  const categories = [
    {
      name: "Men",
      image: IMAGES.categories.men,
      path: "/shop/men",
    },
    {
      name: "Women",
      image: IMAGES.categories.women,
      path: "/shop/women",
    },
    {
      name: "Kids",
      image: IMAGES.categories.kids,
      path: "/shop/kids",
    },
  ];

  const features = [
    { icon: FiTruck, title: "Free Shipping", desc: "On orders over GH₵50,000" },
    { icon: FiRefreshCw, title: "Easy Returns", desc: "30-day return policy" },
    { icon: FiShield, title: "Secure Payment", desc: "100% secure checkout" },
    { icon: FiHeadphones, title: "24/7 Support", desc: "Dedicated support" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMAGES.hero.main}
            alt="Hero"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white animate-fade-in">
            <p className="text-primary-400 font-medium mb-4 tracking-wider uppercase">
              New Collection 2026
            </p>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Discover Your
              <span className="block gradient-text">Perfect Style</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Explore our latest collection of premium clothing and accessories.
              Quality fashion for everyone.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="btn-gradient px-8 py-4 rounded-full font-semibold text-lg inline-flex items-center gap-2"
              >
                Shop Now <FiArrowRight />
              </Link>
              <Link
                to="/shop?featured=true"
                className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white hover:text-gray-900 transition-colors"
              >
                View Collection
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Bar */}
      <section className="bg-white py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <feature.icon className="text-primary-500" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our wide selection of clothing and accessories for men,
              women, and kids
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.path}
                className="group relative h-80 rounded-2xl overflow-hidden card-hover"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {category.name}
                  </h3>
                  <span className="text-white/80 flex items-center gap-2 group-hover:text-primary-400 transition-colors">
                    Shop Now{" "}
                    <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Featured Products
              </h2>
              <p className="text-gray-600">Handpicked favorites just for you</p>
            </div>
            <Link
              to="/shop?featured=true"
              className="hidden md:flex items-center gap-2 text-primary-500 font-medium hover:text-primary-600"
            >
              View All <FiArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[3/4] rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link
              to="/shop?featured=true"
              className="inline-flex items-center gap-2 text-primary-500 font-medium"
            >
              View All Products <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-secondary-500">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white text-center md:text-left">
              <p className="text-white/80 font-medium mb-2">
                Limited Time Offer
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Get 20% Off Your First Order
              </h2>
              <p className="text-white/80 text-lg mb-6">
                Use code <span className="font-bold text-white">WELCOME20</span>{" "}
                at checkout
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-white text-primary-500 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now <FiArrowRight />
              </Link>
            </div>
            <div className="hidden md:block">
              <img
                src={IMAGES.trending.small}
                alt="Promo"
                className="w-80 h-80 object-cover rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform"
              />
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* New Arrivals Card */}
            <div className="relative h-96 rounded-2xl overflow-hidden group">
              <img
                src={IMAGES.trending.large1}
                alt="New Arrivals"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-8">
                <p className="text-sm uppercase tracking-widest mb-2">
                  Just Arrived
                </p>
                <h3 className="text-3xl font-bold mb-4">New Arrivals</h3>
                <Link
                  to="/shop?sort=newest"
                  className="px-6 py-3 border-2 border-white rounded-full font-medium hover:bg-white hover:text-gray-900 transition-colors"
                >
                  Explore Now
                </Link>
              </div>
            </div>

            {/* Best Sellers Card */}
            <div className="relative h-96 rounded-2xl overflow-hidden group">
              <img
                src={IMAGES.trending.large2}
                alt="Best Sellers"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-8">
                <p className="text-sm uppercase tracking-widest mb-2">
                  Top Rated
                </p>
                <h3 className="text-3xl font-bold mb-4">Best Sellers</h3>
                <Link
                  to="/shop?sort=popular"
                  className="px-6 py-3 border-2 border-white rounded-full font-medium hover:bg-white hover:text-gray-900 transition-colors"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-600">Real reviews from real customers</p>
          </div>

          {testimonialsLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">
                    "{testimonial.comment || testimonial.title}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.user?.firstName?.[0] || "C"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {testimonial.user
                          ? `${testimonial.user.firstName} ${testimonial.user.lastName}`
                          : "Happy Customer"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {testimonial.isVerifiedPurchase
                          ? "Verified Buyer"
                          : "Customer"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Adaobi Okonkwo",
                  role: "Fashion Enthusiast",
                  text: "Amazing quality and fast delivery! Enam's Clothings has become my go-to for all my fashion needs. Highly recommended!",
                  rating: 5,
                },
                {
                  name: "Emeka Johnson",
                  role: "Regular Customer",
                  text: "The customer service is exceptional. They helped me find the perfect outfit for my event. Will definitely shop again!",
                  rating: 5,
                },
                {
                  name: "Fatima Ibrahim",
                  role: "Style Blogger",
                  text: "Great selection of trendy clothes at affordable prices. The quality exceeded my expectations!",
                  rating: 5,
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Instagram Feed Placeholder */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Follow Us on Instagram
            </h2>
            <p className="text-gray-600">@enamsclothings</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {IMAGES.instagram.map((img, index) => (
              <a
                key={index}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-xl overflow-hidden group"
              >
                <img
                  src={img}
                  alt={`Instagram ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
