import React from 'react';
import { Navigate } from 'react-router-dom';
import BrandedLoading from '../BrandedLoading';

export default function AdminRouteGuard({ user, profile, lang, children }) {
  if (user === undefined || profile === undefined) {
    return <BrandedLoading lang={lang} tone="app" fullscreen />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
