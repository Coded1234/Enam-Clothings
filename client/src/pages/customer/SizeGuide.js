import React, { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const SizeGuidePage = () => {
  const [activeCategory, setActiveCategory] = useState("men");

  const categories = [
    { id: "men", name: "Men's Clothing" },
    { id: "women", name: "Women's Clothing" },
    { id: "kids", name: "Kids' Clothing" },
  ];

  const sizeCharts = {
    men: {
      title: "Men's Size Guide",
      sections: [
        {
          name: "Tops & Shirts",
          headers: [
            "Size",
            "Chest (cm)",
            "Waist (cm)",
            "Hip (cm)",
            "Neck (cm)",
          ],
          rows: [
            ["XS", "86-91", "71-76", "86-91", "35-36"],
            ["S", "91-96", "76-81", "91-96", "37-38"],
            ["M", "96-101", "81-86", "96-101", "39-40"],
            ["L", "101-106", "86-91", "101-106", "41-42"],
            ["XL", "106-111", "91-96", "106-111", "43-44"],
            ["XXL", "111-116", "96-101", "111-116", "45-46"],
          ],
        },
        {
          name: "Pants & Trousers",
          headers: ["Size", "Waist (cm)", "Hip (cm)", "Inseam (cm)"],
          rows: [
            ["28", "71-73", "89-91", "76"],
            ["30", "76-78", "94-96", "76"],
            ["32", "81-83", "99-101", "81"],
            ["34", "86-88", "104-106", "81"],
            ["36", "91-93", "109-111", "81"],
            ["38", "96-98", "114-116", "81"],
            ["40", "101-103", "119-121", "81"],
          ],
        },
        {
          name: "Suits & Jackets",
          headers: ["Size", "Chest (cm)", "Shoulder (cm)", "Sleeve (cm)"],
          rows: [
            ["36", "91-94", "43", "61"],
            ["38", "96-99", "44", "62"],
            ["40", "101-104", "46", "63"],
            ["42", "106-109", "47", "64"],
            ["44", "111-114", "48", "65"],
            ["46", "116-119", "50", "66"],
          ],
        },
      ],
    },
    women: {
      title: "Women's Size Guide",
      sections: [
        {
          name: "Tops & Blouses",
          headers: ["Size", "UK", "US", "EU", "Bust (cm)", "Waist (cm)"],
          rows: [
            ["XS", "6", "2", "34", "78-82", "60-64"],
            ["S", "8", "4", "36", "82-86", "64-68"],
            ["M", "10", "6", "38", "86-90", "68-72"],
            ["L", "12", "8", "40", "90-94", "72-76"],
            ["XL", "14", "10", "42", "94-98", "76-80"],
            ["XXL", "16", "12", "44", "98-102", "80-84"],
          ],
        },
        {
          name: "Dresses & Skirts",
          headers: ["Size", "UK", "US", "EU", "Hip (cm)", "Length"],
          rows: [
            ["XS", "6", "2", "34", "86-90", "Petite/Regular/Tall"],
            ["S", "8", "4", "36", "90-94", "Petite/Regular/Tall"],
            ["M", "10", "6", "38", "94-98", "Petite/Regular/Tall"],
            ["L", "12", "8", "40", "98-102", "Petite/Regular/Tall"],
            ["XL", "14", "10", "42", "102-106", "Petite/Regular/Tall"],
            ["XXL", "16", "12", "44", "106-110", "Petite/Regular/Tall"],
          ],
        },
        {
          name: "Pants & Jeans",
          headers: ["Size", "Waist (cm)", "Hip (cm)", "Inseam (cm)"],
          rows: [
            ["24", "60-62", "84-86", "76"],
            ["26", "64-66", "88-90", "76"],
            ["28", "68-70", "92-94", "79"],
            ["30", "72-74", "96-98", "79"],
            ["32", "76-78", "100-102", "81"],
            ["34", "80-82", "104-106", "81"],
          ],
        },
      ],
    },
    kids: {
      title: "Kids' Size Guide",
      sections: [
        {
          name: "Toddlers (2-6 years)",
          headers: ["Size", "Age", "Height (cm)", "Chest (cm)", "Waist (cm)"],
          rows: [
            ["2-3Y", "2-3 yrs", "92-98", "52-54", "50-51"],
            ["3-4Y", "3-4 yrs", "98-104", "54-56", "51-52"],
            ["4-5Y", "4-5 yrs", "104-110", "56-58", "52-53"],
            ["5-6Y", "5-6 yrs", "110-116", "58-60", "53-54"],
          ],
        },
        {
          name: "Kids (6-12 years)",
          headers: ["Size", "Age", "Height (cm)", "Chest (cm)", "Waist (cm)"],
          rows: [
            ["6-7Y", "6-7 yrs", "116-122", "60-62", "54-55"],
            ["7-8Y", "7-8 yrs", "122-128", "62-64", "55-56"],
            ["8-9Y", "8-9 yrs", "128-134", "64-66", "56-57"],
            ["9-10Y", "9-10 yrs", "134-140", "66-68", "57-58"],
            ["10-11Y", "10-11 yrs", "140-146", "68-70", "58-60"],
            ["11-12Y", "11-12 yrs", "146-152", "70-72", "60-62"],
          ],
        },
        {
          name: "Teens (12+ years)",
          headers: ["Size", "Age", "Height (cm)", "Chest (cm)", "Waist (cm)"],
          rows: [
            ["12-13Y", "12-13 yrs", "152-158", "72-76", "62-64"],
            ["13-14Y", "13-14 yrs", "158-164", "76-80", "64-66"],
            ["14-15Y", "14-15 yrs", "164-170", "80-84", "66-68"],
            ["15-16Y", "15-16 yrs", "170-176", "84-88", "68-70"],
          ],
        },
      ],
    },
  };

  const renderTable = (headers, rows) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
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
                  className={`px-4 py-3 whitespace-nowrap ${
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

  const currentChart = sizeCharts[activeCategory];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Size Guide</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find your perfect fit with our comprehensive size charts. Measure
            yourself and compare to our guides for the best fit.
          </p>
        </div>

        {/* How to Measure */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">How to Measure</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-xl p-4">
                <h3 className="font-semibold mb-2">Chest / Bust</h3>
                <p className="text-sm text-primary-100">
                  Measure around the fullest part of your chest, keeping the
                  tape horizontal.
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <h3 className="font-semibold mb-2">Waist</h3>
                <p className="text-sm text-primary-100">
                  Measure around your natural waistline, keeping the tape
                  comfortably loose.
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <h3 className="font-semibold mb-2">Hip</h3>
                <p className="text-sm text-primary-100">
                  Measure around the fullest part of your hips, about 20cm below
                  your waist.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeCategory === category.id
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Size Charts */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {currentChart.title}
          </h2>

          <div className="space-y-8">
            {currentChart.sections.map((section, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">
                    {section.name}
                  </h3>
                </div>
                <div className="p-4">
                  {renderTable(section.headers, section.rows)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Sizing Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Between Sizes?
                </h3>
                <p className="text-gray-600 text-sm">
                  If you're between sizes, we recommend sizing up for a more
                  comfortable fit, especially for outerwear and jackets.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Fitted vs. Relaxed
                </h3>
                <p className="text-gray-600 text-sm">
                  Consider your preferred fit. For a more relaxed fit, size up.
                  For a fitted look, stick with your measured size.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  Brand Variations
                </h3>
                <p className="text-gray-600 text-sm">
                  Sizes may vary slightly between different brands and styles.
                  Check individual product descriptions for specific fit
                  information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Need Help?</h3>
                <p className="text-gray-600 text-sm">
                  Contact our customer service team for personalized sizing
                  advice. We're happy to help you find your perfect fit!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuidePage;
