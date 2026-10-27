// ============================================
// ProtectedRoute.jsx - route guard
//
// requireApproved=false -> just needs to be signed in
// requireApproved=true  -> also needs the owner's approval of the
//                          registration (otherwise sent to /members)
// requireActive is currently not enforced (see below)
//
// This only controls what renders. The data itself is protected by the
// Firestore rules, which is the gate that actually matters.
// ============================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireApproved = false }) {
  const { user, isApproved, loading } = useAuth();
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

  // Registered but not approved (pending or rejected): My Account only
  if (requireApproved && !isApproved) {
    return <Navigate to="/members" replace />;
  }

  // Temporary access rule: any approved member can access protected pages
  // while activation is handled manually. Logged-out users remain blocked.
  return children;
}
