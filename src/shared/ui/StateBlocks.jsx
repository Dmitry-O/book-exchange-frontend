export function LoadingBlock({ label = "Loading" }) {
  return (
    <div className="state-block">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorBlock({ error, title = "Something went wrong" }) {
  return (
    <div className="state-block state-block-error">
      <h3>{title}</h3>
      <p>{error?.message ?? "Unexpected error"}</p>
      {error?.requestId ? <code>Request ID: {error.requestId}</code> : null}
    </div>
  );
}

export function EmptyBlock({ title, description }) {
  return (
    <div className="state-block">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
