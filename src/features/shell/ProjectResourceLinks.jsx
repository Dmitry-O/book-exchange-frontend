import { useLocale } from "../../shared/i18n/LocaleContext";
import { useMetadataQuery } from "../../shared/api/hooks";
import {
  FileTextIcon,
  GithubIcon,
  LinkedinIcon
} from "../../shared/ui/Icons";

const RESOURCE_COPY = {
  en: {
    backendLabel: "Backend",
    backendDescription: "Spring Boot API",
    frontendLabel: "Frontend",
    frontendDescription: "React client",
    linkedinLabel: "LinkedIn",
    linkedinDescription: "Author profile",
    swaggerLabel: "Swagger API",
    swaggerDescription: "API documentation",
    soon: "soon"
  },
  de: {
    backendLabel: "Backend",
    backendDescription: "Spring Boot API",
    frontendLabel: "Frontend",
    frontendDescription: "React Client",
    linkedinLabel: "LinkedIn",
    linkedinDescription: "Autorenprofil",
    swaggerLabel: "Swagger API",
    swaggerDescription: "API-Dokumentation",
    soon: "bald"
  },
  ru: {
    backendLabel: "Backend",
    backendDescription: "Spring Boot API",
    frontendLabel: "Frontend",
    frontendDescription: "React-клиент",
    linkedinLabel: "LinkedIn",
    linkedinDescription: "Профиль автора",
    swaggerLabel: "Swagger API",
    swaggerDescription: "Документация API",
    soon: "скоро"
  }
};

export function ProjectResourceLinks({ className = "", compact = false }) {
  const { locale } = useLocale();
  const metadataQuery = useMetadataQuery();
  const text = RESOURCE_COPY[locale] ?? RESOURCE_COPY.en;
  const links = metadataQuery.data?.links ?? {};
  const classes = [
    "project-resource-links",
    compact ? "project-resource-links-compact" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <ProjectResourceLink
        description={text.backendDescription}
        href={links.backendGithubUrl}
        Icon={GithubIcon}
        label={text.backendLabel}
      />
      <ProjectResourceLink
        description={text.frontendDescription}
        href={links.frontendGithubUrl}
        Icon={GithubIcon}
        label={text.frontendLabel}
      />
      <ProjectResourceLink
        description={text.linkedinDescription}
        href={links.linkedinUrl}
        Icon={LinkedinIcon}
        label={text.linkedinLabel}
      />
      <ProjectResourceLink
        description={text.swaggerDescription}
        href={links.swaggerUrl}
        Icon={FileTextIcon}
        label={text.swaggerLabel}
      />
    </div>
  );
}

function ProjectResourceLink({ description, href, Icon, label, status }) {
  const disabled = !href;

  function handleDisabledClick(event) {
    if (disabled) {
      event.preventDefault();
    }
  }

  return (
    <a
      aria-disabled={disabled ? "true" : undefined}
      className={disabled ? "project-resource-link project-resource-link-disabled" : "project-resource-link"}
      href={disabled ? "#" : href}
      onClick={handleDisabledClick}
      rel={disabled ? undefined : "noreferrer"}
      target={disabled ? undefined : "_blank"}
    >
      <span className="project-resource-icon">
        <Icon />
      </span>
      <span className="project-resource-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      {status ? <span className="project-resource-status">{status}</span> : null}
    </a>
  );
}
