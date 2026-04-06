import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { trimFormPayload } from "../../shared/lib/format";
import { ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const nextPath = location.state?.from?.pathname || "/app/profile";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, navigate, nextPath]);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await login(trimFormPayload(form));
      navigate(nextPath, { replace: true });
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPanel
      eyebrow="Sign in"
      title="Connect the frontend to your live backend"
      description="This page uses your real /auth/login endpoint and stores access plus refresh tokens locally."
      footer={
        <p className="muted-line">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      }
    >
      <form className="content-stack" onSubmit={handleSubmit}>
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
          required
        />

        {error ? <InlineError error={error} /> : null}

        <button className="button" disabled={pending} type="submit">
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="auth-links">
        <Link to="/forgot-password">Forgot password</Link>
        <Link to="/resend-confirmation">Resend confirmation email</Link>
      </div>
    </AuthPanel>
  );
}

export function RegisterPage() {
  const metadataQuery = useMetadataQuery();
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    locale: "en"
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const locale = metadataQuery.data?.locales?.[0];

    if (locale) {
      setForm((current) => ({ ...current, locale: current.locale || locale }));
    }
  }, [metadataQuery.data]);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: trimFormPayload(form)
      });

      setSuccessMessage(
        response.message ||
          "Account created. Check your email and confirm the registration before logging in."
      );
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPanel
      eyebrow="Register"
      title="Create a testable account for the frontend"
      description="This screen maps to your real registration contract, including locale selection from /metadata."
      footer={
        <p className="muted-line">
          Already registered? <Link to="/login">Go to login</Link>
        </p>
      }
    >
      {metadataQuery.isPending ? <LoadingBlock label="Loading locales" /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title="Metadata could not be loaded" />
      ) : null}

      <form className="content-stack" onSubmit={handleSubmit}>
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          required
        />
        <Field
          label="Nickname"
          name="nickname"
          value={form.nickname}
          onChange={(value) => setForm((current) => ({ ...current, nickname: value }))}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
          required
        />
        <SelectField
          label="Locale"
          name="locale"
          value={form.locale}
          options={metadataQuery.data?.locales ?? ["en"]}
          onChange={(value) => setForm((current) => ({ ...current, locale: value }))}
        />

        {successMessage ? <InlineSuccess message={successMessage} /> : null}
        {error ? <InlineError error={error} /> : null}

        <button className="button" disabled={pending || metadataQuery.isPending} type="submit">
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthPanel>
  );
}

export function ForgotPasswordPage() {
  return (
    <EmailActionPage
      eyebrow="Recovery"
      title="Send reset instructions"
      description="Calls /auth/forgot_password and lets you validate the recovery email flow from the frontend."
      endpoint="/auth/forgot_password"
      buttonLabel="Send instructions"
      successFallback="If the account exists, password reset instructions have been sent."
    />
  );
}

export function ResendConfirmationPage() {
  return (
    <EmailActionPage
      eyebrow="Verification"
      title="Resend confirmation email"
      description="Calls /auth/resend_confirmation_email and is useful while testing unconfirmed-account behavior."
      endpoint="/auth/resend_confirmation_email"
      buttonLabel="Resend email"
      successFallback="A new email confirmation message has been sent."
    />
  );
}

export function VerifyEmailPage() {
  return (
    <TokenActionPage
      eyebrow="Verify"
      title="Confirm email address"
      description="This page reads the token from the URL and calls /auth/verify."
      endpointBuilder={(token) => `/auth/verify?token=${encodeURIComponent(token)}`}
      method="GET"
      autoRun
      buttonLabel="Verify email"
      successFallback="Email verification completed."
    />
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [form, setForm] = useState({ newPassword: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setError(new Error("Reset token is missing from the URL."));
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest(
        `/auth/reset_password?token=${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          body: trimFormPayload(form)
        }
      );

      setSuccessMessage(response.message || "Your password has been changed.");
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPanel
      eyebrow="Reset"
      title="Choose a new password"
      description="This page consumes the reset token from the email link and calls /auth/reset_password."
      footer={
        <p className="muted-line">
          Ready after reset? <Link to="/login">Back to login</Link>
        </p>
      }
    >
      <form className="content-stack" onSubmit={handleSubmit}>
        <Field
          label="New password"
          name="newPassword"
          type="password"
          value={form.newPassword}
          onChange={(value) => setForm({ newPassword: value })}
          required
        />

        {!token ? (
          <InlineError error={{ message: "Reset token was not found in the URL." }} />
        ) : null}
        {successMessage ? <InlineSuccess message={successMessage} /> : null}
        {error ? <InlineError error={error} /> : null}

        <button className="button" disabled={pending || !token} type="submit">
          {pending ? "Resetting password..." : "Reset password"}
        </button>
      </form>
    </AuthPanel>
  );
}

export function DeleteAccountTokenPage() {
  return (
    <TokenActionPage
      eyebrow="Delete"
      title="Confirm account deletion"
      description="This screen is meant for the email-driven delete flow and calls /auth/delete_account."
      endpointBuilder={(token) => `/auth/delete_account?token=${encodeURIComponent(token)}`}
      method="PATCH"
      buttonLabel="Delete account"
      successFallback="The account has been deleted."
      destructive
    />
  );
}

function EmailActionPage({
  eyebrow,
  title,
  description,
  endpoint,
  buttonLabel,
  successFallback
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest(endpoint, {
        method: "PATCH",
        body: trimFormPayload({ email })
      });

      setSuccessMessage(response.message || successFallback);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPanel eyebrow={eyebrow} title={title} description={description}>
      <form className="content-stack" onSubmit={handleSubmit}>
        <Field
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />

        {successMessage ? <InlineSuccess message={successMessage} /> : null}
        {error ? <InlineError error={error} /> : null}

        <button className="button" disabled={pending} type="submit">
          {pending ? "Sending..." : buttonLabel}
        </button>
      </form>
    </AuthPanel>
  );
}

function TokenActionPage({
  eyebrow,
  title,
  description,
  endpointBuilder,
  method,
  autoRun = false,
  buttonLabel,
  successFallback,
  destructive = false
}) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const hasAutoRun = useRef(false);

  const tokenStatus = useMemo(() => {
    if (!token) {
      return "missing";
    }

    return "present";
  }, [token]);

  useEffect(() => {
    if (!autoRun || tokenStatus !== "present" || hasAutoRun.current) {
      return;
    }

    hasAutoRun.current = true;
    void handleRequest();
  });

  async function handleRequest() {
    if (!token) {
      setError(new Error("Token is missing from the URL."));
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await apiRequest(endpointBuilder(token), { method });
      setSuccessMessage(response.message || successFallback);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPanel eyebrow={eyebrow} title={title} description={description}>
      <div className="content-stack">
        <div className="token-box">
          <span className="token-label">Token</span>
          <code>{token || "Missing token"}</code>
        </div>

        {successMessage ? <InlineSuccess message={successMessage} /> : null}
        {error ? <InlineError error={error} /> : null}
        {tokenStatus === "missing" ? (
          <InlineError error={{ message: "Token was not found in the URL." }} />
        ) : null}

        <button
          className={destructive ? "button button-danger" : "button"}
          disabled={pending || tokenStatus !== "present"}
          onClick={() => void handleRequest()}
          type="button"
        >
          {pending ? "Processing..." : buttonLabel}
        </button>
      </div>
    </AuthPanel>
  );
}

function AuthPanel({ eyebrow, title, description, children, footer }) {
  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </div>
    </section>
  );
}

function Field({ label, name, onChange, ...inputProps }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        {...inputProps}
        className="field-control"
        name={name}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({ label, name, options, onChange, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        className="field-control"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InlineError({ error }) {
  return <p className="inline-message inline-message-error">{error?.message}</p>;
}

function InlineSuccess({ message }) {
  return <p className="inline-message inline-message-success">{message}</p>;
}
