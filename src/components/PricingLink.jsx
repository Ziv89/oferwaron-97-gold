// ============================================
// PricingLink.jsx - "View Pricing" call to action
//
// Pricing is for approved members only, so the button adapts:
//   approved member -> View Pricing (/pricing)
//   signed out      -> Register (opens the register form)
//   pending member  -> nothing (My Account shows the approval status)
// ============================================
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PricingLink({ className = 'strategy-btn strategy-btn-primary', children = 'View Pricing' }) {
  const { user, isApproved } = useAuth();

  if (user && isApproved) {
    return <Link to="/pricing" className={className}>{children}</Link>;
  }

  if (!user) {
    return (
      <Link to="/login" state={{ mode: 'register' }} className="strategy-btn strategy-btn-mint">
        Register
      </Link>
    );
  }

  return null;
}
