import { AUTHOR_NAME } from "./projectLinks";
import { ProjectResourceLinks } from "./ProjectResourceLinks";
import { useState } from "react";
import { useLocale } from "../../shared/i18n/LocaleContext";
import {
  BookIcon,
  CheckIcon,
  SearchIcon,
  ShieldIcon,
  SwapIcon,
  UserIcon
} from "../../shared/ui/Icons";

const ABOUT_COPY = {
  en: {
    eyebrow: "About the project",
    title: "Book Exchange is a backend-first pet project with a real product shell.",
    description:
      "The project demonstrates how a book exchange platform can work end to end: from authentication and catalog search to exchange workflows, moderation, admin tools, emails, and a React UI connected to the API.",
    authorLabel: "Author",
    highlightsKicker: "Architecture",
    linksKicker: "Resources",
    highlightsTitle: "What the project shows",
    highlights: [
      {
        title: "Backend close to real product logic",
        description: "The API covers authentication, roles, books, exchanges, reports, moderation, notifications, and admin scenarios."
      },
      {
        title: "Not just CRUD",
        description: "There are status transitions, optimistic locking with ETag / If-Match, audit events, email flows, and cleanup jobs."
      },
      {
        title: "Search and media infrastructure",
        description: "The catalog supports filters and Elasticsearch indexing, while book and profile images go through processing and S3 storage."
      },
      {
        title: "Testable API contract",
        description: "Unit and MockMvc integration tests cover business rules, validation, security, persistence effects, and error mapping."
      }
    ],
    backendTitle: "Backend implementation",
    backendDescription:
      "This is the strongest part of the project. The backend is built with Spring Boot and structured around real user journeys rather than isolated demo endpoints.",
    backendGroups: [
      {
        title: "Authentication and account security",
        items: [
          "Registration, login, refresh tokens, JWT-based security, and current-user endpoints.",
          "Email confirmation, resend confirmation, password reset, and account deletion by email token.",
          "User profile updates, password change, soft deletion, roles, bans, and super-admin actions."
        ]
      },
      {
        title: "Catalog, books, and search",
        items: [
          "Public catalog search with filters by title, author, category, city, publication year, and gift status.",
          "Book creation, editing, deletion, restore flows, public book pages, and exchanged-book history.",
          "Elasticsearch indexing with fallback behavior, city dictionary lookup, image processing, and S3 storage."
        ]
      },
      {
        title: "Exchange workflows",
        items: [
          "Book exchange requests, offers, approval and decline paths, gift requests, and exchange history.",
          "Unread updates and notification records so users can see what changed after an action.",
          "ETag / If-Match checks on sensitive updates to prevent overwriting stale state."
        ]
      },
      {
        title: "Moderation and admin area",
        items: [
          "Reports for books and users with reason, comment, status, and target snapshots.",
          "Admin flows for users, books, exchanges, and reports, including ban, unban, delete, restore, resolve, and reject actions.",
          "Role management with regular users, admins, and super-admin-only operations."
        ]
      },
      {
        title: "Infrastructure and quality",
        items: [
          "Flyway migrations for MySQL schema evolution and Docker Compose for MySQL, Mailpit, and Elasticsearch.",
          "Localized API and email messages, Mailpit sandbox for local email testing, and OpenAPI / Swagger UI support.",
          "Unit tests, MockMvc integration tests, Testcontainers for MySQL, and JaCoCo coverage reports."
        ]
      }
    ],
    frontendTitle: "React UI",
    frontendDescription:
      "The frontend keeps the project demo-friendly: visitors can search the catalog, open book pages, create an account, manage their books, follow exchange updates, and use admin screens when logged in with the right role.",
    frontendItems: [
      "React Router navigation with public, authenticated, and admin sections.",
      "TanStack Query data loading, URL-based catalog search, infinite scrolling, and optimistic UI-friendly state.",
      "Localized interface in English, German, and Russian, with reusable UI pieces for forms, media, pagination, and states."
    ],
    linksTitle: "Project links"
  },
  de: {
    eyebrow: "Über das Projekt",
    title: "Book Exchange ist ein backend-first Pet Project mit echter Produktoberfläche.",
    description:
      "Das Projekt zeigt eine Buchtausch-Plattform von Ende zu Ende: Authentifizierung, Katalogsuche, Tauschprozesse, Moderation, Admin-Tools, E-Mails und ein React UI mit API-Anbindung.",
    authorLabel: "Autor",
    highlightsKicker: "Architektur",
    linksKicker: "Ressourcen",
    highlightsTitle: "Was das Projekt zeigt",
    highlights: [
      {
        title: "Backend nah an echter Produktlogik",
        description: "Die API deckt Authentifizierung, Rollen, Bücher, Tausche, Meldungen, Moderation, Benachrichtigungen und Admin-Szenarien ab."
      },
      {
        title: "Mehr als CRUD",
        description: "Es gibt Statusübergänge, optimistisches Locking mit ETag / If-Match, Audit-Events, E-Mail-Flows und Cleanup-Jobs."
      },
      {
        title: "Suche und Medien",
        description: "Der Katalog unterstützt Filter und Elasticsearch, während Bilder verarbeitet und in S3 gespeichert werden."
      },
      {
        title: "Testbarer API-Vertrag",
        description: "Unit- und MockMvc-Integrationstests decken Business Rules, Validierung, Security, Persistenz und Fehler-Mapping ab."
      }
    ],
    backendTitle: "Backend-Implementierung",
    backendDescription:
      "Das ist der stärkste Teil des Projekts. Das Backend ist mit Spring Boot gebaut und an echten User Journeys statt an isolierten Demo-Endpunkten orientiert.",
    backendGroups: [
      {
        title: "Authentifizierung und Account-Sicherheit",
        items: [
          "Registrierung, Login, Refresh Tokens, JWT Security und Current-User-Endpunkte.",
          "E-Mail-Bestätigung, erneutes Senden, Passwort-Reset und Account-Löschung per E-Mail-Token.",
          "Profilupdates, Passwortänderung, Soft Delete, Rollen, Sperren und Super-Admin-Aktionen."
        ]
      },
      {
        title: "Katalog, Bücher und Suche",
        items: [
          "Öffentliche Suche mit Filtern nach Titel, Autor, Kategorie, Stadt, Jahr und Geschenkstatus.",
          "Bücher erstellen, bearbeiten, löschen, wiederherstellen, öffentliche Detailseiten und Tauschhistorie.",
          "Elasticsearch-Indexierung mit Fallback, Städteverzeichnis, Bildverarbeitung und S3-Speicher."
        ]
      },
      {
        title: "Tauschprozesse",
        items: [
          "Anfragen, Angebote, Bestätigung, Ablehnung, Geschenk-Anfragen und Historie.",
          "Ungelesene Updates und Benachrichtigungen für relevante Statusänderungen.",
          "ETag / If-Match für sensible Updates gegen überschriebenen alten Zustand."
        ]
      },
      {
        title: "Moderation und Admin",
        items: [
          "Meldungen für Bücher und Nutzer mit Grund, Kommentar, Status und Snapshots.",
          "Admin-Flows für Nutzer, Bücher, Tausche und Meldungen inklusive Sperren, Löschen, Wiederherstellen und Entscheidungen.",
          "Rollenmanagement für Nutzer, Admins und Super-Admin-Operationen."
        ]
      },
      {
        title: "Infrastruktur und Qualität",
        items: [
          "Flyway-Migrationen für MySQL und Docker Compose für MySQL, Mailpit und Elasticsearch.",
          "Lokalisierte API- und E-Mail-Texte, Mailpit Sandbox und OpenAPI / Swagger UI.",
          "Unit Tests, MockMvc Integrationstests, Testcontainers für MySQL und JaCoCo Reports."
        ]
      }
    ],
    frontendTitle: "React UI",
    frontendDescription:
      "Das Frontend macht das Projekt vorzeigbar: Besucher können den Katalog durchsuchen, Bücher öffnen, ein Konto erstellen, eigene Bücher verwalten, Tausch-Updates verfolgen und Admin-Screens mit passender Rolle nutzen.",
    frontendItems: [
      "React Router mit öffentlichen, eingeloggten und Admin-Bereichen.",
      "TanStack Query, URL-basierte Katalogsuche, Infinite Scrolling und UI-State für echte API-Flows.",
      "Lokalisierte Oberfläche auf Englisch, Deutsch und Russisch mit wiederverwendbaren UI-Komponenten."
    ],
    linksTitle: "Projektlinks"
  },
  ru: {
    eyebrow: "О проекте",
    title: "Book Exchange — backend-first pet project с полноценной продуктовой оболочкой.",
    description:
      "Проект показывает платформу обмена книгами от начала до конца: авторизация, поиск по каталогу, сценарии обмена, модерация, админка, письма и React-интерфейс, который работает с API.",
    authorLabel: "Автор",
    highlightsKicker: "Архитектура",
    linksKicker: "Ресурсы",
    highlightsTitle: "Что показывает проект",
    highlights: [
      {
        title: "Backend близкий к реальной продуктовой логике",
        description: "API покрывает авторизацию, роли, книги, обмены, жалобы, модерацию, уведомления и административные сценарии."
      },
      {
        title: "Это не просто CRUD",
        description: "В проекте есть переходы статусов, optimistic locking через ETag / If-Match, аудит действий, email-сценарии и фоновые cleanup-задачи."
      },
      {
        title: "Поиск и работа с медиа",
        description: "Каталог поддерживает фильтры и Elasticsearch-индексацию, а изображения книг и профилей проходят обработку и сохраняются в S3."
      },
      {
        title: "Проверяемый API-контракт",
        description: "Unit- и MockMvc-интеграционные тесты проверяют бизнес-правила, валидацию, security, изменения в базе и маппинг ошибок."
      }
    ],
    backendTitle: "Что реализовано в backend",
    backendDescription:
      "Это самая сильная часть проекта. Backend построен на Spring Boot и описывает реальные пользовательские сценарии, а не набор разрозненных demo endpoint'ов.",
    backendGroups: [
      {
        title: "Авторизация и безопасность аккаунта",
        items: [
          "Регистрация, вход, refresh-токены, JWT-security и получение текущего пользователя.",
          "Подтверждение email, повторная отправка письма, восстановление пароля и удаление аккаунта по email-токену.",
          "Редактирование профиля, смена пароля, soft delete, роли, блокировки пользователей и super-admin операции."
        ]
      },
      {
        title: "Каталог, книги и поиск",
        items: [
          "Публичный поиск по каталогу с фильтрами по названию, автору, категории, городу, году издания и признаку подарка.",
          "Создание, редактирование, удаление и восстановление книг, публичные страницы книг и история уже обменянных книг.",
          "Elasticsearch-индексация с fallback-поведением, справочник городов, обработка изображений и S3-хранилище."
        ]
      },
      {
        title: "Сценарии обмена",
        items: [
          "Запросы на обмен, встречные предложения, подтверждение, отклонение, подарочные запросы и история обменов.",
          "Непрочитанные обновления и записи уведомлений, чтобы пользователь видел, что изменилось после действий других участников.",
          "ETag / If-Match на чувствительных изменениях, чтобы не перезаписывать устаревшее состояние."
        ]
      },
      {
        title: "Модерация и администрирование",
        items: [
          "Жалобы на книги и пользователей с причиной, комментарием, статусом и snapshot'ами объекта жалобы.",
          "Admin-сценарии для пользователей, книг, обменов и жалоб: ban, unban, delete, restore, resolve и reject.",
          "Управление ролями: обычные пользователи, администраторы и операции только для super-admin."
        ]
      },
      {
        title: "Инфраструктура и качество",
        items: [
          "Flyway-миграции для MySQL и Docker Compose для MySQL, Mailpit и Elasticsearch.",
          "Локализованные API- и email-сообщения, Mailpit для локальной проверки писем и OpenAPI / Swagger UI.",
          "Unit-тесты, MockMvc integration-тесты, Testcontainers с MySQL и JaCoCo-отчеты по покрытию."
        ]
      }
    ],
    frontendTitle: "Что реализовано во frontend",
    frontendDescription:
      "React-интерфейс делает backend удобным для демонстрации: можно искать книги, открывать публичные карточки, создавать аккаунт, управлять своими книгами, отслеживать обмены и пользоваться admin-разделом при нужной роли.",
    frontendItems: [
      "React Router с публичными, авторизованными и административными разделами.",
      "TanStack Query для загрузки данных, поиск каталога через URL, infinite scroll и состояние интерфейса под реальные API-сценарии.",
      "Локализация интерфейса на английском, немецком и русском, переиспользуемые UI-компоненты для форм, изображений, пагинации и состояний."
    ],
    linksTitle: "Ссылки проекта"
  }
};

const HIGHLIGHT_ICONS = [ShieldIcon, SwapIcon, SearchIcon, CheckIcon];
const BACKEND_GROUP_ICONS = [UserIcon, BookIcon, SwapIcon, ShieldIcon, CheckIcon];

export function AboutPage() {
  const { locale } = useLocale();
  const text = ABOUT_COPY[locale] ?? ABOUT_COPY.en;
  const [authorPhotoVisible, setAuthorPhotoVisible] = useState(true);

  return (
    <div className="content-stack about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <span className="home-eyebrow">{text.eyebrow}</span>
          <h1>{text.title}</h1>
          <p>{text.description}</p>
        </div>
        <div className="about-author-card">
          <div className="about-author-photo">
            {authorPhotoVisible ? (
              <img
                alt={AUTHOR_NAME}
                onError={() => setAuthorPhotoVisible(false)}
                src="/author-photo.jpg"
              />
            ) : (
              <span>DO</span>
            )}
          </div>
          <div className="about-author-copy">
            <span>{text.authorLabel}</span>
            <strong>{AUTHOR_NAME}</strong>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="home-section-heading">
          <span className="home-section-kicker">{text.highlightsKicker}</span>
          <h2>{text.highlightsTitle}</h2>
        </div>

        <div className="about-highlight-grid">
          {text.highlights.map((item, index) => {
            const Icon = HIGHLIGHT_ICONS[index] ?? CheckIcon;

            return (
              <article className="about-highlight-card" key={item.title}>
                <span className="about-icon-badge">
                  <Icon />
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-section about-backend-section">
        <div className="home-section-heading">
          <span className="home-section-kicker">Backend</span>
          <h2>{text.backendTitle}</h2>
          <p>{text.backendDescription}</p>
        </div>

        <div className="about-capability-grid">
          {text.backendGroups.map((group, index) => {
            const Icon = BACKEND_GROUP_ICONS[index] ?? CheckIcon;

            return (
              <article className="about-capability-card" key={group.title}>
                <div className="about-capability-header">
                  <span className="about-icon-badge">
                    <Icon />
                  </span>
                  <h3>{group.title}</h3>
                </div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-section about-frontend-section">
        <div className="about-split-copy">
          <span className="home-section-kicker">Frontend</span>
          <h2>{text.frontendTitle}</h2>
          <p>{text.frontendDescription}</p>
        </div>
        <ul className="about-check-list">
          {text.frontendItems.map((item) => (
            <li key={item}>
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-links-section">
        <div>
          <span className="home-section-kicker">{text.linksKicker}</span>
          <h2>{text.linksTitle}</h2>
        </div>
        <ProjectResourceLinks />
      </section>
    </div>
  );
}
