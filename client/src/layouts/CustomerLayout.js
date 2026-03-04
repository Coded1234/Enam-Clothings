"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/customer/Navbar";
import Footer from "../components/customer/Footer";
import ScrollToTop from "../components/common/ScrollToTop";
import NewsletterPopup from "../components/customer/NewsletterPopup";
import AnnouncementPopup from "../components/customer/AnnouncementPopup";
import { AnnouncementsProvider } from "../context/AnnouncementsContext";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const CustomerLayout = ({ children }) => {
  const pathname = usePathname();

  return (
    <AnnouncementsProvider>
      <div className="flex flex-col min-h-screen">
        <ScrollToTop />
        <Navbar />
        <NewsletterPopup />
        <AnnouncementPopup />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </AnnouncementsProvider>
  );
};

export default CustomerLayout;
