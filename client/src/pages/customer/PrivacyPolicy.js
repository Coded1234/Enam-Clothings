import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-16 font-sans">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-surface rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Effective date: January 25, 2026
          </p>

          <section className="space-y-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200 bg-transparent p-0 font-sans">{`Privacy Policy

Effective date: January 25, 2026

1. Introduction

Enam's Clothings ("we", "our", "us") values your privacy. This Privacy Policy explains what personal data we collect, why we collect it, how we use it, and your rights. It applies to visitors and customers who use our website and services at enam-s-clothings (the "Service").

2. Information We Collect

- Personal information you provide: name, email address, phone number, billing and shipping addresses, payment information (tokenized via payment provider), and account credentials when you register or place orders.
- Order and transactional data: order history, items purchased, coupons used, shipping details, and communication history with customer support.
- Technical and usage data: IP address, device and browser information, pages visited, referring URLs, and analytics data collected via cookies and similar technologies.
- Communications: messages you send us (contact forms, chat, email), and marketing preferences.

3. How We Collect Data

We collect data you provide directly (forms, account registration, checkout), data from third-party services you use to interact with us (payment processors, shipping partners), and automatically via cookies and analytics tools when you use our site.

4. Use of Personal Data

We use personal data to:
- Process and fulfill orders, manage billing, and provide customer support.
- Communicate order updates, offers, and marketing (where you have consented).
- Improve and personalize the shopping experience, analyze trends, and secure our systems.
- Comply with legal obligations and prevent fraud.

5. Sharing and Disclosure

We may share your data with:
- Service providers that perform services on our behalf (payment processors, shipping carriers, email providers, analytics providers).
- Law enforcement or government authorities where required by law.
- Third parties in connection with a business transaction (merger, acquisition), with notice to users.

6. Cookies and Tracking

We use cookies and similar technologies to enable site functionality, remember preferences, and collect analytics. For more detail, see our Cookie Policy: COOKIE_POLICY.md

7. Data Retention

We retain personal data as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. When no longer required, data is securely deleted or anonymized.

8. Security

We implement reasonable administrative, physical, and technical safeguards to protect personal data. However, no method of transmission or storage is 100% secure. If a breach occurs we will follow applicable law to notify affected individuals and authorities.

9. Your Rights

Depending on your jurisdiction, you may have rights to access, correct, update, delete, or restrict processing of your personal data. You may also object to marketing communications. To exercise these rights, contact us at the address below.

10. Children

Our Service is not intended for children under 13. We do not knowingly collect personal data from children under 13. If we learn we have collected data from a child without parental consent, we will delete it.

11. International Transfers

Personal data may be processed in countries outside your jurisdiction. We take steps to ensure an adequate level of protection consistent with this policy and applicable law.

12. Changes to This Policy

We may update this Privacy Policy. We will post the revised policy with an updated effective date and, where required by law, notify you.

13. Contact

If you have questions or requests about this policy or your personal data, contact us:

support@enamsclothings.com


---

Note: This is a concise, general-purpose privacy policy suitable for an e-commerce site. Consider reviewing with legal counsel to ensure compliance with local laws (GDPR, CCPA, etc.).`}</pre>
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

export default PrivacyPolicy;
