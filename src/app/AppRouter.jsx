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
import { CatalogPage } from "../features/catalog/CatalogPage";
import { PublicBookPage } from "../features/catalog/PublicBookPage";
import { AppLayout, PublicLayout } from "../features/shell/layouts";
import { HomePage } from "../features/shell/HomePage";
import { MyReportsPage } from "../features/profile/MyReportsPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { SecurityPage } from "../features/profile/SecurityPage";
import { UpdatesPage } from "../features/profile/UpdatesPage";
import { NotFoundPage } from "../pages/NotFoundPage";

const appPlaceholderRoutes = [
  {
    path: "my-books",
    title: "My Books",
    summary: "Create, edit, archive, and review the books you own.",
    checks: [
      "Page should call GET /book/user with pagination.",
      "Next slice will add create, edit, and delete flows.",
      "Book cards already have version data for optimistic locking."
    ]
  },
  {
    path: "my-books/new",
    title: "Create Book",
    summary: "Form for POST /book/user, including gift mode and contact details.",
    checks: [
      "Owner-facing book creation UI will live here.",
      "The backend contract is ready for photoBase64 and contactDetails."
    ]
  },
  {
    path: "my-books/exchanged",
    title: "Exchanged Books",
    summary: "Read-only list of books already exchanged by the current user.",
    checks: [
      "This page will use GET /book/history.",
      "Version fields are already available in returned books."
    ]
  },
  {
    path: "exchanges/requests",
    title: "My Requests",
    summary: "Outgoing exchange requests sent by the current user.",
    checks: [
      "Next slice will use GET /request and PATCH /request/{exchangeId}/decline.",
      "Request rows already include version for direct actions."
    ]
  },
  {
    path: "exchanges/requests/:exchangeId",
    title: "Request Details",
    summary: "Detailed view of a sent exchange request.",
    checks: [
      "This screen will use GET /request/{exchangeId}.",
      "Opening it should clear unread state server-side when relevant."
    ]
  },
  {
    path: "exchanges/offers",
    title: "My Offers",
    summary: "Incoming exchange offers that the current user can approve or decline.",
    checks: [
      "Next slice will use GET /offer and mutation endpoints for approve/decline.",
      "Offer rows already include version for inline decisions."
    ]
  },
  {
    path: "exchanges/offers/:exchangeId",
    title: "Offer Details",
    summary: "Detailed view of an incoming offer with full book payloads.",
    checks: [
      "This screen will use GET /offer/{exchangeId}.",
      "The backend now exposes otherUserId for stable navigation and reporting."
    ]
  },
  {
    path: "history",
    title: "Exchange History",
    summary: "Timeline of completed or resolved exchanges.",
    checks: [
      "Next slice will use GET /history with pagination.",
      "History rows already return version and read state."
    ]
  },
  {
    path: "history/:exchangeId",
    title: "History Details",
    summary: "Exchange detail page with contact details and role-aware context.",
    checks: [
      "This screen will use GET /history/{exchangeId}.",
      "otherUserId is already available for stable links."
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
