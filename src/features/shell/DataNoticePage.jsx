import { useLocale } from "../../shared/i18n/LocaleContext";
import {
  BookIcon,
  CheckIcon,
  EnvelopeClosedIcon,
  FileTextIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon
} from "../../shared/ui/Icons";
import { AUTHOR_NAME } from "./projectLinks";
import { ProjectResourceLinks } from "./ProjectResourceLinks";

const DEMO_CONTACT_EMAIL =
  import.meta.env.VITE_DEMO_CONTACT_EMAIL?.trim() || "demo-contact@example.com";

const NOTICE_COPY = {
  en: {
    eyebrow: "Demo transparency",
    title: "Data Notice & Impressum",
    intro:
      "This page explains who owns this demo project, what data can be stored while you test it, how the demo email sandbox works, and how to request deletion. It is written for a portfolio/demo environment and is not legal advice.",
    ownerTitle: "Project owner & Impressum",
    ownerItems: [
      ["Owner", AUTHOR_NAME],
      ["Project purpose", "Non-commercial portfolio and interview demo for a backend-first book exchange application."],
      ["Contact", DEMO_CONTACT_EMAIL],
      ["Availability", "Access is intended for people who received a demo link or access token from the project owner."]
    ],
    contactCta: "Write an email",
    demoTitle: "Important demo warning",
    demoText:
      "This is a public demo environment. Do not enter real personal data, private addresses, private phone numbers, personal photos, sensitive comments, or passwords that you use elsewhere. Use test data only.",
    sections: [
      {
        icon: ShieldIcon,
        title: "Why data is processed",
        items: [
          "To let visitors test the application flows: registration, login, catalog browsing, book creation, exchanges, reports, moderation, admin features, and email scenarios.",
          "To keep the demo secure and usable: access gate, rate limits, authentication, role checks, audit/security logs, and error handling.",
          "To demonstrate backend persistence and real application state during interviews or portfolio reviews."
        ]
      },
      {
        icon: UserIcon,
        title: "Data you may create in the demo",
        items: [
          "Account data such as email address, nickname, interface language, account status, roles, confirmation state, and password hash. Raw passwords are not intentionally stored.",
          "Profile data such as nickname changes and uploaded profile images.",
          "Book listings including title, author, description, category, city, publication year, gift/exchange mode, images, and contact details entered by the user.",
          "Exchange requests, offers, status history, notifications, reports, comments, moderation decisions, and admin actions.",
          "Technical data such as request metadata, authentication/session state, local browser state for language/demo inbox, and the demo access cookie."
        ]
      },
      {
        icon: EnvelopeClosedIcon,
        title: "Demo email sandbox",
        items: [
          "The demo does not need to send real emails through AWS SES or a public mailbox provider.",
          "Email flows are routed to a Mailpit-based sandbox inbox inside the React application.",
          "The sandbox is separated by browser/session and account email where the backend supports it, so demo emails are meant to be visible only in the matching demo inbox.",
          "Email content can include confirmation links, password reset links, account deletion links, exchange notifications, or moderation notifications."
        ]
      },
      {
        icon: TrashIcon,
        title: "Retention and deletion",
        items: [
          "Demo data is intended to reset daily. Changes are temporary; the reset may remove accounts, books, exchanges, reports, notifications, sandbox emails, and uploaded runtime files.",
          "You can delete an account through the account deletion flow when it is available for the current account.",
          "If you accidentally entered real personal data, contact the project owner using the email on this page and ask for deletion.",
          "Because this is a demo environment, data should not be considered permanent or suitable for real use."
        ]
      },
      {
        icon: FileTextIcon,
        title: "What is not intended",
        items: [
          "No production book exchange service is offered through this demo.",
          "No payment, advertising, analytics profiling, or marketing newsletter flow is intended.",
          "No special category data, official documents, financial details, private addresses, or real identity documents should be entered."
        ]
      }
    ],
    rightsTitle: "Your options",
    rights: [
      "Use only test data.",
      "Use the public account deletion flow or profile controls where available.",
      "Contact the project owner to request deletion of demo data connected to an email address or account.",
      "Do not use the demo for confidential, production, or private communication."
    ],
    linksTitle: "Project resources",
    backToRegister: "Back to registration",
    backToAbout: "Back to project page"
  },
  de: {
    eyebrow: "Demo-Transparenz",
    title: "Datenschutz & Impressum",
    intro:
      "Diese Seite erklärt, wem das Demo-Projekt gehört, welche Daten beim Testen gespeichert werden können, wie die Demo-E-Mail-Sandbox funktioniert und wie eine Löschung angefragt werden kann. Sie ist für eine Portfolio-/Demo-Umgebung geschrieben und keine Rechtsberatung.",
    ownerTitle: "Projektinhaber & Impressum",
    ownerItems: [
      ["Inhaber", AUTHOR_NAME],
      ["Zweck des Projekts", "Nicht-kommerzielle Portfolio- und Interview-Demo für eine backend-first Buchtausch-Anwendung."],
      ["Kontakt", DEMO_CONTACT_EMAIL],
      ["Zugänglichkeit", "Der Zugriff ist für Personen gedacht, die vom Projektinhaber einen Demo-Link oder Access Token erhalten haben."]
    ],
    contactCta: "E-Mail schreiben",
    demoTitle: "Wichtiger Demo-Hinweis",
    demoText:
      "Dies ist eine öffentliche Demo-Umgebung. Bitte gib keine echten personenbezogenen Daten, privaten Adressen, privaten Telefonnummern, persönlichen Fotos, sensiblen Kommentare oder Passwörter ein, die du woanders verwendest. Nutze nur Testdaten.",
    sections: [
      {
        icon: ShieldIcon,
        title: "Warum Daten verarbeitet werden",
        items: [
          "Damit Besucher die Anwendungsabläufe testen können: Registrierung, Login, Katalog, Bucherstellung, Tauschvorgänge, Meldungen, Moderation, Admin-Funktionen und E-Mail-Szenarien.",
          "Damit die Demo sicher und nutzbar bleibt: Access Gate, Rate Limits, Authentifizierung, Rollenprüfungen, Audit-/Security-Logs und Fehlerbehandlung.",
          "Damit Persistenz und echter Anwendungszustand in Interviews oder Portfolio-Reviews demonstriert werden können."
        ]
      },
      {
        icon: UserIcon,
        title: "Daten, die du in der Demo erstellen kannst",
        items: [
          "Kontodaten wie E-Mail-Adresse, Nickname, Sprache, Kontostatus, Rollen, Bestätigungsstatus und Passwort-Hash. Klartext-Passwörter werden nicht absichtlich gespeichert.",
          "Profildaten wie Nickname-Änderungen und hochgeladene Profilbilder.",
          "Buchanzeigen mit Titel, Autor, Beschreibung, Kategorie, Stadt, Erscheinungsjahr, Geschenk-/Tauschmodus, Bildern und vom Nutzer eingegebenen Kontaktdaten.",
          "Tauschanfragen, Angebote, Statusverlauf, Benachrichtigungen, Meldungen, Kommentare, Moderationsentscheidungen und Admin-Aktionen.",
          "Technische Daten wie Request-Metadaten, Authentifizierungs-/Session-Zustand, lokaler Browserzustand für Sprache/Demo-Postfach und das Demo-Access-Cookie."
        ]
      },
      {
        icon: EnvelopeClosedIcon,
        title: "Demo-E-Mail-Sandbox",
        items: [
          "Die Demo muss keine echten E-Mails über AWS SES oder einen öffentlichen Mailanbieter versenden.",
          "E-Mail-Flows werden in ein Mailpit-basiertes Sandbox-Postfach innerhalb der React-Anwendung geleitet.",
          "Die Sandbox ist nach Browser/Session und Account-E-Mail getrennt, soweit das Backend dies unterstützt. Demo-E-Mails sollen nur im passenden Demo-Postfach sichtbar sein.",
          "E-Mail-Inhalte können Bestätigungslinks, Passwort-Reset-Links, Links zur Kontolöschung, Tauschbenachrichtigungen oder Moderationshinweise enthalten."
        ]
      },
      {
        icon: TrashIcon,
        title: "Speicherdauer und Löschung",
        items: [
          "Demo-Daten sollen täglich zurückgesetzt werden. Änderungen sind temporär; der Reset kann Konten, Bücher, Tausche, Meldungen, Benachrichtigungen, Sandbox-E-Mails und hochgeladene Runtime-Dateien entfernen.",
          "Du kannst ein Konto über den Löschungsprozess entfernen, wenn er für das aktuelle Konto verfügbar ist.",
          "Falls du versehentlich echte personenbezogene Daten eingegeben hast, kontaktiere den Projektinhaber über die E-Mail auf dieser Seite und bitte um Löschung.",
          "Da dies eine Demo-Umgebung ist, sollten Daten nicht als dauerhaft oder für echte Nutzung geeignet betrachtet werden."
        ]
      },
      {
        icon: FileTextIcon,
        title: "Was nicht vorgesehen ist",
        items: [
          "Über diese Demo wird kein produktiver Buchtausch-Dienst angeboten.",
          "Es sind keine Zahlungen, Werbeprofile, Analytics-Profiling oder Marketing-Newsletter vorgesehen.",
          "Besondere Kategorien personenbezogener Daten, Ausweisdokumente, Finanzdaten, private Adressen oder echte Identitätsdokumente sollen nicht eingegeben werden."
        ]
      }
    ],
    rightsTitle: "Deine Möglichkeiten",
    rights: [
      "Verwende nur Testdaten.",
      "Nutze den öffentlichen Löschungsprozess oder Profilfunktionen, wenn sie verfügbar sind.",
      "Kontaktiere den Projektinhaber, um die Löschung von Demo-Daten zu einer E-Mail-Adresse oder einem Konto anzufragen.",
      "Nutze die Demo nicht für vertrauliche, produktive oder private Kommunikation."
    ],
    linksTitle: "Projektressourcen",
    backToRegister: "Zur Registrierung",
    backToAbout: "Zur Projektseite"
  },
  ru: {
    eyebrow: "Прозрачность демо",
    title: "Защита данных & контакты",
    intro:
      "Эта страница объясняет, кто владеет демо-проектом, какие данные могут сохраняться во время тестирования, как работает демо-почта и как запросить удаление данных. Текст написан для демонстрационного проекта в портфолио и не является юридической консультацией.",
    ownerTitle: "Владелец проекта и контактные данные",
    ownerItems: [
      ["Владелец", AUTHOR_NAME],
      ["Цель проекта", "Некоммерческая демонстрация для портфолио и собеседований. Главный акцент проекта — серверная часть приложения по обмену книгами."],
      ["Контакт", DEMO_CONTACT_EMAIL],
      ["Доступность", "Доступ рассчитан на людей, которые получили демо-ссылку или токен доступа от владельца проекта."]
    ],
    contactCta: "Написать письмо",
    demoTitle: "Важное предупреждение о демо",
    demoText:
      "Это публичная демо-среда, не вводите реальные персональные данные: личные адреса, личные телефоны, персональные фотографии, чувствительные комментарии и пароли, которые используете где-то ещё. Используйте только тестовые данные.",
    sections: [
      {
        icon: ShieldIcon,
        title: "Зачем обрабатываются данные",
        items: [
          "Чтобы посетители могли проверить сценарии приложения: регистрацию, вход, каталог, создание книг, обмены, жалобы, модерацию, админку и почтовые сценарии.",
          "Чтобы демо оставалась безопасной и рабочей: проверка доступа, ограничения частоты запросов, авторизация, проверка ролей, журналы аудита и безопасности, обработка ошибок.",
          "Чтобы на собеседовании или при просмотре портфолио можно было показать сохранение данных и реальное состояние приложения."
        ]
      },
      {
        icon: UserIcon,
        title: "Какие данные можно создать в демо",
        items: [
          "Данные аккаунта: адрес электронной почты, никнейм, язык интерфейса, статус аккаунта, роли, статус подтверждения и хеш пароля. Пароли в открытом виде намеренно не сохраняются.",
          "Данные профиля: изменения никнейма и загруженные изображения профиля.",
          "Объявления о книгах: название, автор, описание, категория, город, год издания, режим подарка/обмена, изображения и контактные данные, введённые пользователем.",
          "Запросы на обмен, предложения, история статусов, уведомления, жалобы, комментарии, решения модерации и действия администратора.",
          "Технические данные: метаданные запросов, состояние авторизации и сессии, локальное состояние браузера для языка и демо-почты, cookie-файл доступа к демо."
        ]
      },
      {
        icon: EnvelopeClosedIcon,
        title: "Демо-почта",
        items: [
          "Демо не требует отправки реальных писем через AWS SES или публичного почтового провайдера.",
          "Почтовые сценарии отправляются в изолированный почтовый ящик Mailpit внутри React-приложения.",
          "Почтовый ящик разделён по браузеру, сессии и адресу электронной почты аккаунта там, где это поддерживает серверная часть. Поэтому демо-письма должны быть видны только в подходящем демо-ящике.",
          "В письмах могут быть ссылки подтверждения электронной почты, сброса пароля, удаления аккаунта, уведомления об обменах и модерации."
        ]
      },
      {
        icon: TrashIcon,
        title: "Хранение и удаление",
        items: [
          "Демо-данные рассчитаны на ежедневный сброс. Изменения временные: сброс может удалить аккаунты, книги, обмены, жалобы, уведомления, письма из демо-почты и загруженные файлы.",
          "Аккаунт можно удалить через сценарий удаления аккаунта, если он доступен для текущего аккаунта.",
          "Если вы случайно ввели реальные персональные данные, напишите владельцу проекта на электронную почту с этой страницы и попросите удалить данные.",
          "Так как это демо-среда, данные не стоит считать постоянными или пригодными для реального использования."
        ]
      },
      {
        icon: FileTextIcon,
        title: "Что не предполагается",
        items: [
          "Эта демо-версия не является боевым сервисом обмена книгами.",
          "В проекте не предполагаются платежи, рекламные профили, аналитическое профилирование или маркетинговые рассылки.",
          "Не нужно вводить специальные категории персональных данных, документы, финансовые данные, приватные адреса или реальные удостоверения личности."
        ]
      }
    ],
    rightsTitle: "Что можно сделать",
    rights: [
      "Использовать только тестовые данные.",
      "Использовать публичный сценарий удаления аккаунта или настройки профиля, если они доступны.",
      "Связаться с владельцем проекта и запросить удаление демо-данных, связанных с электронной почтой или аккаунтом.",
      "Не использовать демо для конфиденциальной, боевой или личной коммуникации."
    ],
    linksTitle: "Ресурсы проекта",
    backToRegister: "К регистрации",
    backToAbout: "К странице проекта"
  }
};

export function DataNoticePage() {
  const { locale } = useLocale();
  const text = NOTICE_COPY[locale] ?? NOTICE_COPY.en;
  const mailtoHref = `mailto:${DEMO_CONTACT_EMAIL}?subject=${encodeURIComponent("Book Exchange demo data request")}`;

  return (
    <div className="content-stack data-notice-page">
      <section className="data-notice-hero">
        <div className="data-notice-hero-copy">
          <span className="home-eyebrow">{text.eyebrow}</span>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>
      </section>

      <section className="data-notice-owner-section">
        <div className="data-notice-owner-card">
          <span className="about-icon-badge">
            <ShieldIcon />
          </span>
          <h2>{text.ownerTitle}</h2>
          <dl>
            {text.ownerItems.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {value === DEMO_CONTACT_EMAIL ? (
                    <a href={mailtoHref}>{value}</a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <a className="button data-notice-mail-link" href={mailtoHref}>
            <EnvelopeClosedIcon />
            <span>{text.contactCta}</span>
          </a>
        </div>
      </section>

      <section className="data-notice-warning">
        <span className="about-icon-badge">
          <BookIcon />
        </span>
        <div>
          <h2>{text.demoTitle}</h2>
          <p>{text.demoText}</p>
        </div>
      </section>

      <section className="data-notice-grid">
        {text.sections.map((section) => {
          const Icon = section.icon;

          return (
            <article className="data-notice-card" key={section.title}>
              <div className="data-notice-card-header">
                <span className="about-icon-badge">
                  <Icon />
                </span>
                <h2>{section.title}</h2>
              </div>
              <ul className="about-check-list">
                {section.items.map((item) => (
                  <li key={item}>
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="about-frontend-section data-notice-actions-section">
        <div className="about-split-copy">
          <span className="home-section-kicker">{text.eyebrow}</span>
          <h2>{text.rightsTitle}</h2>
        </div>
        <ul className="about-check-list">
          {text.rights.map((item) => (
            <li key={item}>
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-links-section">
        <div>
          <span className="home-section-kicker">{text.linksTitle}</span>
          <h2>{text.linksTitle}</h2>
        </div>
        <div className="about-links-stack">
          <ProjectResourceLinks />
        </div>
      </section>
    </div>
  );
}
