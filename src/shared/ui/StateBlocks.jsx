import { useLocale } from "../i18n/LocaleContext";

export function LoadingBlock({ label }) {
  const { t } = useLocale();

  return (
    <div className="state-block">
      <div className="spinner" />
      <p>{label ?? t("common.loading")}</p>
    </div>
  );
}

export function ErrorBlock({ error, title }) {
  const { t } = useLocale();

  return (
    <div className="state-block state-block-error">
      <h3>{title ?? t("common.somethingWentWrong")}</h3>
      <p>{error?.message ?? t("common.unexpectedError")}</p>
    </div>
  );
}

export function EmptyBlock({ title, description, actions = null }) {
  return (
    <div className="state-block">
      <h3>{title}</h3>
      <p>{description}</p>
      {actions}
    </div>
  );
}
