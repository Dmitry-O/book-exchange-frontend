import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  detectLocaleFromIp,
  getLocaleLabel,
  hasStoredLocalePreference,
  normalizeLocale,
  readStoredLocale,
  SUPPORTED_LOCALES,
  writeStoredLocale
} from "./locale";

const LocaleContext = createContext(null);

const messages = {
  en: {
    common: {
      appName: "Book Exchange",
      home: "Home",
      catalog: "Catalog",
      demoInbox: "Demo inbox",
      about: "About",
      login: "Login",
      register: "Register",
      language: "Language",
      signIn: "Sign in",
      goHome: "Go to home page",
      backHome: "Back home",
      loading: "Loading",
      unexpectedError: "Unexpected error",
      somethingWentWrong: "Something went wrong",
      unknown: "Unknown",
      notAvailable: "Not available"
    },
    homePage: {
      phase: "Live demo",
      title: "Explore your backend through a modern React frontend",
      description:
        "Browse the public catalog, sign in, and test the real API flows that are already connected to this interface.",
      openCatalog: "Open catalog",
      signIn: "Sign in",
      catalogTitle: "Public catalog",
      catalogDescription:
        "Search books, open public book pages, and test the real catalog endpoints.",
      authTitle: "Account flows",
      authDescription:
        "Registration, email confirmation, password reset, and account deletion are already connected.",
      workspaceTitle: "User workspace",
      workspaceDescription:
        "Profile, security settings, books, exchanges, notifications, and reports are available after sign-in.",
      metadataTitle: "App data",
      metadataLoading: "App data is loading.",
      locales: "Locales",
      reportReasons: "Report reasons",
      exchangeStatuses: "Exchange statuses",
      bookSortFields: "Book sort fields"
    },
    catalog: {
      eyebrow: "Public API",
      title: "Catalog",
      description:
        "Browse public books, use filters, and open real book pages backed by your API.",
      searchText: "Search text",
      author: "Author",
      category: "Category",
      city: "City",
      publicationYear: "Publication year",
      giftOnly: "Gift only",
      sortField: "Sort field",
      sortDirection: "Sort direction",
      all: "All",
      giftOnlyOption: "Gift only",
      exchangeOnly: "Exchange only",
      defaultSort: "Default",
      ascending: "Ascending",
      descending: "Descending",
      resetFilters: "Reset filters",
      booksMatched: "{count} books matched",
      loading: "Loading catalog",
      requestFailed: "Catalog request failed",
      noBooks: "No books found",
      noBooksDescription: "Try broader filters or remove some filters.",
      gift: "Gift",
      exchange: "Exchange",
      noCity: "No city",
      unknownYear: "Unknown year",
      noDescription: "No public description has been added for this book yet.",
      unknownOwner: "Unknown owner"
    },
    notFound: {
      title: "Page not found",
      description: "This page may have moved or never existed. Let’s get you back to the books."
    },
    shell: {
      loadingMetadata: "Loading app data",
      workspace: "Workspace",
      profile: "Profile",
      security: "Security",
      updates: "Updates",
      myReports: "My reports",
      myBooks: "My books",
      requests: "Requests",
      offers: "Offers",
      history: "History",
      users: "Users",
      books: "Books",
      reports: "Reports",
      exchanges: "My exchanges",
      manageUsers: "User management",
      manageBooks: "Book management",
      manageReports: "Report management",
      manageExchanges: "Exchange management",
      admin: "Admin",
      superAdmin: "Super admin",
      moderation: "Moderation",
      openAdminArea: "Open admin area",
      logout: "Logout",
      adminMode: "Admin mode",
      signedIn: "Signed in",
      moderationConsole: "Moderation Console",
      frontendWorkspace: "Frontend Workspace",
      unknownUser: "Unknown user",
      noEmail: "No email"
    },
    routeGuards: {
      loadingWorkspace: "Loading your workspace",
      refreshingSession: "Refreshing your session",
      workspaceError: "Your workspace could not be loaded",
      checkingAdmin: "Checking admin access",
      refreshingAdmin: "Refreshing admin access",
      adminError: "Something went wrong"
    },
    auth: {
      signInEyebrow: "Sign in",
      signInTitle: "Sign in",
      signInDescription: "Use your email address and password to continue.",
      noAccount: "No account yet?",
      createOne: "Create one",
      email: "Email",
      password: "Password",
      signingIn: "Signing in...",
      forgotPasswordTitle: "Request a password reset email",
      forgotPasswordDescription:
        "Enter your email address and we will send you a link to set a new password.",
      sendResetLink: "Reset password",
      resendTitle: "Send a new confirmation email",
      resendDescription: "Enter your email address and we will send you a new confirmation link.",
      resendConfirmation: "Resend email",
      alreadyConfirmed: "Already confirmed?",
      backToLogin: "Back to login",
      registerEyebrow: "Register",
      registerTitle: "Create account",
      registerDescription:
        "Create your Book Exchange account and choose the language for your interface and emails.",
      registrationDataError: "Registration data could not be loaded",
      nickname: "Nickname",
      locale: "Language",
      creatingAccount: "Creating account...",
      createAccount: "Create account",
      alreadyRegistered: "Already registered?",
      goToLogin: "Go to login",
      nextStepsTitle: "What next?",
      nextStepsDescription:
        "Your confirmation email is ready in the demo inbox. Confirm your address to finish creating the account.",
      requestDeleteTitle: "Request an account deletion link",
      requestDeleteDescription:
        "Enter your email address and we will send you a link to confirm account deletion.",
      sendDeletionEmail: "Send account deletion link",
      verifyEyebrow: "Verify",
      verifyTitle: "Email confirmation",
      verifyDescription:
        "Confirm your email to finish setting up your account and start exchanging books.",
      verifyAction: "Verify email",
      freshConfirmationTitle: "Need a fresh confirmation link?",
      freshConfirmationDescription:
        "Enter your email address and we will send you a new verification email.",
      sendNewConfirmation: "Send a new confirmation email",
      emailConfirmed: "Your email address has been confirmed. Welcome to Book Exchange!",
      resetEyebrow: "Reset",
      resetTitle: "Create a new password",
      resetDescription: "Enter a new password for your account.",
      newPassword: "New password",
      confirmPassword: "Repeat new password",
      passwordMismatch: "The passwords do not match",
      holdToShowPassword: "Hold to show password",
      signInAccount: "Sign in to account",
      resettingPassword: "Resetting password...",
      resetPassword: "Reset password",
      passwordChanged: "Your password has been changed.",
      requestFreshResetTitle: "Request a fresh reset link",
      requestFreshResetDescription:
        "If the old link expired or no longer works, enter your email address and we will send a new one.",
      sendNewReset: "Send a new reset email",
      deleteEyebrow: "Delete",
      deleteTitle: "Confirm account deletion",
      deleteDescription: "Confirm that you want to permanently delete your account.",
      deleteAction: "Delete account",
      deletedSuccess: "Your account has been deleted.",
      newDeletionTitle: "Need a new deletion link?",
      newDeletionDescription:
        "Enter your email address and we will send you a fresh deletion confirmation email.",
      sendNewDeletion: "Resend email",
      processing: "Processing...",
      sending: "Sending...",
      accountNeedsConfirmationTitle: "Your account still needs email confirmation",
      accountNeedsConfirmationDescription:
        "Request a new confirmation email and finish activating your account.",
      bannedTitle: "Need to delete a blocked account?",
      bannedDescription: "You can request an account deletion link without signing in.",
      wrongPasswordTitle: "Forgot your password?",
      wrongPasswordDescription:
        "Send yourself a password reset email and choose a new password.",
      requestDeletionEmail: "Request account deletion link",
      openDemoInbox: "Open demo inbox"
    },
    profile: {
      eyebrow: "Profile",
      title: "Account settings",
      description: "Manage your personal information and security.",
      currentData: "Profile data",
      currentDataDescription: "Your photo is loaded from the server via photo URL.",
      roles: "Roles",
      version: "Version / ETag",
      bannedUntil: "Banned until",
      banReason: "Ban reason",
      noRoles: "No roles",
      notSet: "Not set",
      none: "None",
      editTitle: "Edit profile",
      profilePhoto: "Profile photo",
      saveProfile: "Update nickname",
      saving: "Saving...",
      updated: "Profile updated successfully.",
      photoUploaded: "Profile photo uploaded.",
      deletePhotoConfirm: "Delete your current profile photo?",
      photoDeleted: "Profile photo deleted."
    },
    security: {
      eyebrow: "Security",
      title: "Session and password controls",
      description: "Change your password, sign out, or delete your account.",
      changePassword: "Change password",
      currentPassword: "Current password",
      updating: "Updating...",
      changed: "Password has been changed.",
      sessionActions: "Session actions",
      currentProfileVersion: "Current profile version",
      unknownVersion: "unknown",
      logoutCurrentSession: "Logout",
      deletingAccount: "Deleting account...",
      deleteAccount: "Delete account",
      deleteConfirm:
        "Delete the current account? This action will permanently remove your account.",
      publicDeleteFlowPrefix: "No access later? You can also use the public",
      publicDeleteFlowLink: "account deletion email flow"
    }
  },
  de: {
    common: {
      appName: "Book Exchange",
      home: "Startseite",
      catalog: "Katalog",
      demoInbox: "Demo-Postfach",
      about: "Über das Projekt",
      login: "Anmelden",
      register: "Registrieren",
      language: "Sprache",
      signIn: "Anmelden",
      goHome: "Zur Startseite",
      backHome: "Zur Startseite",
      loading: "Lädt",
      unexpectedError: "Unerwarteter Fehler",
      somethingWentWrong: "Etwas ist schiefgelaufen",
      unknown: "Unbekannt",
      notAvailable: "Nicht verfügbar"
    },
    homePage: {
      phase: "Live-Demo",
      title: "Teste dein Backend über ein modernes React-Frontend",
      description:
        "Durchsuche den öffentlichen Katalog, melde dich an und prüfe die echten API-Abläufe, die bereits mit dieser Oberfläche verbunden sind.",
      openCatalog: "Katalog öffnen",
      signIn: "Anmelden",
      catalogTitle: "Öffentlicher Katalog",
      catalogDescription:
        "Suche Bücher, öffne öffentliche Buchseiten und teste die echten Katalog-Endpunkte.",
      authTitle: "Kontofunktionen",
      authDescription:
        "Registrierung, E-Mail-Bestätigung, Passwort-Zurücksetzen und Kontolöschung sind bereits verbunden.",
      workspaceTitle: "Benutzerbereich",
      workspaceDescription:
        "Profil, Sicherheit, Bücher, Tausche, Benachrichtigungen und Meldungen stehen nach der Anmeldung bereit.",
      metadataTitle: "App-Daten",
      metadataLoading: "App-Daten werden geladen.",
      locales: "Sprachen",
      reportReasons: "Meldegründe",
      exchangeStatuses: "Tauschstatus",
      bookSortFields: "Buch-Sortierfelder"
    },
    catalog: {
      eyebrow: "Öffentliche API",
      title: "Katalog",
      description:
        "Durchsuche öffentliche Bücher, nutze Filter und öffne echte Buchseiten aus deiner API.",
      searchText: "Suchtext",
      author: "Autor",
      category: "Kategorie",
      city: "Stadt",
      publicationYear: "Erscheinungsjahr",
      giftOnly: "Nur Geschenke",
      sortField: "Sortierfeld",
      sortDirection: "Sortierrichtung",
      all: "Alle",
      giftOnlyOption: "Nur Geschenke",
      exchangeOnly: "Nur Tausch",
      defaultSort: "Standard",
      ascending: "Aufsteigend",
      descending: "Absteigend",
      resetFilters: "Filter zurücksetzen",
      booksMatched: "{count} Bücher gefunden",
      loading: "Katalog wird geladen",
      requestFailed: "Katalog konnte nicht geladen werden",
      noBooks: "Keine Bücher gefunden",
      noBooksDescription: "Versuche breitere Filter oder entferne einige Einschränkungen.",
      gift: "Geschenk",
      exchange: "Tausch",
      noCity: "Keine Stadt",
      unknownYear: "Unbekanntes Jahr",
      noDescription: "Für dieses Buch wurde noch keine öffentliche Beschreibung hinzugefügt.",
      unknownOwner: "Unbekannter Besitzer"
    },
    notFound: {
      title: "Seite nicht gefunden",
      description: "Diese Seite wurde vielleicht verschoben oder hat nie existiert. Zurück zu den Büchern."
    },
    shell: {
      loadingMetadata: "App-Daten werden geladen",
      workspace: "Arbeitsbereich",
      profile: "Profil",
      security: "Sicherheit",
      updates: "Updates",
      myReports: "Meine Meldungen",
      myBooks: "Meine Bücher",
      requests: "Anfragen",
      offers: "Angebote",
      history: "Verlauf",
      users: "Benutzer",
      books: "Bücher",
      reports: "Meldungen",
      exchanges: "Meine Tauschvorgänge",
      manageUsers: "Benutzerverwaltung",
      manageBooks: "Buchverwaltung",
      manageReports: "Beschwerdeverwaltung",
      manageExchanges: "Tauschverwaltung",
      admin: "Admin",
      superAdmin: "Super-Admin",
      moderation: "Moderation",
      openAdminArea: "Adminbereich öffnen",
      logout: "Abmelden",
      adminMode: "Admin-Modus",
      signedIn: "Angemeldet",
      moderationConsole: "Moderationskonsole",
      frontendWorkspace: "Frontend-Arbeitsbereich",
      unknownUser: "Unbekannter Benutzer",
      noEmail: "Keine E-Mail"
    },
    routeGuards: {
      loadingWorkspace: "Arbeitsbereich wird geladen",
      refreshingSession: "Sitzung wird aktualisiert",
      workspaceError: "Der Arbeitsbereich konnte nicht geladen werden",
      checkingAdmin: "Adminzugriff wird geprüft",
      refreshingAdmin: "Adminzugriff wird aktualisiert",
      adminError: "Etwas ist schiefgelaufen"
    },
    auth: {
      signInEyebrow: "Anmelden",
      signInTitle: "Melde dich in deinem Konto an",
      signInDescription: "Verwende deine E-Mail-Adresse und dein Passwort, um fortzufahren.",
      noAccount: "Noch kein Konto?",
      createOne: "Konto erstellen",
      email: "E-Mail",
      password: "Passwort",
      signingIn: "Anmeldung läuft...",
      forgotPasswordTitle: "E-Mail zum Zurücksetzen des Passworts anfordern",
      forgotPasswordDescription:
        "Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Festlegen eines neuen Passworts.",
      sendResetLink: "Passwort zurücksetzen",
      resendTitle: "Neue Bestätigungs-E-Mail senden",
      resendDescription:
        "Gib deine E-Mail-Adresse ein und wir senden dir einen neuen Bestätigungslink.",
      resendConfirmation: "E-Mail erneut senden",
      alreadyConfirmed: "Bereits bestätigt?",
      backToLogin: "Zur Anmeldung",
      registerEyebrow: "Registrieren",
      registerTitle: "Erstelle dein Konto",
      registerDescription:
        "Erstelle dein Book-Exchange-Konto und wähle die Sprache für Oberfläche und E-Mails.",
      registrationDataError: "Registrierungsdaten konnten nicht geladen werden",
      nickname: "Nickname",
      locale: "Sprache",
      creatingAccount: "Konto wird erstellt...",
      createAccount: "Konto erstellen",
      alreadyRegistered: "Bereits registriert?",
      goToLogin: "Zur Anmeldung",
      nextStepsTitle: "Wie geht es weiter?",
      nextStepsDescription:
        "Deine Bestätigungs-E-Mail liegt im Demo-Postfach bereit. Bestätige deine Adresse, um das Konto fertig einzurichten.",
      requestDeleteTitle: "Link zur Kontolöschung anfordern",
      requestDeleteDescription:
        "Gib deine E-Mail-Adresse ein und wir senden dir einen Link zur Bestätigung der Kontolöschung.",
      sendDeletionEmail: "Link zur Kontolöschung senden",
      verifyEyebrow: "Bestätigen",
      verifyTitle: "E-Mail-Bestätigung",
      verifyDescription:
        "Bestätige deine E-Mail-Adresse, um dein Konto einzurichten und Bücher zu tauschen.",
      verifyAction: "E-Mail bestätigen",
      freshConfirmationTitle: "Neuen Bestätigungslink anfordern?",
      freshConfirmationDescription:
        "Gib deine E-Mail-Adresse ein und wir senden dir eine neue Bestätigungs-E-Mail.",
      sendNewConfirmation: "Neue Bestätigungs-E-Mail senden",
      emailConfirmed: "Deine E-Mail-Adresse wurde bestätigt. Willkommen bei Book Exchange!",
      resetEyebrow: "Zurücksetzen",
      resetTitle: "Neues Passwort erstellen",
      resetDescription: "Gib ein neues Passwort für dein Konto ein.",
      newPassword: "Neues Passwort",
      confirmPassword: "Neues Passwort wiederholen",
      passwordMismatch: "Die Passwörter stimmen nicht überein",
      holdToShowPassword: "Gedrückt halten, um das Passwort anzuzeigen",
      signInAccount: "Im Konto anmelden",
      resettingPassword: "Passwort wird zurückgesetzt...",
      resetPassword: "Passwort zurücksetzen",
      passwordChanged: "Dein Passwort wurde geändert.",
      requestFreshResetTitle: "Neuen Reset-Link anfordern",
      requestFreshResetDescription:
        "Wenn der alte Link abgelaufen ist oder nicht mehr funktioniert, gib deine E-Mail-Adresse ein und wir senden dir einen neuen.",
      sendNewReset: "Neue Reset-E-Mail senden",
      deleteEyebrow: "Löschen",
      deleteTitle: "Kontolöschung bestätigen",
      deleteDescription: "Bestätige, dass du dein Konto dauerhaft löschen möchtest.",
      deleteAction: "Konto löschen",
      deletedSuccess: "Dein Konto wurde gelöscht.",
      newDeletionTitle: "Neuen Löschungslink anfordern?",
      newDeletionDescription:
        "Gib deine E-Mail-Adresse ein und wir senden dir einen neuen Link zur Kontolöschung.",
      sendNewDeletion: "E-Mail erneut senden",
      processing: "Wird verarbeitet...",
      sending: "Wird gesendet...",
      accountNeedsConfirmationTitle: "Dein Konto muss noch bestätigt werden",
      accountNeedsConfirmationDescription:
        "Fordere eine neue Bestätigungs-E-Mail an und aktiviere dein Konto.",
      bannedTitle: "Möchtest du ein gesperrtes Konto löschen?",
      bannedDescription: "Du kannst ohne Anmeldung einen Link zur Kontolöschung anfordern.",
      wrongPasswordTitle: "Passwort vergessen?",
      wrongPasswordDescription:
        "Sende dir eine E-Mail zum Zurücksetzen des Passworts und vergib ein neues Passwort.",
      requestDeletionEmail: "Link zur Kontolöschung anfordern",
      openDemoInbox: "Demo-Postfach öffnen"
    },
    profile: {
      eyebrow: "Profil",
      title: "Kontoeinstellungen",
      description: "Verwalte deine persönlichen Daten und deine Sicherheit.",
      currentData: "Profildaten",
      currentDataDescription: "Dein Foto wird per Foto-URL direkt vom Server geladen.",
      roles: "Rollen",
      version: "Version / ETag",
      bannedUntil: "Gesperrt bis",
      banReason: "Sperrgrund",
      noRoles: "Keine Rollen",
      notSet: "Nicht gesetzt",
      none: "Keine",
      editTitle: "Profil bearbeiten",
      profilePhoto: "Profilfoto",
      saveProfile: "Nickname aktualisieren",
      saving: "Wird gespeichert...",
      updated: "Profil erfolgreich aktualisiert.",
      photoUploaded: "Profilfoto wurde hochgeladen.",
      deletePhotoConfirm: "Aktuelles Profilfoto löschen?",
      photoDeleted: "Profilfoto gelöscht."
    },
    security: {
      eyebrow: "Sicherheit",
      title: "Sitzung und Passwort",
      description: "Ändere dein Passwort, melde dich ab oder lösche dein Konto.",
      changePassword: "Passwort ändern",
      currentPassword: "Aktuelles Passwort",
      updating: "Wird aktualisiert...",
      changed: "Das Passwort wurde geändert.",
      sessionActions: "Sitzungsaktionen",
      currentProfileVersion: "Aktuelle Profilversion",
      unknownVersion: "unbekannt",
      logoutCurrentSession: "Abmelden",
      deletingAccount: "Konto wird gelöscht...",
      deleteAccount: "Konto löschen",
      deleteConfirm:
        "Aktuelles Konto löschen? Diese Aktion entfernt dein Konto dauerhaft.",
      publicDeleteFlowPrefix: "Kein Zugriff mehr später? Du kannst auch den öffentlichen",
      publicDeleteFlowLink: "E-Mail-Flow zur Kontolöschung"
    }
  },
  ru: {
    common: {
      appName: "Book Exchange",
      home: "Главная",
      catalog: "Каталог",
      demoInbox: "Демо-почта",
      about: "О проекте",
      login: "Войти",
      register: "Регистрация",
      language: "Язык",
      signIn: "Вход",
      goHome: "На главную",
      backHome: "На главную",
      loading: "Загрузка",
      unexpectedError: "Непредвиденная ошибка",
      somethingWentWrong: "Что-то пошло не так",
      unknown: "Неизвестно",
      notAvailable: "Недоступно"
    },
    homePage: {
      phase: "Демо",
      title: "Проверь свой backend через современный React-фронтенд",
      description:
        "Просматривай публичный каталог, входи в аккаунт и тестируй реальные API-сценарии, уже подключённые к этому интерфейсу.",
      openCatalog: "Открыть каталог",
      signIn: "Войти",
      catalogTitle: "Публичный каталог",
      catalogDescription:
        "Ищи книги, открывай публичные страницы книг и проверяй реальные catalog endpoint'ы.",
      authTitle: "Работа с аккаунтом",
      authDescription:
        "Регистрация, подтверждение эл. почты, сброс пароля и удаление аккаунта уже подключены.",
      workspaceTitle: "Личный кабинет",
      workspaceDescription:
        "Профиль, безопасность, книги, обмены, уведомления и жалобы доступны после входа.",
      metadataTitle: "Данные приложения",
      metadataLoading: "Данные приложения загружаются.",
      locales: "Языки",
      reportReasons: "Причины жалоб",
      exchangeStatuses: "Статусы обменов",
      bookSortFields: "Поля сортировки книг"
    },
    catalog: {
      eyebrow: "Публичный API",
      title: "Каталог",
      description:
        "Просматривайте публичные книги, используйте фильтры и открывайте реальные страницы книг из вашего API.",
      searchText: "Текст поиска",
      author: "Автор",
      category: "Категория",
      city: "Город",
      publicationYear: "Год публикации",
      giftOnly: "Только подарки",
      sortField: "Поле сортировки",
      sortDirection: "Направление сортировки",
      all: "Все",
      giftOnlyOption: "Только подарки",
      exchangeOnly: "Только обмен",
      defaultSort: "По умолчанию",
      ascending: "По возрастанию",
      descending: "По убыванию",
      resetFilters: "Сбросить фильтры",
      booksMatched: "Найдено книг: {count}",
      loading: "Загрузка каталога",
      requestFailed: "Не удалось загрузить каталог",
      noBooks: "Книги не найдены",
      noBooksDescription: "Попробуйте расширить поиск или убрать часть фильтров.",
      gift: "Подарок",
      exchange: "Обмен",
      noCity: "Город не указан",
      unknownYear: "Год неизвестен",
      noDescription: "Для этой книги пока нет публичного описания.",
      unknownOwner: "Неизвестный владелец"
    },
    notFound: {
      title: "Страница не найдена",
      description: "Возможно, страница переехала или такой ссылки никогда не было. Вернёмся к книгам."
    },
    shell: {
      loadingMetadata: "Загрузка данных приложения",
      workspace: "Кабинет",
      profile: "Профиль",
      security: "Безопасность",
      updates: "Обновления",
      myReports: "Мои жалобы",
      myBooks: "Мои книги",
      requests: "Запросы",
      offers: "Предложения",
      history: "История",
      users: "Пользователи",
      books: "Книги",
      reports: "Жалобы",
      exchanges: "Мои обмены",
      manageUsers: "Управление пользователями",
      manageBooks: "Управление книгами",
      manageReports: "Управление жалобами",
      manageExchanges: "Управление обменами",
      admin: "Админ",
      superAdmin: "Супер админ",
      moderation: "Модерация",
      openAdminArea: "Открыть админку",
      logout: "Выйти",
      adminMode: "Режим администратора",
      signedIn: "Вы вошли",
      moderationConsole: "Панель модерации",
      frontendWorkspace: "Рабочее пространство фронтенда",
      unknownUser: "Неизвестный пользователь",
      noEmail: "Нет эл. почты"
    },
    routeGuards: {
      loadingWorkspace: "Загрузка рабочего пространства",
      refreshingSession: "Обновление сессии",
      workspaceError: "Не удалось загрузить рабочее пространство",
      checkingAdmin: "Проверка доступа администратора",
      refreshingAdmin: "Обновление админ-сессии",
      adminError: "Что-то пошло не так"
    },
    auth: {
      signInEyebrow: "Вход",
      signInTitle: "Вход в систему",
      signInDescription: "Используйте эл. почту и пароль, чтобы продолжить.",
      noAccount: "Ещё нет аккаунта?",
      createOne: "Создать аккаунт",
      email: "Эл. почта",
      password: "Пароль",
      signingIn: "Вход...",
      forgotPasswordTitle: "Запросить письмо для сброса пароля",
      forgotPasswordDescription:
        "Введите эл. почту, и мы отправим вам ссылку для установки нового пароля.",
      sendResetLink: "Сбросить пароль",
      resendTitle: "Отправить новое письмо подтверждения",
      resendDescription:
        "Введите эл. почту, и мы отправим вам новую ссылку для подтверждения.",
      resendConfirmation: "Отправить письмо повторно",
      alreadyConfirmed: "Уже подтвердили аккаунт?",
      backToLogin: "Назад ко входу",
      registerEyebrow: "Регистрация",
      registerTitle: "Создание уч. записи",
      registerDescription:
        "Создайте аккаунт Book Exchange и выберите язык интерфейса и писем.",
      registrationDataError: "Не удалось загрузить данные для регистрации",
      nickname: "Никнейм",
      locale: "Язык",
      creatingAccount: "Создание аккаунта...",
      createAccount: "Создать аккаунт",
      alreadyRegistered: "Уже зарегистрированы?",
      goToLogin: "Перейти ко входу",
      nextStepsTitle: "Что дальше?",
      nextStepsDescription:
        "Письмо с подтверждением уже ждёт в демо-почте. Подтвердите адрес, чтобы завершить создание аккаунта.",
      requestDeleteTitle: "Запросить ссылку на удаление аккаунта",
      requestDeleteDescription:
        "Введите эл. почту, и мы отправим вам ссылку для подтверждения удаления аккаунта.",
      sendDeletionEmail: "Отправить ссылку на удаление аккаунта",
      verifyEyebrow: "Подтверждение",
      verifyTitle: "Подтверждение эл. почты",
      verifyDescription:
        "Подтвердите эл. почту, чтобы завершить настройку аккаунта и начать обмениваться книгами.",
      verifyAction: "Подтвердить эл. почту",
      freshConfirmationTitle: "Нужна новая ссылка подтверждения?",
      freshConfirmationDescription:
        "Введите эл. почту, и мы отправим вам новое письмо для подтверждения.",
      sendNewConfirmation: "Отправить новое письмо подтверждения",
      emailConfirmed: "Ваша эл. почта успешно подтверждена. Добро пожаловать в Book Exchange!",
      resetEyebrow: "Сброс",
      resetTitle: "Придумайте новый пароль",
      resetDescription: "Введите новый пароль для вашего аккаунта.",
      newPassword: "Новый пароль",
      confirmPassword: "Повторите новый пароль",
      passwordMismatch: "Пароли не совпадают",
      holdToShowPassword: "Удерживайте, чтобы показать пароль",
      signInAccount: "Войти в уч. запись",
      resettingPassword: "Сброс пароля...",
      resetPassword: "Сбросить пароль",
      passwordChanged: "Ваш пароль был изменён.",
      requestFreshResetTitle: "Запросить новую ссылку",
      requestFreshResetDescription:
        "Если старая ссылка истекла или не работает, введите эл. почту, и мы отправим новую.",
      sendNewReset: "Отправить новое письмо",
      deleteEyebrow: "Удаление",
      deleteTitle: "Подтверждение удаления аккаунта",
      deleteDescription: "Подтвердите, что хотите навсегда удалить аккаунт.",
      deleteAction: "Удалить аккаунт",
      deletedSuccess: "Ваш аккаунт был удалён.",
      newDeletionTitle: "Нужна новая ссылка на удаление?",
      newDeletionDescription:
        "Введите эл. почту, и мы отправим вам новую ссылку для подтверждения удаления аккаунта.",
      sendNewDeletion: "Отправить письмо повторно",
      processing: "Обработка...",
      sending: "Отправка...",
      accountNeedsConfirmationTitle: "Аккаунт ещё не подтверждён",
      accountNeedsConfirmationDescription:
        "Запросите новое письмо подтверждения и завершите активацию аккаунта.",
      bannedTitle: "Нужно удалить заблокированный аккаунт?",
      bannedDescription: "Вы можете запросить ссылку на удаление аккаунта без входа.",
      wrongPasswordTitle: "Забыли пароль?",
      wrongPasswordDescription:
        "Отправьте себе письмо для сброса пароля и выберите новый пароль.",
      requestDeletionEmail: "Запросить ссылку на удаление аккаунта",
      openDemoInbox: "Открыть демо-почту"
    },
    profile: {
      eyebrow: "Профиль",
      title: "Настройки аккаунта",
      description: "Управляйте своими данными и безопасностью.",
      currentData: "Данные профиля",
      currentDataDescription:
        "Фотография подгружается с сервера по `photoUrl`.",
      roles: "Роли",
      version: "Версия / ETag",
      bannedUntil: "Бан до",
      banReason: "Причина бана",
      noRoles: "Нет ролей",
      notSet: "Не задано",
      none: "Нет",
      editTitle: "Редактировать профиль",
      profilePhoto: "Фото профиля",
      saveProfile: "Сохранить профиль",
      saving: "Сохранение...",
      updated: "Профиль успешно обновлён.",
      deletePhotoConfirm: "Удалить текущую фотографию профиля?",
      photoDeleted: "Фотография профиля удалена."
    },
    security: {
      eyebrow: "Безопасность",
      title: "Сессия и пароль",
      description: "Меняйте пароль, выходите из аккаунта или удаляйте аккаунт.",
      changePassword: "Сменить пароль",
      currentPassword: "Текущий пароль",
      updating: "Обновление...",
      changed: "Пароль был изменён.",
      sessionActions: "Действия с сессией",
      currentProfileVersion: "Текущая версия профиля",
      unknownVersion: "неизвестно",
      logoutCurrentSession: "Выйти",
      deletingAccount: "Удаление аккаунта...",
      deleteAccount: "Удалить аккаунт",
      deleteConfirm:
        "Удалить текущий аккаунт? Это действие безвозвратно удалит ваш аккаунт.",
      publicDeleteFlowPrefix: "Если потом не будет доступа, вы также можете использовать публичный",
      publicDeleteFlowLink: "письмо для удаления аккаунта"
    }
  }
};

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => readStoredLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    let cancelled = false;

    if (hasStoredLocalePreference()) {
      return undefined;
    }

    void detectLocaleFromIp().then((detectedLocale) => {
      if (cancelled || hasStoredLocalePreference()) {
        return;
      }

      setLocaleState(normalizeLocale(detectedLocale));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = (nextLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale);
    writeStoredLocale(normalizedLocale);
    setLocaleState(normalizedLocale);
  };

  const value = useMemo(() => {
    function t(key, replacements = {}) {
      const message = resolveMessage(messages[locale], key) ?? resolveMessage(messages.en, key) ?? key;

      return Object.entries(replacements).reduce(
        (current, [replacementKey, replacementValue]) =>
          current.replaceAll(`{${replacementKey}}`, String(replacementValue)),
        message
      );
    }

    return {
      locale,
      locales: SUPPORTED_LOCALES,
      localeLabel: getLocaleLabel(locale),
      setLocale,
      t
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}

function resolveMessage(source, key) {
  return key.split(".").reduce((current, segment) => current?.[segment], source);
}
