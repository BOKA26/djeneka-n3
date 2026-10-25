/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ScrollToTop } from './components/common/ScrollToTop';
import { PublicLayout } from './layouts/PublicLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public pages
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { PartsPage } from './pages/PartsPage';
import { RentalsPage } from './pages/RentalsPage';
import { RentalDetailPage } from './pages/RentalDetailPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { GalleryPage } from './pages/GalleryPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { LegalPage } from './pages/LegalPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Private Spaces
import { ClientDashboardPage } from './pages/client/ClientDashboardPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/pieces" element={<PartsPage />} />
              <Route path="/location" element={<RentalsPage />} />
              <Route path="/location/:id" element={<RentalDetailPage />} />
              <Route path="/depannage" element={<EmergencyPage />} />
              <Route path="/galerie" element={<GalleryPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/avis" element={<ReviewsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/a-propos" element={<AboutPage />} />
              <Route path="/mentions-legales" element={<LegalPage />} />
              <Route path="/conditions-location" element={<LegalPage />} />
              <Route path="/confidentialite" element={<LegalPage />} />
              <Route path="/connexion" element={<LoginPage />} />
              <Route path="/inscription" element={<RegisterPage />} />
              <Route
                path="/espace-client"
                element={
                  <ProtectedRoute allowedRoles={['client', 'mecanicien', 'admin']}>
                    <ClientDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/espace-admin"
                element={
                  <ProtectedRoute allowedRoles={['mecanicien', 'admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              {/* Catch-all redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
