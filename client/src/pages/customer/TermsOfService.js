import React from "react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-16 font-sans">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-surface rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Effective date: January 25, 2026
          </p>

          <section className="space-y-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200 bg-transparent p-0 font-sans">{`Terms of Service

Effective date: January 25, 2026

1. Agreement to Terms

These Terms of Service ("Terms") govern your access to and use of Enam's Clothings website and services. By using our website, placing orders, or creating an account, you agree to these Terms.

2. Eligibility

You must be at least 13 years old to use our Service. By using the Service you represent that you are of legal age to form a binding contract.

3. Account Registration

When you create an account you agree to provide accurate information and keep your credentials secure. You are responsible for activity that occurs under your account.

4. Orders and Payment

- All orders are subject to product availability and confirmation of payment.
- Prices shown are in GHS and exclude applicable taxes and shipping unless indicated.
- Payments are processed by third-party payment processors; we do not store raw card numbers.

5. Shipping and Delivery

Shipping options, costs, and delivery estimates are shown at checkout. Free shipping may apply for qualifying orders as described on the site.

6. Returns and Refunds

Our returns policy is outlined separately (Returns & Refunds). Items must meet the return criteria to be eligible for refund or exchange.

7. Intellectual Property

All site content (text, images, logos, and designs) is the property of Enam's Clothings or its licensors. You may not reproduce or use our content without permission.

8. User Conduct

You agree not to use the Service for unlawful activities or to upload harmful content. We may suspend or terminate accounts that violate these Terms.

9. Limitation of Liability

To the maximum extent permitted by law, Enam's Clothings is not liable for indirect, incidental, or consequential damages arising from your use of the Service. Our aggregate liability for direct damages is limited to the amount paid by you for the order that gave rise to the claim.

10. Indemnification

You agree to indemnify and hold harmless Enam's Clothings and its affiliates from claims arising out of your violation of these Terms or your misuse of the Service.

11. Governing Law

These Terms are governed by the laws of the jurisdiction in which the company operates. Disputes will be resolved in the appropriate courts unless otherwise required.

12. Changes to Terms

We may revise these Terms. Continued use after changes indicates acceptance. We will post updates with the revised effective date.

13. Contact

If you have questions about these Terms, contact us at support@enamsclothings.com


---

Note: This is a general-purpose template. Please review with legal counsel to ensure compliance with applicable consumer and e-commerce laws in your markets.`}</pre>
          </section>

          <div className="mt-6">
            <Link to="/" className="text-primary-500 hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
