import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiX } from "react-icons/fi";
import { useAnnouncements } from "../../context/AnnouncementsContext";

const AnnouncementPopup = () => {
  const { unseen, markSeen, activeAnnouncement, closeAnnouncement } = useAnnouncements();
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Wait for announcements to load, then build the queue once
  useEffect(() => {
    if (!initialized && unseen.length > 0) {
      setQueue(unseen);
      setInitialized(true);
    }
  }, [unseen, initialized]);

  // Show next in queue when current is cleared (only when no manually opened one)
  useEffect(() => {
    if (!current && queue.length > 0 && !activeAnnouncement) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue, activeAnnouncement]);

  const isManual = !!activeAnnouncement;
  const displayed = activeAnnouncement || current;

  const handleClose = () => {
    if (isManual) {
      closeAnnouncement();
    } else {
      if (current) markSeen(current.id); // persist — won't auto-popup again on refresh
      setCurrent(null);
    }
  };

  if (!displayed) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        {/* Backdrop — non-interactive */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close announcement"
          >
            <FiX size={20} />
          </button>

          {/* Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
              <FiBell className="text-primary-600 dark:text-primary-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                Announcement
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {displayed.title}
              </h3>
              {displayed.createdAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(displayed.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {displayed.message}
          </p>

          {/* Queue indicator */}
          {queue.length > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              +{queue.length} more announcement{queue.length > 1 ? "s" : ""}
            </p>
          )}

          {/* Action button */}
          <button
            onClick={handleClose}
            className="mt-5 w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
          >
            Got it
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AnnouncementPopup;
