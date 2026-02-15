import React from "react";
import { Link } from "react-router-dom";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--bg)] py-16 font-sans">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-surface rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gold-light mb-4">
            Cookie Policy
          </h1>
          <p className="text-gray-600 dark:text-gold mb-4">
            Effective date: January 25, 2026
          </p>

          <section className="space-y-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gold-light bg-transparent p-0 font-sans">{`Cookie Policy

Effective date: January 25, 2026

1. Introduction

This Cookie Policy explains how The Fashion Gallery ("we", "us", "our") uses cookies and similar tracking technologies on our website.

2. What are Cookies

Cookies are small text files placed on your device when you visit a website. They help the site remember your actions and preferences.

3. Types of Cookies We Use

- Essential Cookies: Required for basic site functionality (shopping cart, login sessions).
- Performance & Analytics Cookies: Help us understand how visitors use the site so we can improve performance.
- Functional Cookies: Remember preferences such as language or display settings.
- Advertising Cookies: Used by third parties to deliver relevant ads.

4. How We Use Cookies

We use cookies to enable essential functionality, personalize content, analyze site usage, and support advertising.

5. Third-Party Cookies

We may allow third-party services (analytics, payment processors, advertising networks) to place cookies. These third parties have their own cookie policies.

6. Managing Cookies

You can control or delete cookies using your browser settings. Disabling certain cookies may affect site functionality.

7. Changes to This Policy

We may update this Cookie Policy from time to time. We will post changes with a revised effective date.

8. Contact

For questions about our Cookie Policy, contact support@thefashiongallery.com

---

This policy is a general template. Consult legal counsel to ensure compliance with local privacy and cookie laws.`}</pre>
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

export default CookiePolicy;
