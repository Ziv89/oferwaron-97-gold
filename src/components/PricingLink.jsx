// ============================================
// PricingLink.jsx - "View Pricing" call to action
//
// Always links to /pricing. Pricing is members-only, so the route sends
// signed-out visitors to Member Login and members waiting for approval to
// My Account.
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingLink({ className = 'strategy-btn strategy-btn-primary', children = 'View Pricing' }) {
  return <Link to="/pricing" className={className}>{children}</Link>;
}
