import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin, RequireAuth } from "../shared/auth/RouteGuards";
import { FeaturePlaceholderPage } from "../shared/ui/FeaturePlaceholderPage";
import {
  DeleteAccountTokenPage,
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResendConfirmationPage,
  ResetPasswordPage,
  VerifyEmailPage
} from "../features/auth/pages";
import {
  CreateBookPage,
  EditBookPage,
  ExchangedBooksPage,
  MyBookDetailsPage,
  MyBooksPage
} from "../features/books/pages";
import { CatalogPage } from "../features/catalog/CatalogPage";
import { PublicBookPage } from "../features/catalog/PublicBookPage";
import {
  HistoryDetailsPage,
  HistoryPage,
  OfferDetailsPage,
  OffersPage,
  RequestDetailsPage,
  RequestsPage
} from "../features/exchanges/pages";
import { AdminBookDetailsPage, AdminBooksPage } from "../features/admin/books/pages";
import { AdminReportDetailsPage, AdminReportsPage } from "../features/admin/reports/pages";
import { AdminUserDetailsPage, AdminUsersPage } from "../features/admin/users/pages";
import { AppLayout, PublicLayout } from "../features/shell/layouts";
import { HomePage } from "../features/shell/HomePage";
import { MyReportsPage } from "../features/profile/MyReportsPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { SecurityPage } from "../features/profile/SecurityPage";
import { UpdatesPage } from "../features/profile/UpdatesPage";
import { NotFoundPage } from "../pages/NotFoundPage";

const appPlaceholderRoutes = [
  {
    path: "exchange-center",
    title: "Exchange Center",
    summary: "Requests, offers, and history are now implemented in the current slice.",
    checks: [
      "Use the sidebar links to open requests, offers, and history.",
      "Public book pages now support creating requests from your own books."
    ]
  }
];

const adminPlaceholderRoutes = [
  {
    path: "exchanges",
    title: "Admin Exchanges",
    summary: "Operational overview of exchange states and related books/users.",
    checks: [
      "This screen will use GET /admin/exchanges.",
      "Metadata already exposes exchangeStatuses."
    ]
  },
  {
    path: "exchanges/:exchangeId",
    title: "Admin Exchange Details",
    summary: "Detailed moderation or audit view of a single exchange.",
    checks: [
      "This screen will use GET /admin/exchanges/{exchangeId}.",
      "The response already contains sender/receiver books and users."
    ]
  }
];

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="book/:bookId" element={<PublicBookPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="resend-confirmation" element={<ResendConfirmationPage />} />
        <Route path="delete-account-confirm" element={<DeleteAccountTokenPage />} />
      </Route>

      <Route
        path="app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate replace to="profile" />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="updates" element={<UpdatesPage />} />
        <Route path="my-reports" element={<MyReportsPage />} />
        <Route path="my-books" element={<MyBooksPage />} />
        <Route path="my-books/new" element={<CreateBookPage />} />
        <Route path="my-books/exchanged" element={<ExchangedBooksPage />} />
        <Route path="my-books/:bookId" element={<MyBookDetailsPage />} />
        <Route path="my-books/:bookId/edit" element={<EditBookPage />} />
        <Route path="exchanges/requests" element={<RequestsPage />} />
        <Route path="exchanges/requests/:exchangeId" element={<RequestDetailsPage />} />
        <Route path="exchanges/offers" element={<OffersPage />} />
        <Route path="exchanges/offers/:exchangeId" element={<OfferDetailsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="history/:exchangeId" element={<HistoryDetailsPage />} />
        {appPlaceholderRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <FeaturePlaceholderPage
                title={route.title}
                summary={route.summary}
                checks={route.checks}
              />
            }
          />
        ))}
      </Route>

      <Route
        path="admin"
        element={
          <RequireAdmin>
            <AppLayout adminMode />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate replace to="users" />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:userId" element={<AdminUserDetailsPage />} />
        <Route path="books" element={<AdminBooksPage />} />
        <Route path="books/:bookId" element={<AdminBookDetailsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="reports/:reportId" element={<AdminReportDetailsPage />} />
        {adminPlaceholderRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <FeaturePlaceholderPage
                title={route.title}
                summary={route.summary}
                checks={route.checks}
              />
            }
          />
        ))}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
