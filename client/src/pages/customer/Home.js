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
  const [activeCoupon, setActiveCoupon] = useState(null);
  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    fetchTestimonials();
    fetchActiveCoupon();
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
  const fetchActiveCoupon = async () => {
    try {
      const response = await api.get("/coupons/active/homepage");
      if (response.data.success && response.data.coupon) {
        setActiveCoupon(response.data.coupon);
      }
    } catch (error) {
      console.error("Error fetching active coupon:", error);
    }
  };
  const categories = [
    { name: "Men", image: IMAGES.categories.men, path: "/shop/men" },
    { name: "Women", image: IMAGES.categories.women, path: "/shop/women" },
  ];
  const features = [
    { icon: FiTruck, title: "Free Shipping", desc: "On orders over GH₵1,000" },
    { icon: FiShield, title: "Secure Payment", desc: "100% secure checkout" },
    { icon: FiHeadphones, title: "24/7 Support", desc: "Dedicated support" },
  ];
  return (
    <div className="min-h-screen">
      {" "}
      {/* Hero Section */}{" "}
      <section className="relative h-[600px] bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden">
        {" "}
        <div className="absolute inset-0">
          {" "}
          <img
            src={IMAGES.hero.main}
            alt="Hero"
            className="w-full h-full object-cover opacity-40"
          />{" "}
        </div>{" "}
        <div className="relative container mx-auto px-4 h-full flex items-center">
          {" "}
          <div className="max-w-2xl text-white animate-fade-in">
            {" "}
            <p className="text-primary-300 dark:text-primary-200 font-medium mb-4 tracking-wider uppercase">
              {" "}
              New Collection 2026{" "}
            </p>{" "}
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
              {" "}
              Discover Your{" "}
              <span className="block gradient-text drop-shadow-lg">
                {" "}
                Perfect Style{" "}
              </span>{" "}
            </h1>{" "}
            <p className="text-sm sm:text-base md:text-xl text-gray-100 dark:text-gold-light mb-4 drop-shadow-md">
              {" "}
              Explore our latest collection of premium clothing. Quality fashion
              for everyone.{" "}
            </p>{" "}
            <div className="flex gap-4 flex-nowrap mt-10 md:mt-6">
              {" "}
              <Link
                to="/shop"
                className="btn-gradient px-6 py-3 sm:px-8 sm:py-4 rounded-full font-semibold text-base sm:text-lg inline-flex items-center gap-4 whitespace-nowrap"
              >
                {" "}
                Shop Now <FiArrowRight />{" "}
              </Link>{" "}
              <Link
                to="/shop"
                className="px-6 py-3 sm:px-8 sm:py-4 border-2 border-white text-white rounded-full font-semibold text-base sm:text-lg hover:bg-white hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                {" "}
                View Collection{" "}
              </Link>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Decorative Elements */}{" "}
        {/* Removed bottom white overlay to avoid extra white space under buttons */}{" "}
        <div className="absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-t from-white to-transparent"></div>{" "}
      </section>{" "}
      {/* Features Bar (centered) */}{" "}
      <section className="bg-white dark:bg-secondary-500 py-6 border-b dark:border-secondary-600">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <div className="grid grid-cols-3 gap-4 justify-items-center max-w-3xl mx-auto">
            {" "}
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-4 text-center p-2"
              >
                {" "}
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  {" "}
                  <feature.icon
                    className="text-primary-500 dark:text-primary-300"
                    size={18}
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h4 className="font-semibold text-sm sm:text-base whitespace-nowrap text-gray-800 dark:text-gold-light">
                    {" "}
                    {feature.title}{" "}
                  </h4>{" "}
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-primary-300">
                    {" "}
                    {feature.desc}{" "}
                  </p>{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Categories */}{" "}
      <section className="py-10 bg-gray-50 dark:bg-secondary-500">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <div className="text-center mb-5">
            {" "}
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800 dark:text-gold-light mb-4">
              {" "}
              Shop by Category{" "}
            </h2>{" "}
            <p className="text-gray-600 dark:text-gold max-w-2xl mx-auto">
              {" "}
              Browse our wide selection of clothing for men and women{" "}
            </p>{" "}
          </div>{" "}
          <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
            {" "}
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.path}
                className="group relative h-80 rounded-2xl overflow-hidden card-hover"
              >
                {" "}
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />{" "}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>{" "}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {" "}
                  <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-2">
                    {" "}
                    {category.name}{" "}
                  </h3>{" "}
                  <span className="text-white/80 flex items-center gap-4 group-hover:text-primary-400 transition-colors">
                    {" "}
                    Shop Now{" "}
                    <FiArrowRight className="group-hover:translate-x-2 transition-transform" />{" "}
                  </span>{" "}
                </div>{" "}
              </Link>
            ))}{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Featured Products */}{" "}
      <section className="py-16 dark:bg-secondary-600">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <div className="flex justify-between items-center mb-12">
            {" "}
            <div>
              {" "}
              <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800 dark:text-gold-light mb-2">
                {" "}
                Featured Products{" "}
              </h2>{" "}
              <p className="text-gray-600 dark:text-gold">
                {" "}
                Handpicked favorites just for you{" "}
              </p>{" "}
            </div>{" "}
            <Link
              to="/shop?featured=true"
              className="hidden md:flex items-center gap-4 text-primary-500 font-medium hover:text-primary-600"
            >
              {" "}
              View All <FiArrowRight />{" "}
            </Link>{" "}
          </div>{" "}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {" "}
              {[...Array(4)].map((_, i) => (
                <div key={`skeleton-${i}`} className="animate-pulse">
                  {" "}
                  <div className="bg-gray-200 aspect-[3/4] rounded-xl mb-4"></div>{" "}
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>{" "}
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>{" "}
                </div>
              ))}{" "}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {" "}
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}{" "}
            </div>
          )}{" "}
          <div className="text-center mt-8 md:hidden">
            {" "}
            <Link
              to="/shop"
              className="inline-flex items-center gap-4 text-primary-500 font-medium"
            >
              {" "}
              View All Products <FiArrowRight />{" "}
            </Link>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Promotional Banner / Coupon Section */}{" "}
      {activeCoupon && (
        <section className="py-16 bg-gradient-to-r from-primary-500 to-secondary-500 relative overflow-hidden">
          {" "}
          {/* Animated background elements */}{" "}
          <div className="absolute inset-0 opacity-20">
            {" "}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>{" "}
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full animate-bounce"></div>{" "}
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/50 rounded-full animate-ping"></div>{" "}
          </div>{" "}
          <div className="container mx-auto px-4 relative z-10">
            {" "}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {" "}
              <div className="text-white text-center md:text-left">
                {" "}
                <p className="text-white/80 font-medium mb-2 text-sm md:text-base animate-bounce">
                  {" "}
                  🎉 Limited Time Offer 🎉{" "}
                </p>{" "}
                <h2 className="text-lg sm:text-2xl md:text-5xl font-bold mb-4 whitespace-pre-line animate-pulse">
                  {" "}
                  {activeCoupon.ai_message
                    ?.split("\n")[0]
                    ?.replace(/(\d+)\.\d+%/g, "$1%")
                    .replace(/GH₵(\d+)\.\d+/g, "GH₵$1") ||
                    `Get ${activeCoupon.discount_type === "percentage" ? Math.round(activeCoupon.discount_value) + "%" : "GH₵" + Math.round(activeCoupon.discount_value)} Off ${activeCoupon.description || "Your Purchase"}`}{" "}
                </h2>{" "}
                <p className="text-white/80 text-base md:text-lg mb-6">
                  {" "}
                  {activeCoupon.ai_message?.split("\n")[1] ||
                    `Use code ${activeCoupon.code} at checkout`}{" "}
                </p>{" "}
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-4 bg-white text-primary-500 px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300 text-sm md:text-base shadow-xl animate-bounce"
                >
                  {" "}
                  Shop Now <FiArrowRight className="animate-pulse" />{" "}
                </Link>{" "}
              </div>{" "}
              <div className="hidden md:block">
                {" "}
                <img
                  src={IMAGES.trending.small}
                  alt="Promo"
                  className="w-80 h-80 object-cover rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 hover:scale-110 transition-all duration-500 animate-pulse"
                />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </section>
      )}{" "}
      {/* New Arrivals */}{" "}
      <section className="py-16 bg-gray-50 dark:bg-secondary-500">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
            {" "}
            {/* New Arrivals Card */}{" "}
            <div className="relative h-80 rounded-xl md:rounded-2xl overflow-hidden group">
              {" "}
              <img
                src={IMAGES.trending.large1}
                alt="New Arrivals"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />{" "}
              <div className="absolute inset-0 bg-black/40"></div>{" "}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-3 md:p-8">
                {" "}
                <p className="text-[10px] md:text-sm uppercase tracking-widest mb-1 md:mb-2">
                  {" "}
                  Just Arrived{" "}
                </p>{" "}
                <h3 className="text-sm md:text-3xl font-bold mb-2 md:mb-4">
                  {" "}
                  New Arrivals{" "}
                </h3>{" "}
                <Link
                  to="/shop?sort=newest"
                  className="px-3 py-1.5 md:px-6 md:py-3 text-xs md:text-base border-2 border-white rounded-full font-medium hover:bg-white hover:text-gray-900 transition-colors"
                >
                  {" "}
                  Explore Now{" "}
                </Link>{" "}
              </div>{" "}
            </div>{" "}
            {/* Best Sellers Card */}{" "}
            <div className="relative h-80 rounded-xl md:rounded-2xl overflow-hidden group">
              {" "}
              <img
                src={IMAGES.trending.large2}
                alt="Best Sellers"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />{" "}
              <div className="absolute inset-0 bg-black/40"></div>{" "}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-3 md:p-8">
                {" "}
                <p className="text-[10px] md:text-sm uppercase tracking-widest mb-1 md:mb-2">
                  {" "}
                  Top Rated{" "}
                </p>{" "}
                <h3 className="text-sm md:text-3xl font-bold mb-2 md:mb-4">
                  {" "}
                  Best Sellers{" "}
                </h3>{" "}
                <Link
                  to="/shop?sort=rating"
                  className="px-3 py-1.5 md:px-6 md:py-3 text-xs md:text-base border-2 border-white rounded-full font-medium hover:bg-white hover:text-gray-900 transition-colors"
                >
                  {" "}
                  Shop Now{" "}
                </Link>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Testimonials */}{" "}
      {!testimonialsLoading && testimonials.length > 0 && (
        <section className="py-16">
          {" "}
          <div className="container mx-auto px-4">
            {" "}
            <div className="text-center mb-12">
              {" "}
              <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800 dark:text-gold-light mb-4">
                {" "}
                What Our Customers Say{" "}
              </h2>{" "}
              <p className="text-gray-600 dark:text-gold">
                {" "}
                Real reviews from real customers{" "}
              </p>{" "}
            </div>{" "}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-4">
              {" "}
              {testimonials.slice(0, 4).map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white dark:bg-surface p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100"
                >
                  {" "}
                  <div className="hidden md:flex gap-0.5 mb-3">
                    {" "}
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span
                        key={`${testimonial.id}-star-${i}`}
                        className="text-yellow-400 text-sm"
                      >
                        {" "}
                        ★{" "}
                      </span>
                    ))}{" "}
                  </div>{" "}
                  <p className="text-gray-600 dark:text-gold text-xs md:text-sm mb-4 italic line-clamp-3">
                    {" "}
                    "{testimonial.comment || testimonial.title}"{" "}
                  </p>{" "}
                  <div className="flex items-center gap-4 md:gap-3">
                    {" "}
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                      {" "}
                      {testimonial.user?.firstName?.[0] || "C"}{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h4 className="font-semibold text-gray-800 dark:text-gold-light text-xs md:text-sm line-clamp-1">
                        {" "}
                        {testimonial.user
                          ? `${testimonial.user.firstName} ${testimonial.user.lastName}`
                          : "Happy Customer"}{" "}
                      </h4>{" "}
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-primary-300">
                        {" "}
                        {testimonial.isVerifiedPurchase
                          ? "Verified Buyer"
                          : "Customer"}{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>{" "}
        </section>
      )}{" "}
      {/* Instagram Feed Placeholder */}{" "}
      <section className="py-16 bg-gray-50">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <div className="text-center mb-12">
            {" "}
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800 mb-4">
              {" "}
              Follow Us on Instagram{" "}
            </h2>{" "}
            <p className="text-gray-600">@thefashiongallery</p>{" "}
          </div>{" "}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {" "}
            {IMAGES.instagram.map((img, index) => (
              <a
                key={`instagram-${index}`}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`aspect-square rounded-xl overflow-hidden group ${index >= 4 ? "hidden md:block" : ""}`}
              >
                {" "}
                <img
                  src={img}
                  alt={`Instagram ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />{" "}
              </a>
            ))}{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
    </div>
  );
};
export default Home;
