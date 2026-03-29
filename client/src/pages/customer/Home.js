"use client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeaturedProducts } from "../../redux/slices/productSlice";
import ProductCard from "../../components/customer/ProductCard";
import IMAGES from "../../config/images";
import { FiTruck, FiShield, FiHeadphones, FiArrowRight } from "react-icons/fi";
import api from "../../utils/api";
const Home = () => {
  const dispatch = useDispatch();
  const shouldReduceMotion = useReducedMotion();
  const { featuredProducts, loading } = useSelector((state) => state.products);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [categoryImageIndexes, setCategoryImageIndexes] = useState({
    Men: 0,
    Women: 0,
  });
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
  const categories = useMemo(
    () => [
      {
        name: "Men",
        images: IMAGES.categorySlides?.men || [IMAGES.categories.men],
        path: "/shop/men",
      },
      {
        name: "Women",
        images: IMAGES.categorySlides?.women || [IMAGES.categories.women],
        path: "/shop/women",
      },
      {
        name: "Perfumes",
        images: IMAGES.categorySlides?.perfumes || [IMAGES.categories.perfumes],
        path: "/shop/perfumes",
      },
    ],
    [],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCategoryImageIndexes((prev) => {
        const nextIndexes = { ...prev };
        categories.forEach((category) => {
          const totalImages = category.images.length;
          if (totalImages > 1) {
            nextIndexes[category.name] =
              ((prev[category.name] || 0) + 1) % totalImages;
          }
        });
        return nextIndexes;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [categories]);
  const features = [
    { icon: FiTruck, title: "Free Shipping", desc: "On orders over GH₵1,000" },
    { icon: FiShield, title: "Secure Payment", desc: "100% secure checkout" },
    { icon: FiHeadphones, title: "24/7 Support", desc: "Dedicated support" },
  ];
  return (
    <div className="min-h-screen">
      {" "}
      {/* Hero Section */}{" "}
      <section className="relative min-h-[440px] sm:min-h-[620px] overflow-hidden bg-[#111111]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(250,204,21,0.18),transparent_40%),radial-gradient(circle_at_84%_20%,rgba(234,179,8,0.16),transparent_36%),linear-gradient(120deg,#111111_0%,#181818_52%,#252525_100%)]"></div>
        <div className="absolute inset-0">
          <img
            src={IMAGES.hero.main}
            alt="Hero"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent"></div>
        <div className="relative container mx-auto px-4 py-12 sm:py-16 min-h-[440px] sm:min-h-[620px] flex items-center">
          <div className="max-w-2xl text-white animate-reveal">
            <span className="inline-flex items-center rounded-full border border-amber-300/35 bg-amber-200/10 px-3 py-1 text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-amber-200 mb-4">
              New Collection 2026
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Discover Your
              <span className="block text-amber-200">Perfect Style</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/80 mb-7 leading-relaxed max-w-xl">
              Explore our latest collection of premium clothing and signature
              fragrances curated for your modern lifestyle.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-3 sm:px-7 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base hover:bg-amber-100 transition-colors"
              >
                Shop Now <FiArrowRight />
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center border border-white/35 bg-white/[0.04] text-white/90 px-5 py-3 sm:px-7 sm:py-3.5 rounded-full font-medium text-sm sm:text-base hover:bg-white/10 transition-colors"
              >
                View Collection
              </Link>
            </div>
          </div>
        </div>
      </section>{" "}
      {/* Features Bar (centered) */}{" "}
      <section className="relative py-8 bg-[#111111] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(250,204,21,0.1),transparent_35%),radial-gradient(circle_at_88%_82%,rgba(234,179,8,0.08),transparent_40%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto motion-safe-stagger">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-3 sm:p-4 text-center"
                style={{ "--reveal-delay": `${index * 90}ms` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-amber-200/10 border border-amber-200/30 flex items-center justify-center mb-3">
                  <feature.icon className="text-amber-200" size={18} />
                </div>
                <h4 className="font-semibold text-[13px] sm:text-base text-white leading-tight">
                  {feature.title}
                </h4>
                <p className="text-[10px] sm:text-sm text-white/65 mt-1">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>{" "}
      {/* Categories */}{" "}
      <section className="py-10 bg-gray-50 dark:bg-secondary-500">
        {" "}
        <div className="container mx-auto px-4">
          {" "}
          <div className="text-center mb-5">
            {" "}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gold-light mb-4">
              {" "}
              Shop by Category{" "}
            </h2>{" "}
            <p className="text-gray-600 dark:text-gold max-w-2xl mx-auto">
              {" "}
              Browse our wide selection of fashion and perfumes{" "}
            </p>{" "}
          </div>{" "}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto motion-safe-stagger">
            {" "}
            {categories.map((category, index) => (
              <Link
                key={category.name}
                href={category.path}
                className="group relative h-40 sm:h-80 rounded-2xl overflow-hidden card-hover"
                style={{ "--reveal-delay": `${index * 120}ms` }}
              >
                <div className="absolute inset-0">
                  {category.images.map((image, index) => {
                    const activeIndex =
                      (categoryImageIndexes[category.name] ?? 0) %
                      category.images.length;
                    const isActive = index === activeIndex;
                    return (
                      <img
                        key={`${category.name}-${index}`}
                        src={image}
                        alt={category.name}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out group-hover:scale-110 ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>{" "}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
                  {" "}
                  <h3 className="text-sm sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">
                    {" "}
                    {category.name}{" "}
                  </h3>{" "}
                  <span className="text-white/80 text-xs sm:text-base flex items-center gap-2 sm:gap-4 group-hover:text-primary-400 transition-colors">
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
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gold-light mb-2">
                {" "}
                Featured Products{" "}
              </h2>{" "}
              <p className="text-gray-600 dark:text-gold">
                {" "}
                Handpicked favorites just for you{" "}
              </p>{" "}
            </div>{" "}
            <Link
              href="/shop?featured=true"
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
                <div
                  key={`skeleton-${i}`}
                  className="animate-pulse h-40 sm:h-80 rounded-2xl overflow-hidden bg-gray-200"
                >
                  <div className="w-full h-full" />
                </div>
              ))}{" "}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {" "}
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  className="h-40 sm:h-80 rounded-2xl"
                  imageWrapperClassName="flex-1 min-h-0"
                  infoOverlay
                />
              ))}{" "}
            </div>
          )}{" "}
          <div className="text-center mt-8 md:hidden">
            {" "}
            <Link
              href="/shop"
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
        <section className="py-10 sm:py-12 md:py-16 bg-gray-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,214,102,0.22),transparent_42%),radial-gradient(circle_at_84%_22%,rgba(250,204,21,0.18),transparent_38%),linear-gradient(120deg,#121212_0%,#191919_48%,#242424_100%)]"></div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgba(250, 204, 21, 0.15)",
              }}
              className="ios-glass-card rounded-2xl sm:rounded-3xl border border-white/15 bg-white/[0.06] p-4 sm:p-8 md:p-10"
            >
              <div className="ios-sheen" />
              <motion.div
                animate={
                  shouldReduceMotion
                    ? { y: 0, rotate: 0 }
                    : { y: [0, -3, 0], rotate: [0, 0.12, 0] }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 5.2, repeat: Infinity, ease: "easeInOut" }
                }
                className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-5 sm:gap-8 lg:gap-10 items-center"
              >
                <div className="text-center lg:text-left">
                  <motion.span
                    animate={
                      shouldReduceMotion
                        ? { scale: 1, opacity: 1 }
                        : { scale: 1, opacity: [0.92, 1, 0.92] }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                    }
                    className="inline-flex items-center rounded-full border border-amber-300/35 bg-amber-200/10 px-3 py-1 text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-amber-200 mb-3 sm:mb-4"
                  >
                    Limited Time Offer
                  </motion.span>
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    {activeCoupon.ai_message
                      ?.split("\n")[0]
                      ?.replace(/(\d+)\.\d+%/g, "$1%")
                      .replace(/GH₵(\d+)\.\d+/g, "GH₵$1") ||
                      `Get ${activeCoupon.discount_type === "percentage" ? Math.round(activeCoupon.discount_value) + "%" : "GH₵" + Math.round(activeCoupon.discount_value)} Off ${activeCoupon.description || "Your Purchase"}`}
                  </h2>
                  <p className="mt-2.5 sm:mt-4 text-sm sm:text-base text-white/75 max-w-xl mx-auto lg:mx-0">
                    {activeCoupon.ai_message?.split("\n")[1] ||
                      `Use code ${activeCoupon.code} at checkout`}
                  </p>
                  <motion.div
                    animate={
                      shouldReduceMotion
                        ? { x: 0 }
                        : { x: [0, 6, 0], opacity: [0.95, 1, 0.95] }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
                    }
                    className="mt-3.5 sm:mt-5 inline-flex items-center rounded-xl border border-white/20 bg-white/[0.08] px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]"
                  >
                    <span className="text-[11px] sm:text-xs uppercase tracking-[0.12em] text-white/60 mr-3">
                      Code
                    </span>
                    <span className="text-lg sm:text-lg font-semibold text-amber-200 leading-none">
                      {activeCoupon.code}
                    </span>
                  </motion.div>
                  <div className="mt-2 sm:mt-4" />
                </div>

                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative hidden lg:block"
                >
                  <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-amber-300/20 to-transparent blur-xl"></div>
                  <div className="relative rounded-2xl overflow-hidden border border-white/15">
                    <img
                      src={IMAGES.trending.small}
                      alt="Promotion"
                      className="w-full h-72 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"></div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}{" "}
      {/* New Arrivals */}{" "}
      <section className="py-16 bg-[#111111] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_26%,rgba(250,204,21,0.12),transparent_42%),radial-gradient(circle_at_82%_74%,rgba(234,179,8,0.1),transparent_40%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Trending Highlights
            </h2>
            <p className="text-white/70 mt-2 text-sm sm:text-base">
              Fresh picks and top-rated styles curated for you
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto motion-safe-stagger">
            <div
              className="relative h-40 sm:h-80 rounded-2xl overflow-hidden group card-hover"
              style={{ "--reveal-delay": "0ms" }}
            >
              <img
                src={IMAGES.trending.large1}
                alt="New Arrivals"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
              <div className="absolute inset-0 flex flex-col justify-end text-white p-3 sm:p-6">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-amber-200 mb-2">
                  Just Arrived
                </p>
                <h3 className="text-sm sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4">
                  New Arrivals
                </h3>
                <Link
                  href="/shop?sort=newest"
                  className="inline-flex w-fit items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm rounded-full bg-white text-gray-900 font-semibold hover:bg-amber-100 transition-colors"
                >
                  Explore Now <FiArrowRight />
                </Link>
              </div>
            </div>
            <div
              className="relative h-40 sm:h-80 rounded-2xl overflow-hidden group card-hover"
              style={{ "--reveal-delay": "130ms" }}
            >
              <img
                src={IMAGES.trending.large2}
                alt="Best Sellers"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
              <div className="absolute inset-0 flex flex-col justify-end text-white p-3 sm:p-6">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-amber-200 mb-2">
                  Top Rated
                </p>
                <h3 className="text-sm sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4">
                  Best Sellers
                </h3>
                <Link
                  href="/shop?sort=rating"
                  className="inline-flex w-fit items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm rounded-full bg-white text-gray-900 font-semibold hover:bg-amber-100 transition-colors"
                >
                  Shop Now <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>{" "}
      {/* Testimonials */}{" "}
      {!testimonialsLoading && testimonials.length > 0 && (
        <section className="py-16 bg-[#111111] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.1),transparent_40%),radial-gradient(circle_at_82%_90%,rgba(234,179,8,0.08),transparent_42%)]"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                What Our Customers Say
              </h2>
              <p className="text-white/70 text-sm sm:text-base">
                Trusted feedback from verified shoppers
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 motion-safe-stagger">
              {testimonials.slice(0, 4).map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-4 md:p-5"
                  style={{ "--reveal-delay": `${index * 100}ms` }}
                >
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span
                        key={`${testimonial.id}-star-${i}`}
                        className="text-amber-300 text-xs md:text-sm"
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-white/75 text-xs md:text-sm mb-4 italic line-clamp-3 min-h-[60px]">
                    "{testimonial.comment || testimonial.title}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-200/15 border border-amber-200/30 flex items-center justify-center text-amber-200 font-bold text-xs md:text-sm">
                      {testimonial.user?.firstName?.[0] || "C"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-xs md:text-sm line-clamp-1">
                        {testimonial.user
                          ? `${testimonial.user.firstName} ${testimonial.user.lastName}`
                          : "Happy Customer"}
                      </h4>
                      <p className="text-[10px] md:text-xs text-white/55">
                        {testimonial.isVerifiedPurchase
                          ? "Verified Buyer"
                          : "Customer"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}{" "}
      {/* Instagram Feed Placeholder */}{" "}
      <section className="py-16 bg-[#111111] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(250,204,21,0.1),transparent_36%),radial-gradient(circle_at_86%_84%,rgba(234,179,8,0.08),transparent_40%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <span className="inline-flex items-center rounded-full border border-amber-300/35 bg-amber-200/10 px-3 py-1 text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-amber-200 mb-4">
              Social Edit
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              Follow Us on Instagram
            </h2>
            <a
              href="https://www.instagram.com/diamondauragallery/?hl=it"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-white/75 hover:text-amber-200 transition-colors text-sm sm:text-base"
            >
              @diamondauragallery
            </a>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 motion-safe-stagger">
              {IMAGES.instagram.map((img, index) => (
                <a
                  key={`instagram-${index}`}
                  href="https://www.instagram.com/diamondauragallery/?hl=it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`aspect-square rounded-xl overflow-hidden group relative ${index >= 4 ? "hidden md:block" : ""}`}
                  style={{ "--reveal-delay": `${index * 70}ms` }}
                >
                  <img
                    src={img}
                    alt={`Instagram ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                </a>
              ))}
            </div>
            <div className="mt-6 text-center">
              <a
                href="https://www.instagram.com/diamondauragallery/?hl=it"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-amber-100 transition-colors"
              >
                View Instagram <FiArrowRight />
              </a>
            </div>
          </div>
        </div>
      </section>{" "}
    </div>
  );
};
export default Home;
