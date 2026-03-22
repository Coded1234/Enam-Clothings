"use client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  FiArrowLeft,
  FiPackage,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiCheck,
  FiPrinter,
} from "react-icons/fi";
import { ordersAPI, adminAPI } from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const OrderDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingReturn, setUpdatingReturn] = useState(false);

  const isPerfumeItem = (item) => {
    const category =
      item?.product?.category || item?.productCategory || item?.category;
    return String(category || "").toLowerCase() === "perfumes";
  };

  const statuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-GH", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handlePrint = () => {
    if (!order) return;
    const addr = order.shippingAddress || {};
    const orderNum =
      order.orderNumber || `#${(order.id || "").slice(-8).toUpperCase()}`;
    const placedDate = formatDate(order.createdAt);
    const placedTime = formatTime(order.createdAt);
    const items = order.items || order.orderItems || [];
    const subtotal = parseFloat(order.subtotal ?? order.itemsPrice ?? 0) || 0;
    const shippingFee =
      parseFloat(order.shippingFee ?? order.shippingCost ?? 0) || 0;
    const tax = parseFloat(order.taxPrice ?? order.tax ?? 0) || 0;
    const discount = parseFloat(order.discount ?? 0) || 0;
    const total = parseFloat(order.totalAmount ?? order.totalPrice ?? 0) || 0;
    const paymentMethod = order.paymentMethod;
    const isPaid = (order.paymentStatus || "") === "paid";

    const itemRows = items
      .map((item) => {
        const name = item.productName || item.product?.name || "—";
        const showVariants = !isPerfumeItem(item);
        const size = showVariants && item.size ? `Size: ${item.size}` : "";
        const colorName =
          typeof item.color === "object" ? item.color?.name : item.color;
        const color = showVariants && colorName ? `Color: ${colorName}` : "";
        const meta = [size, color].filter(Boolean).join(" · ");
        const qty = item.quantity || 1;
        const unit = parseFloat(item.price ?? 0) || 0;
        const line = unit * qty;
        return `<tr>
        <td>${name}${meta ? `<br/><small style="color:#888">${meta}</small>` : ""}</td>
        <td style="text-align:center">${qty}</td>
        <td style="text-align:right">GH₵${unit.toFixed(2)}</td>
        <td style="text-align:right">GH₵${line.toFixed(2)}</td>
      </tr>`;
      })
      .join("");

    const payLabel = paymentMethod === "cod" ? "Pay on Delivery" : "Paystack";
    const logoUrl = `${window.location.origin}/images/loginlogo.png`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Delivery Receipt – ${orderNum}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Open Sans', sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px 40px; max-width: 720px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 20px; }
    .brand img { height: 48px; width: auto; object-fit: contain; display: block; }
    .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .receipt-label { text-align: right; }
    .receipt-label h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
    .receipt-label p { font-size: 11px; color: #666; margin-top: 2px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; }
    .meta-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; font-weight: 600; }
    .meta-box p { font-size: 13px; line-height: 1.6; color: #111; }
    .meta-box .highlight { font-weight: 700; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #111; color: #fff; }
    thead th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    thead th:not(:first-child) { text-align: center; }
    thead th:last-child { text-align: right; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 10px 12px; vertical-align: top; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .totals { width: 280px; margin-left: auto; margin-bottom: 24px; }
    .totals tr td { padding: 5px 0; font-size: 13px; }
    .totals tr td:last-child { text-align: right; font-weight: 600; }
    .totals .total-row td { border-top: 2px solid #111; padding-top: 10px; font-size: 16px; font-weight: 700; }
    .discount-row td { color: #16a34a; }
    .barcode-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 8px; }
    .order-id-box { font-family: monospace; font-size: 15px; font-weight: 700; letter-spacing: 2px; color: #111; }
    .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
    .watermark { position: fixed; pointer-events: none; z-index: 0; }
    .watermark img { width: 200px; height: auto; filter: grayscale(100%); opacity: 0.58; }
    .wm-top { top: 10%; left: 10%; transform: rotate(-20deg); }
    .wm-top-right { top: 10%; right: 10%; transform: rotate(20deg); }
    .wm-center { top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-20deg); }
    .wm-bottom-left { bottom: 10%; left: 10%; transform: rotate(20deg); }
    .wm-bottom { bottom: 10%; right: 10%; transform: rotate(-20deg); }
    @media print { body { padding: 16px 20px; } .no-print { display: none; } .watermark { position: fixed; } }
  </style>
</head>
<body>
  <div class="watermark wm-top"><img src="${logoUrl}" alt="" /></div>
  <div class="watermark wm-top-right"><img src="${logoUrl}" alt="" /></div>
  <div class="watermark wm-center"><img src="${logoUrl}" alt="" /></div>
  <div class="watermark wm-bottom-left"><img src="${logoUrl}" alt="" /></div>
  <div class="watermark wm-bottom"><img src="${logoUrl}" alt="" /></div>
  <div class="header">
    <div class="brand">
      <img src="${logoUrl}" alt="Diamond Aura Gallery" />
      <div class="brand-sub">Premium Fashion &amp; Clothing · Accra, Ghana</div>
    </div>
    <div class="receipt-label">
      <h2>Delivery Receipt</h2>
      <p>${placedDate}</p>
      <p>${placedTime}</p>
    </div>
  </div>
  <div class="meta-grid">
    <div class="meta-box">
      <h4>Order Details</h4>
      <p class="highlight">${orderNum}</p>
      <p style="margin-top:6px">Payment: ${payLabel}</p>
      <p style="margin-top:4px">Status: <strong>${isPaid ? "PAID" : "PENDING"}</strong></p>
    </div>
    <div class="meta-box">
      <h4>Deliver To</h4>
      <p class="highlight">${addr.firstName || ""} ${addr.lastName || ""}</p>
      <p>${addr.address || ""}</p>
      ${addr.addressDetails ? `<p>${addr.addressDetails}</p>` : ""}
      <p>${addr.city || ""}${addr.country ? `, ${addr.country}` : ""}</p>
      ${addr.phone ? `<p>📞 ${addr.phone}</p>` : ""}
      ${addr.email ? `<p>✉ ${addr.email}</p>` : ""}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <table class="totals">
    <tr><td>Subtotal</td><td>GH₵${subtotal.toFixed(2)}</td></tr>
    <tr><td>Shipping</td><td>${shippingFee === 0 ? "FREE" : `GH₵${shippingFee.toFixed(2)}`}</td></tr>
    ${discount > 0 ? `<tr class="discount-row"><td>Discount</td><td>-GH₵${discount.toFixed(2)}</td></tr>` : ""}
    ${tax > 0 ? `<tr><td>Tax</td><td>GH₵${tax.toFixed(2)}</td></tr>` : ""}
    <tr class="total-row"><td>TOTAL</td><td>GH₵${total.toFixed(2)}</td></tr>
  </table>
  <div class="barcode-row">
    <div>
      <div class="order-id-box">${orderNum}</div>
      <div style="font-size:10px;color:#9ca3af;margin-top:4px">Scan or quote this ID for enquiries</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#6b7280">
      <p>Items: ${items.length} &nbsp;·&nbsp; Qty: ${items.reduce((s, i) => s + (i.quantity || 1), 0)}</p>
      <p>Printed: ${new Date().toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" })}</p>
    </div>
  </div>
  <div class="footer">
    <span>Diamond Aura Gallery · Accra, Ghana</span>
    <span>Thank you for your order!</span>
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=780,height=900");
    win.document.write(html);
    win.document.close();
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data } = await ordersAPI.getById(id);
      setOrder(data);
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await adminAPI.updateOrderStatus(id, { status: newStatus });
      setOrder({ ...order, status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReturnApprovalChange = async (newStatus) => {
    try {
      setUpdatingReturn(true);
      await adminAPI.updateReturnApproval(id, {
        returnApprovalStatus: newStatus,
      });
      setOrder((prev) => ({
        ...prev,
        returnApprovalStatus: newStatus,
      }));
    } catch (err) {
      console.error("Failed to update return approval:", err);
      alert("Failed to update return approval status");
    } finally {
      setUpdatingReturn(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusStep = (status) => {
    const steps = ["pending", "confirmed", "shipped", "delivered"];
    return steps.indexOf(status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <Link
          href="/admin/orders"
          className="text-primary-600 hover:text-primary-700 mt-4 inline-block"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/orders")}
            className="p-2 md:p-2.5 hover:bg-gray-100 rounded-xl border border-transparent hover:border-gray-200 transition-all bg-white shadow-sm"
          >
            <FiArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-sm transition-all"
          >
            <FiPrinter size={16} />
            <span className="hidden sm:inline">Print</span>
          </button>
          <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm text-gray-500 font-medium pl-2">Status:</span>
            {order.status === "delivered" || order.status === "cancelled" ? (
              <span
                className={`px-3 py-1 text-sm font-medium rounded-lg border ${getStatusColor(
                  order.status,
                )}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            ) : (
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className={`px-3 py-1 text-sm font-medium rounded-lg border cursor-pointer appearance-none ${getStatusColor(
                  order.status,
                )}`}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {order.returnRequestedAt && (
            <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-sm text-gray-500 font-medium pl-2">Return:</span>
              <select
                value={order.returnApprovalStatus || "pending"}
                onChange={(e) => handleReturnApprovalChange(e.target.value)}
                disabled={updatingReturn || order.returnApprovalStatus === "approved" || order.returnApprovalStatus === "not_approved"}
                className={`px-3 py-1 text-sm font-medium rounded-lg border appearance-none ${order.returnApprovalStatus === 'approved' || order.returnApprovalStatus === 'not_approved' ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : 'cursor-pointer bg-white text-gray-800 border-gray-200'}`}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="not_approved">Not approved</option>
              </select>
              {updatingReturn && <LoadingSpinner size="small" />}
            </div>
          )}
        </div>
      </div>

      {/* Status Locked Message */}
      {(order.status === "delivered" || order.status === "cancelled") && (
        <div
          className={`${
            order.status === "delivered"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          } border rounded-lg p-3 flex items-center gap-2 text-sm`}
        >
          <FiCheck
            className={
              order.status === "delivered" ? "text-green-600" : "text-red-600"
            }
          />
          <span>
            {order.status === "delivered"
              ? "This order has been delivered."
              : "This order has been cancelled."}
          </span>
        </div>
      )}

      {/* Order Progress */}
      {order.status !== "cancelled" && (
        <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-gray-800 mb-4 md:mb-6">
            Order Progress
          </h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${(getStatusStep(order.status) / 3) * 100}%` }}
              />
            </div>
            {["pending", "confirmed", "shipped", "delivered"].map(
              (step, index) => {
                const isCompleted = getStatusStep(order.status) >= index;
                const isCurrent = order.status === step;
                return (
                  <div
                    key={step}
                    className="relative flex flex-col items-center"
                  >
                    <div
                      className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center z-10 transition-colors ${
                        isCompleted
                          ? "bg-primary-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      } ${isCurrent ? "ring-4 ring-primary-100" : ""}`}
                    >
                      {isCompleted ? (
                        <FiCheck size={16} />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium capitalize ${
                        isCompleted ? "text-primary-600" : "text-gray-500"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 bg-white rounded-lg md:rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b">
            <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
              <FiPackage size={18} className="md:w-5 md:h-5" />
              Order Items
            </h2>
          </div>
          <div className="divide-y">
            {(order.items || order.orderItems)?.map((item) => (
              <div key={item.id} className="p-3 md:p-6 flex gap-3 md:gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.productImage || item.product?.images?.[0] ? (
                    <img
                      src={getImageUrl(
                        item.productImage || item.product?.images?.[0],
                      )}
                      alt={item.productName || item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPackage className="text-gray-400" size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 text-sm md:text-base">
                    {item.productName || item.product?.name || "Product"}
                  </h3>
                  <div className="text-xs md:text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    {!isPerfumeItem(item) && item.size && (
                      <span>Size: {item.size}</span>
                    )}
                    {!isPerfumeItem(item) && item.size && item.color && (
                      <span>•</span>
                    )}
                    {!isPerfumeItem(item) &&
                      item.color &&
                      (() => {
                        const colorName =
                          typeof item.color === "object"
                            ? item.color.name
                            : item.color;
                        const colorCode = item.color?.code;
                        if (!colorName && !colorCode) return null;
                        return (
                          <span className="flex items-center gap-1">
                            Color:
                            {colorCode && (
                              <span
                                className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                style={{ backgroundColor: colorCode }}
                              />
                            )}
                            {colorName && <span>{colorName}</span>}
                          </span>
                        );
                      })()}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </span>
                    <span className="font-medium text-gray-800">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 md:p-6 bg-gray-50 space-y-2 md:space-y-3">
            <div className="flex justify-between text-sm md:text-base text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal || order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base text-gray-600">
              <span>Shipping</span>
              <span>
                {formatCurrency(order.shippingFee || order.shippingCost || 0)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm md:text-base text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg md:text-xl font-bold text-gray-900 pt-3 md:pt-4 border-t mt-3">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Info */}
        <div className="space-y-4 md:space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4">
              <FiUser size={18} className="md:w-5 md:h-5" />
              Customer
            </h2>
            <div className="space-y-2 md:space-y-3">
              <p className="font-medium text-gray-900 text-sm md:text-base">
                {order.user?.firstName} {order.user?.lastName}
              </p>
              <div className="flex flex-col gap-1 text-gray-500 text-sm">
                <p>{order.user?.email}</p>
                <p>{order.user?.phone}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4">
              <FiMapPin size={18} className="md:w-5 md:h-5 text-gray-400" />
              Shipping Address
            </h2>
            <div className="space-y-2 text-gray-500 text-sm">
              <p className="text-gray-900 font-medium">{order.shippingAddress?.address}</p>
              {order.shippingAddress?.addressDetails && (
                <p>
                  {order.shippingAddress.addressDetails}
                </p>
              )}
              {order.shippingAddress?.phone && (
                <p>Phone: {order.shippingAddress?.phone}</p>
              )}
              {order.shippingAddress?.email && (
                <p>Email: {order.shippingAddress?.email}</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2 mb-3 md:mb-4">
              <FiCreditCard size={18} className="md:w-5 md:h-5 text-gray-400" />
              Payment
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900">
                  {order.paymentMethod === "cod"
                    ? "Pay on Delivery"
                    : "Paystack"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="text-gray-500">Status</span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.paymentStatus || "pending"}
                </span>
              </div>
              {order.paymentReference && (
                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono text-gray-900">
                    {order.paymentReference}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
