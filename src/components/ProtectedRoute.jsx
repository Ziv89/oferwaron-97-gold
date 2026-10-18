// ============================================
// ProtectedRoute.jsx - route guard
//
// requireActive=false -> just needs to be signed in
// requireActive=true  -> needs a live subscription
//
// This only controls what renders. The data itself is protected by the
// Firestore rules, which is the gate that actually matters.
// ============================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireActive = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="strategy-page">
        <section className="strategy-section text-center">
          <p className="strategy-subtitle">Loading…</p>
        </section>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Temporary access rule: any signed-in member can access protected pages
  // while activation is handled manually. Logged-out users remain blocked.
  return children;
}
