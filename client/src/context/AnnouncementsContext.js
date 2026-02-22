import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { announcementsAPI } from "../utils/api";

const STORAGE_KEY = "dismissed_announcements";
const SEEN_KEY = "seen_announcements";

const AnnouncementsContext = createContext(null);

export const AnnouncementsProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  const [seen, setSeen] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
    } catch {
      return [];
    }
  });

  const markSeen = (id) => {
    setSeen((prev) => {
      const updated = [...new Set([...prev, id])];
      localStorage.setItem(SEEN_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await announcementsAPI.getActive();
      setAnnouncements(data.announcements || []);
    } catch {
      // silent — don't block the site if announcements fail to load
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const dismissOne = (id) => {
    setDismissed((prev) => {
      const updated = [...new Set([...prev, id])];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const dismissAll = () => {
    setDismissed((prev) => {
      const allIds = announcements.map((a) => a.id);
      const updated = [...new Set([...prev, ...allIds])];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const unread = announcements.filter((a) => !dismissed.includes(a.id));
  // unseen = unread items that haven't been acknowledged in the auto-popup yet
  const unseen = unread.filter((a) => !seen.includes(a.id));

  const openAnnouncement = (ann) => setActiveAnnouncement(ann);
  const closeAnnouncement = () => setActiveAnnouncement(null);

  return (
    <AnnouncementsContext.Provider
      value={{ announcements, unread, unreadCount: unread.length, dismissOne, dismissAll, activeAnnouncement, openAnnouncement, closeAnnouncement, unseen, markSeen }}
    >
      {children}
    </AnnouncementsContext.Provider>
  );
};

export const useAnnouncements = () => {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) throw new Error("useAnnouncements must be used inside AnnouncementsProvider");
  return ctx;
};
