// ============================================
// PricingLink.jsx - "View Pricing" call to action
//
// Pricing is public, so this always links to /pricing (also for signed-out
// visitors and members waiting for approval).
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingLink({ className = 'strategy-btn strategy-btn-primary', children = 'View Pricing' }) {
  return <Link to="/pricing" className={className}>{children}</Link>;
}
