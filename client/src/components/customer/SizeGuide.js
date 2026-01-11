import React from "react";
import { FiX } from "react-icons/fi";

const SizeGuide = ({ isOpen, onClose, category }) => {
  if (!isOpen) return null;

  const sizeCharts = {
    men: {
      title: "Men's Size Guide",
      headers: ["Size", "Chest (cm)", "Waist (cm)", "Hip (cm)"],
      rows: [
        ["XS", "86-91", "71-76", "86-91"],
        ["S", "91-96", "76-81", "91-96"],
        ["M", "96-101", "81-86", "96-101"],
        ["L", "101-106", "86-91", "101-106"],
        ["XL", "106-111", "91-96", "106-111"],
        ["XXL", "111-116", "96-101", "111-116"],
      ],
      pants: {
        headers: ["Size", "Waist (cm)", "Hip (cm)", "Inseam (cm)"],
        rows: [
          ["28", "71-73", "89-91", "76"],
          ["30", "76-78", "94-96", "76"],
          ["32", "81-83", "99-101", "81"],
          ["34", "86-88", "104-106", "81"],
          ["36", "91-93", "109-111", "81"],
          ["38", "96-98", "114-116", "81"],
        ],
      },
    },
    women: {
      title: "Women's Size Guide",
      headers: ["Size", "Bust (cm)", "Waist (cm)", "Hip (cm)"],
      rows: [
        ["XS", "78-82", "60-64", "86-90"],
        ["S", "82-86", "64-68", "90-94"],
        ["M", "86-90", "68-72", "94-98"],
        ["L", "90-94", "72-76", "98-102"],
        ["XL", "94-98", "76-80", "102-106"],
        ["XXL", "98-102", "80-84", "106-110"],
      ],
      dresses: {
        headers: ["Size", "UK", "US", "EU"],
        rows: [
          ["XS", "6", "2", "34"],
          ["S", "8", "4", "36"],
          ["M", "10", "6", "38"],
          ["L", "12", "8", "40"],
          ["XL", "14", "10", "42"],
          ["XXL", "16", "12", "44"],
        ],
      },
    },
    kids: {
      title: "Kids' Size Guide",
      headers: ["Size", "Age", "Height (cm)", "Chest (cm)", "Waist (cm)"],
      rows: [
        ["2-3Y", "2-3 yrs", "92-98", "52-54", "50-51"],
        ["3-4Y", "3-4 yrs", "98-104", "54-56", "51-52"],
        ["4-5Y", "4-5 yrs", "104-110", "56-58", "52-53"],
        ["5-6Y", "5-6 yrs", "110-116", "58-60", "53-54"],
        ["6-7Y", "6-7 yrs", "116-122", "60-62", "54-55"],
        ["7-8Y", "7-8 yrs", "122-128", "62-64", "55-56"],
        ["8-9Y", "8-9 yrs", "128-134", "64-66", "56-57"],
        ["9-10Y", "9-10 yrs", "134-140", "66-68", "57-58"],
      ],
    },
  };

  const currentChart = sizeCharts[category] || sizeCharts.men;

  const renderTable = (headers, rows) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left font-semibold text-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`px-4 py-3 ${
                    cellIndex === 0
                      ? "font-medium text-gray-800"
                      : "text-gray-600"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              {currentChart.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* How to Measure */}
            <div className="mb-6 p-4 bg-primary-50 rounded-xl">
              <h3 className="font-semibold text-primary-700 mb-2">
                How to Measure
              </h3>
              <ul className="text-sm text-primary-600 space-y-1">
                <li>
                  • <strong>Chest/Bust:</strong> Measure around the fullest part
                  of your chest
                </li>
                <li>
                  • <strong>Waist:</strong> Measure around your natural
                  waistline
                </li>
                <li>
                  • <strong>Hip:</strong> Measure around the fullest part of
                  your hips
                </li>
              </ul>
            </div>

            {/* Main Size Chart */}
            {currentChart.headers && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  General Sizing
                </h3>
                {renderTable(currentChart.headers, currentChart.rows)}
              </div>
            )}

            {/* Additional Charts (for men/women) */}
            {currentChart.pants && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Pants & Trousers
                </h3>
                {renderTable(
                  currentChart.pants.headers,
                  currentChart.pants.rows
                )}
              </div>
            )}

            {currentChart.dresses && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  International Size Conversion
                </h3>
                {renderTable(
                  currentChart.dresses.headers,
                  currentChart.dresses.rows
                )}
              </div>
            )}

            {/* Tips */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-700 mb-2">Sizing Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • If you're between sizes, we recommend sizing up for a more
                  comfortable fit
                </li>
                <li>
                  • Sizes may vary slightly between different styles and brands
                </li>
                <li>
                  • For fitted items, consider your preferred fit (relaxed vs.
                  slim)
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuide;
