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
    path: "users",
    title: "Admin Users",
    summary: "Moderation view over user accounts, bans, roles, and soft-deleted users.",
    checks: [
      "This screen will use GET /admin/users with filters from metadata.",
      "List rows already contain version and role data."
    ]
  },
  {
    path: "users/:userId",
    title: "Admin User Details",
    summary: "Detail screen for ban, unban, delete, and role-management actions.",
    checks: [
      "This screen will use GET /admin/users/{userId}.",
      "Mutations already rely on If-Match and version."
    ]
  },
  {
    path: "books",
    title: "Admin Books",
    summary: "Review active and deleted books, with moderation filters.",
    checks: [
      "This screen will use GET /admin/books/search.",
      "Metadata now exposes bookTypes and bookSortFields."
    ]
  },
  {
    path: "books/:bookId",
    title: "Admin Book Details",
    summary: "Restore, update, or soft-delete specific books.",
    checks: [
      "This screen will use GET /admin/books/{bookId}.",
      "ETag and version are already present."
    ]
  },
  {
    path: "reports",
    title: "Admin Reports",
    summary: "Moderation queue for open, resolved, and rejected reports.",
    checks: [
      "This screen will use GET /admin/reports.",
      "Metadata already exposes reportStatuses."
    ]
  },
  {
    path: "reports/:reportId",
    title: "Admin Report Details",
    summary: "Resolve or reject specific reports with optimistic locking.",
    checks: [
      "This screen will use GET /admin/reports/{reportId}.",
      "Mutations already accept If-Match."
    ]
  },
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
