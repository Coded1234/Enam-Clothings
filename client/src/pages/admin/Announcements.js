import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiBell, FiCheck, FiX } from "react-icons/fi";
import { announcementsAPI } from "../../utils/api";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ title: "", message: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data } = await announcementsAPI.getAll();
      setAnnouncements(data.announcements || []);
    } catch {
      showNotif("error", "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const showNotif = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ title: "", message: "", isActive: true });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setFormData({ title: a.title, message: a.message, isActive: a.isActive });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) return;
    try {
      setSaving(true);
      if (editing) {
        await announcementsAPI.update(editing.id, formData);
        showNotif("success", "Announcement updated");
      } else {
        await announcementsAPI.create(formData);
        showNotif("success", "Announcement created and sent to users");
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch {
      showNotif("error", "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await announcementsAPI.delete(id);
      showNotif("success", "Announcement deleted");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      showNotif("error", "Failed to delete announcement");
    }
  };

  const toggleActive = async (a) => {
    try {
      await announcementsAPI.update(a.id, { isActive: !a.isActive });
      setAnnouncements((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, isActive: !x.isActive } : x))
      );
    } catch {
      showNotif("error", "Failed to update status");
    }
  };

  return (
    <div className="p-6">
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FiBell size={24} className="text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Send notices that pop up for all users on their next visit
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          <FiPlus size={18} />
          New Announcement
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FiBell size={40} className="mx-auto mb-3 opacity-30" />
          <p>No announcements yet. Create one to notify your users.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-surface rounded-xl border border-gray-200 dark:border-primary-700 p-5 flex items-start gap-4"
            >
              {/* Status dot */}
              <div
                className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                  a.isActive ? "bg-green-500" : "bg-gray-300"
                }`}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {a.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line">
                  {a.message}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(a.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(a)}
                  title={a.isActive ? "Deactivate" : "Activate"}
                  className={`p-2 rounded-lg transition-colors ${
                    a.isActive
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <FiCheck size={16} />
                </button>
                <button
                  onClick={() => openEdit(a)}
                  className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                  title="Edit"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title="Delete"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editing ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Important Update"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-primary-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Write your announcement here..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-primary-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:text-white resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-primary-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Active (visible to users immediately)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-primary-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-opacity-10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
