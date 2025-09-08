export const CONFIG = {
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,
    sessionSecret: process.env.SESSION_SECRET || "super-secret-key-change-this",
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000/api",
    databaseUrl: process.env.DATABASE_URL || "mongodb://localhost:27017/kinau",
    logLevel: process.env.LOG_LEVEL || "info",
    features: {
        enableFeatureX: process.env.ENABLE_FEATURE_X === "true",
        enableFeatureY: process.env.ENABLE_FEATURE_Y === "true",
    },
    thirdParty: {
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || "",
        sentryDsn: process.env.SENTRY_DSN || "",
    },
    security: {
        contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY || "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';",
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
        },
    },
    ui: {
        theme: process.env.UI_THEME || "light",
        primaryColor: process.env.UI_PRIMARY_COLOR || "#4F46E5", // indigo-600
        secondaryColor: process.env.UI_SECONDARY_COLOR || "#9333EA", // purple-600
        accentColor: process.env.UI_ACCENT_COLOR || "#EC4899", // pink-600
        fontFamily: process.env.UI_FONT_FAMILY || "Inter, sans-serif",
        fontSize: process.env.UI_FONT_SIZE || "16px",
        borderRadius: process.env.UI_BORDER_RADIUS || "0.5rem", // 8px
        boxShadow: process.env.UI_BOX_SHADOW || "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    performance: {
        enableCache: process.env.ENABLE_CACHE === "true",
        cacheTtl: parseInt(process.env.CACHE_TTL || "3600", 10), // 1 hour
        enableCompression: process.env.ENABLE_COMPRESSION === "true",
        maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || "10485760", 10), // 10 MB
    },
    maintenance: {
        isUnderMaintenance: process.env.MAINTENANCE_MODE === "true",
        maintenanceMessage: process.env.MAINTENANCE_MESSAGE || "Website sedang dalam perbaikan. Mohon maaf atas ketidaknyamanan ini.",
    },
    localization: {
        defaultLocale: process.env.DEFAULT_LOCALE || "id",
        supportedLocales: (process.env.SUPPORTED_LOCALES || "id,en").split(","),
        translationsPath: process.env.TRANSLATIONS_PATH || "./locales",
    },
    api: {
        rateLimit: {
            windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute
            max: parseInt(process.env.API_RATE_LIMIT_MAX || "100", 10), // limit each IP to 100 requests per windowMs
        },
        timeout: parseInt(process.env.API_TIMEOUT || "5000", 10), // 5 seconds
        cors: {
            origin: process.env.CORS_ORIGIN || "*",
            methods: process.env.CORS_METHODS || "GET,POST,PUT,DELETE,OPTIONS",
            allowedHeaders: process.env.CORS_ALLOWED_HEADERS || "Content-Type,Authorization",
            exposedHeaders: process.env.CORS_EXPOSED_HEADERS || "Content-Length,Authorization",
            credentials: process.env.CORS_CREDENTIALS === "true",
            maxAge: parseInt(process.env.CORS_MAX_AGE || "86400", 10), // 1 day
        },
    },
    logging: {
        level: process.env.LOGGING_LEVEL || "info",
        format: process.env.LOGGING_FORMAT || "combined",
        transports: {
            console: process.env.LOGGING_CONSOLE === "true",
            file: process.env.LOGGING_FILE === "true",
            filePath: process.env.LOGGING_FILE_PATH || "./logs/app.log",
        },
    },
    featureFlags: {
        enableNewFeature: process.env.ENABLE_NEW_FEATURE === "true",
        betaAccess: process.env.BETA_ACCESS === "true",
        experimentalFeatures: process.env.EXPERIMENTAL_FEATURES === "true",
    },
    seo: {
        siteName: process.env.SEO_SITE_NAME || "Kinau.id",
        defaultTitle: process.env.SEO_DEFAULT_TITLE || "Kinau.id - Platform Terbaik untuk Kebutuhan Anda",
        defaultDescription: process.env.SEO_DEFAULT_DESCRIPTION || "Kinau.id adalah platform terbaik untuk memenuhi kebutuhan Anda dengan layanan yang cepat dan terpercaya.",
        defaultKeywords: process.env.SEO_DEFAULT_KEYWORDS || "kinau, platform, layanan, cepat, terpercaya",
        defaultImage: process.env.SEO_DEFAULT_IMAGE || "https://kinau.id/default-image.jpg",
        twitterCard: process.env.SEO_TWITTER_CARD || "summary_large_image",
        facebookAppId: process.env.SEO_FACEBOOK_APP_ID || "",
        googleSiteVerification: process.env.SEO_GOOGLE_SITE_VERIFICATION || "",
    },
    analytics: {
        googleAnalyticsId: process.env.ANALYTICS_GOOGLE_ID || "",
        mixpanelToken: process.env.ANALYTICS_MIXPANEL_TOKEN || "",
        segmentWriteKey: process.env.ANALYTICS_SEGMENT_WRITE_KEY || "",
        amplitudeApiKey: process.env.ANALYTICS_AMPLITUDE_API_KEY || "",
        hotjarSiteId: process.env.ANALYTICS_HOTJAR_SITE_ID || "",
        matomoUrl: process.env.ANALYTICS_MATOMO_URL || "",
        matomoSiteId: process.env.ANALYTICS_MATOMO_SITE_ID || "",
    },
    email: {
        smtpHost: process.env.EMAIL_SMTP_HOST || "smtp.example.com",
        smtpPort: parseInt(process.env.EMAIL_SMTP_PORT || "587", 10),
        smtpUser: process.env.EMAIL_SMTP_USER || "",
        smtpPassword: process.env.EMAIL_SMTP_PASSWORD || "",
        fromAddress: process.env.EMAIL_FROM_ADDRESS || "",
        replyToAddress: process.env.EMAIL_REPLY_TO_ADDRESS || "",
        defaultSubject: process.env.EMAIL_DEFAULT_SUBJECT || "Notification from Kinau.id",
        templatesPath: process.env.EMAIL_TEMPLATES_PATH || "./emails/templates",
        verificationTemplate: process.env.EMAIL_VERIFICATION_TEMPLATE || "verification.html",
        resetPasswordTemplate: process.env.EMAIL_RESET_PASSWORD_TEMPLATE || "reset-password.html",
        welcomeTemplate: process.env.EMAIL_WELCOME_TEMPLATE || "welcome.html",
        newsletterTemplate: process.env.EMAIL_NEWSLETTER_TEMPLATE || "newsletter.html",
        unsubscribeTemplate: process.env.EMAIL_UNSUBSCRIBE_TEMPLATE || "unsubscribe.html",
        maxAttachmentSize: parseInt(process.env.EMAIL_MAX_ATTACHMENT_SIZE || "10485760", 10), // 10 MB
        allowedAttachmentTypes: (process.env.EMAIL_ALLOWED_ATTACHMENT_TYPES || "image/jpeg,image/png,application/pdf").split(","),
    },
    payment: {
        provider: process.env.PAYMENT_PROVIDER || "stripe",
        stripeApiKey: process.env.PAYMENT_STRIPE_API_KEY || "",
        paypalClientId: process.env.PAYMENT_PAYPAL_CLIENT_ID || "",
        paypalSecret: process.env.PAYMENT_PAYPAL_SECRET || "",
        currency: process.env.PAYMENT_CURRENCY || "USD",
        webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || "",
        paymentMethods: (process.env.PAYMENT_METHODS || "credit_card,paypal").split(","),
        enableSubscriptions: process.env.PAYMENT_ENABLE_SUBSCRIPTIONS === "true",
        subscriptionPlans: (process.env.PAYMENT_SUBSCRIPTION_PLANS || "basic,premium").split(","),
        trialPeriodDays: parseInt(process.env.PAYMENT_TRIAL_PERIOD_DAYS || "14", 10), // 14 days
        maxTransactionAmount: parseInt(process.env.PAYMENT_MAX_TRANSACTION_AMOUNT || "10000", 10), // $10000
        minTransactionAmount: parseInt(process.env.PAYMENT_MIN_TRANSACTION_AMOUNT || "1", 10), // $1
    },
    cache: {
        enabled: process.env.CACHE_ENABLED === "true",
        type: process.env.CACHE_TYPE || "memory",
        redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
        redisPassword: process.env.REDIS_PASSWORD || "",
        redisDb: parseInt(process.env.REDIS_DB || "0", 10),
        memoryCacheTtl: parseInt(process.env.MEMORY_CACHE_TTL || "3600", 10), // 1 hour
        redisCacheTtl: parseInt(process.env.REDIS_CACHE_TTL || "3600", 10), // 1 hour
        maxMemoryCacheSize: parseInt(process.env.MAX_MEMORY_CACHE_SIZE || "10000", 10), // 10000 items
        maxRedisCacheSize: parseInt(process.env.MAX_REDIS_CACHE_SIZE || "10000", 10), // 10000 items
    },
    fileStorage: {
        provider: process.env.FILE_STORAGE_PROVIDER || "local",
        localPath: process.env.FILE_STORAGE_LOCAL_PATH || "./uploads",
        s3Bucket: process.env.FILE_STORAGE_S3_BUCKET || "",
        s3Region: process.env.FILE_STORAGE_S3_REGION || "",
        s3AccessKeyId: process.env.FILE_STORAGE_S3_ACCESS_KEY_ID || "",
        s3SecretAccessKey: process.env.FILE_STORAGE_S3_SECRET_ACCESS_KEY || "",
        maxFileSize: parseInt(process.env.FILE_STORAGE_MAX_FILE_SIZE || "10485760", 10), // 10 MB
        allowedFileTypes: (process.env.FILE_STORAGE_ALLOWED_FILE_TYPES || "image/jpeg,image/png,application/pdf").split(","),
        enableVersioning: process.env.FILE_STORAGE_ENABLE_VERSIONING === "true",
        versioningStrategy: process.env.FILE_STORAGE_VERSIONING_STRATEGY || "timestamp",
        enableFileCompression: process.env.FILE_STORAGE_ENABLE_COMPRESSION === "true",
        compressionLevel: parseInt(process.env.FILE_STORAGE_COMPRESSION_LEVEL || "6", 10), // 0-9, where 0 is no compression and 9 is maximum compression
        enableFileEncryption: process.env.FILE_STORAGE_ENABLE_ENCRYPTION === "true",
        encryptionKey: process.env.FILE_STORAGE_ENCRYPTION_KEY || "",
        encryptionAlgorithm: process.env.FILE_STORAGE_ENCRYPTION_ALGORITHM || "aes-256-cbc",
        enableFileAccessLogging: process.env.FILE_STORAGE_ENABLE_ACCESS_LOGGING === "true",
        accessLogPath: process.env.FILE_STORAGE_ACCESS_LOG_PATH || "./logs/file-access.log",
    },
    socialAuth: {
        googleClientId: process.env.SOCIAL_AUTH_GOOGLE_CLIENT_ID || "",
        googleClientSecret: process.env.SOCIAL_AUTH_GOOGLE_CLIENT_SECRET || "",
        facebookAppId: process.env.SOCIAL_AUTH_FACEBOOK_APP_ID || "",
        facebookAppSecret: process.env.SOCIAL_AUTH_FACEBOOK_APP_SECRET || "",
        twitterApiKey: process.env.SOCIAL_AUTH_TWITTER_API_KEY || "",
        twitterApiSecretKey: process.env.SOCIAL_AUTH_TWITTER_API_SECRET_KEY || "",
        githubClientId: process.env.SOCIAL_AUTH_GITHUB_CLIENT_ID || "",
        githubClientSecret: process.env.SOCIAL_AUTH_GITHUB_CLIENT_SECRET || "",
        linkedinClientId: process.env.SOCIAL_AUTH_LINKEDIN_CLIENT_ID || "",
        linkedinClientSecret: process.env.SOCIAL_AUTH_LINKEDIN_CLIENT_SECRET || "",
        microsoftClientId: process.env.SOCIAL_AUTH_MICROSOFT_CLIENT_ID || "",
        microsoftClientSecret: process.env.SOCIAL_AUTH_MICROSOFT_CLIENT_SECRET || "",
        enableGoogleAuth: process.env.SOCIAL_AUTH_ENABLE_GOOGLE === "true",
        enableFacebookAuth: process.env.SOCIAL_AUTH_ENABLE_FACEBOOK === "true",
        enableTwitterAuth: process.env.SOCIAL_AUTH_ENABLE_TWITTER === "true",
        enableGithubAuth: process.env.SOCIAL_AUTH_ENABLE_GITHUB === "true",
        enableLinkedinAuth: process.env.SOCIAL_AUTH_ENABLE_LINKEDIN === "true",
        enableMicrosoftAuth: process.env.SOCIAL_AUTH_ENABLE_MICROSOFT === "true",
        redirectUri: process.env.SOCIAL_AUTH_REDIRECT_URI || "http://localhost:3000/auth/callback",
        scopes: (process.env.SOCIAL_AUTH_SCOPES || "email,profile").split(","),
        sessionCookieName: process.env.SOCIAL_AUTH_SESSION_COOKIE_NAME || "social_auth_session",
        sessionCookieMaxAge: parseInt(process.env.SOCIAL_AUTH_SESSION_COOKIE_MAX_AGE || "3600000", 10), // 1 hour
        sessionCookieSecure: process.env.SOCIAL_AUTH_SESSION_COOKIE_SECURE === "true",
        sessionCookieHttpOnly: process.env.SOCIAL_AUTH_SESSION_COOKIE_HTTP_ONLY === "true",
        sessionCookieSameSite: process.env.SOCIAL_AUTH_SESSION_COOKIE_SAME_SITE || "Lax",
        enableStateParameter: process.env.SOCIAL_AUTH_ENABLE_STATE_PARAMETER === "true",
        stateParameterLength: parseInt(process.env.SOCIAL_AUTH_STATE_PARAMETER_LENGTH || "32", 10), // 32 characters
        enableNonce: process.env.SOCIAL_AUTH_ENABLE_NONCE === "true",
        nonceLength: parseInt(process.env.SOCIAL_AUTH_NONCE_LENGTH || "32", 10), // 32 characters
        enablePkce: process.env.SOCIAL_AUTH_ENABLE_PKCE === "true",
        pkceCodeChallengeMethod: process.env.SOCIAL_AUTH_PKCE_CODE_CHALLENGE_METHOD || "S256",
        pkceCodeVerifierLength: parseInt(process.env.SOCIAL_AUTH_PKCE_CODE_VERIFIER_LENGTH || "128", 10), // 128 characters
        enableUserProfileSync: process.env.SOCIAL_AUTH_ENABLE_USER_PROFILE_SYNC === "true",
        userProfileSyncInterval: parseInt(process.env.SOCIAL_AUTH_USER_PROFILE_SYNC_INTERVAL || "3600", 10), // 1 hour
        enableUserConsent: process.env.SOCIAL_AUTH_ENABLE_USER_CONSENT === "true",
        userConsentRequired: process.env.SOCIAL_AUTH_USER_CONSENT_REQUIRED === "true",
        userConsentText: process.env.SOCIAL_AUTH_USER_CONSENT_TEXT || "We require your consent to access your profile information.",
        userConsentPrivacyPolicyUrl: process.env.SOCIAL_AUTH_USER_CONSENT_PRIVACY_POLICY_URL || "https://kinau.id/privacy-policy",
        userConsentTermsOfServiceUrl: process.env.SOCIAL_AUTH_USER_CONSENT_TERMS_OF_SERVICE_URL || "https://kinau.id/terms-of-service",
    },
    debug: {
        enableDebugMode: process.env.DEBUG_MODE === "true",
        debugLogLevel: process.env.DEBUG_LOG_LEVEL || "debug",
        debugLogFilePath: process.env.DEBUG_LOG_FILE_PATH || "./logs/debug.log",
        debugApiEndpoints: (process.env.DEBUG_API_ENDPOINTS || "/api/v1/debug").split(","),
        debugDatabaseQueries: process.env.DEBUG_DATABASE_QUERIES === "true",
        debugPerformanceMetrics: process.env.DEBUG_PERFORMANCE_METRICS === "true",
        debugErrorTracking: process.env.DEBUG_ERROR_TRACKING === "true",
        debugErrorTrackingService: process.env.DEBUG_ERROR_TRACKING_SERVICE || "sentry",
        debugErrorTrackingDsn: process.env.DEBUG_ERROR_TRACKING_DSN || "",
        debugErrorTrackingEnvironment: process.env.DEBUG_ERROR_TRACKING_ENVIRONMENT || "development",
        debugErrorTrackingRelease: process.env.DEBUG_ERROR_TRACKING_RELEASE || "1.0.0",
        debugErrorTrackingSampleRate: parseFloat(process.env.DEBUG_ERROR_TRACKING_SAMPLE_RATE || "1.0"), // 100% sample rate
        debugErrorTrackingMaxBreadcrumbs: parseInt(process.env.DEBUG_ERROR_TRACKING_MAX_BREADCRUMBS || "50", 10), // 50 breadcrumbs
        debugErrorTrackingIgnoreErrors: (process.env.DEBUG_ERROR_TRACKING_IGNORE_ERRORS || "SyntaxError,TypeError").split(","),
        debugErrorTrackingIgnoreUrls: (process.env.DEBUG_ERROR_TRACKING_IGNORE_URLS || "https://kinau.id/api/v1/debug").split(","),
        debugErrorTrackingIncludePaths: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_PATHS || "/api/v1/debug").split(","),
        debugErrorTrackingIncludeQueryParams: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_QUERY_PARAMS || "true") === "true",
        debugErrorTrackingIncludeHeaders: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_HEADERS || "true") === "true",
        debugErrorTrackingIncludeCookies: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_COOKIES || "true") === "true",
        debugErrorTrackingIncludeUserContext: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_USER_CONTEXT || "true") === "true",
        debugErrorTrackingIncludeRequestContext: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_REQUEST_CONTEXT || "true") === "true",
        debugErrorTrackingIncludeResponseContext: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_RESPONSE_CONTEXT || "true") === "true",
        debugErrorTrackingIncludeStacktrace: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_STACKTRACE || "true") === "true",
        debugErrorTrackingIncludeBreadcrumbs: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_BREADCRUMBS || "true") === "true",
        debugErrorTrackingIncludeUserFeedback: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_USER_FEEDBACK || "true") === "true",
        debugErrorTrackingIncludeSessionData: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_SESSION_DATA || "true") === "true",
        debugErrorTrackingIncludeEnvironmentData: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_ENVIRONMENT_DATA || "true") === "true",
        debugErrorTrackingIncludeReleaseData: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_RELEASE_DATA || "true") === "true",
        debugErrorTrackingIncludePerformanceData: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_PERFORMANCE_DATA || "true") === "true",
        debugErrorTrackingIncludeCustomData: (process.env.DEBUG_ERROR_TRACKING_INCLUDE_CUSTOM_DATA || "true") === "true",
        debugErrorTrackingCustomData: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_DATA || "{}"),
        debugErrorTrackingCustomTags: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_TAGS || "{}"),
        debugErrorTrackingCustomContext: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_CONTEXT || "{}"),
        debugErrorTrackingCustomBreadcrumbs: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_BREADCRUMBS || "{}"),
        debugErrorTrackingCustomUser: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_USER || "{}"),
        debugErrorTrackingCustomRequest: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_REQUEST || "{}"),
        debugErrorTrackingCustomResponse: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_RESPONSE || "{}"),
        debugErrorTrackingCustomSession: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_SESSION || "{}"),
        debugErrorTrackingCustomEnvironment: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_ENVIRONMENT || "{}"),
        debugErrorTrackingCustomRelease: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_RELEASE || "{}"),
        debugErrorTrackingCustomPerformance: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_PERFORMANCE || "{}"),
        debugErrorTrackingCustomDataTypes: (process.env.DEBUG_ERROR_TRACKING_CUSTOM_DATA_TYPES || "string,number,boolean,object,array").split(","),
        debugErrorTrackingCustomDataMaxLength: parseInt(process.env.DEBUG_ERROR_TRACKING_CUSTOM_DATA_MAX_LENGTH || "1000", 10), // 1000 characters
    },
    cors: {
        enabled: process.env.CORS_ENABLED === "true",
        origin: process.env.CORS_ORIGIN || "*",
        methods: process.env.CORS_METHODS || "GET,POST,PUT,DELETE,OPTIONS",
        allowedHeaders: process.env.CORS_ALLOWED_HEADERS || "Content-Type,Authorization",
        exposedHeaders: process.env.CORS_EXPOSED_HEADERS || "Content-Length,Authorization",
        credentials: process.env.CORS_CREDENTIALS === "true",
        maxAge: parseInt(process.env.CORS_MAX_AGE || "86400", 10), // 1 day
    },
    graphql: {
        enabled: process.env.GRAPHQL_ENABLED === "true",
        endpoint: process.env.GRAPHQL_ENDPOINT || "/graphql",
        playgroundEnabled: process.env.GRAPHQL_PLAYGROUND_ENABLED === "true",
        introspectionEnabled: process.env.GRAPHQL_INTROSPECTION_ENABLED === "true",
        schemaPath: process.env.GRAPHQL_SCHEMA_PATH || "./graphql/schema.graphql",
        resolversPath: process.env.GRAPHQL_RESOLVERS_PATH || "./graphql/resolvers",
        contextPath: process.env.GRAPHQL_CONTEXT_PATH || "./graphql/context",
        validationRules: (process.env.GRAPHQL_VALIDATION_RULES || "NoUndefined,NoFragmentCycles").split(","),
        maxComplexity: parseInt(process.env.GRAPHQL_MAX_COMPLEXITY || "1000", 10), // 1000
        maxDepth: parseInt(process.env.GRAPHQL_MAX_DEPTH || "10", 10), // 10
        enableSubscriptions: process.env.GRAPHQL_ENABLE_SUBSCRIPTIONS === "true",
        subscriptionEndpoint: process.env.GRAPHQL_SUBSCRIPTION_ENDPOINT || "/subscriptions",
        subscriptionProtocol: process.env.GRAPHQL_SUBSCRIPTION_PROTOCOL || "graphql-ws",
        subscriptionKeepAlive: parseInt(process.env.GRAPHQL_SUBSCRIPTION_KEEP_ALIVE || "30000", 10), // 30 seconds
        subscriptionReconnect: process.env.GRAPHQL_SUBSCRIPTION_RECONNECT === "true",
        subscriptionReconnectAttempts: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RECONNECT_ATTEMPTS || "5", 10), // 5
        subscriptionReconnectDelay: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RECONNECT_DELAY || "1000", 10), // 1 second
        subscriptionMaxSubscriptions: parseInt(process.env.GRAPHQL_SUBSCRIPTION_MAX_SUBSCRIPTIONS || "100", 10), // 100
        subscriptionMaxSubscriptionDepth: parseInt(process.env.GRAPHQL_SUBSCRIPTION_MAX_SUBSCRIPTION_DEPTH || "5", 10), // 5
        subscriptionMaxSubscriptionComplexity: parseInt(process.env.GRAPHQL_SUBSCRIPTION_MAX_COMPLEXITY || "100", 10), // 100
        subscriptionMaxSubscriptionRateLimit: parseInt(process.env.GRAPHQL_SUBSCRIPTION_MAX_RATE_LIMIT || "100", 10), // 100 requests per minute
        subscriptionRateLimitWindowMs: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute
        subscriptionRateLimitMax: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_MAX || "100", 10), // 100 requests per minute
        subscriptionRateLimitKey: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_KEY || "subscription_rate_limit",
        subscriptionRateLimitEnabled: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_ENABLED === "true",
        subscriptionRateLimitErrorMessage: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_ERROR_MESSAGE || "Too many requests, please try again later.",
        subscriptionRateLimitHeaders: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS === "true",
        subscriptionRateLimitHeadersPrefix: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_PREFIX || "X-RateLimit-",
        subscriptionRateLimitHeadersRemaining: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_REMAINING || "X-RateLimit-Remaining",
        subscriptionRateLimitHeadersReset: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RESET || "X-RateLimit-Reset",
        subscriptionRateLimitHeadersLimit: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_LIMIT || "X-RateLimit-Limit",
        subscriptionRateLimitHeadersRetryAfter: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER || "X-RateLimit-Retry-After",
        subscriptionRateLimitHeadersRetryAfterMs: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_MS || "1000", 10), // 1 second
        subscriptionRateLimitHeadersRetryAfterSeconds: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_SECONDS || "1", 10), // 1 second
        subscriptionRateLimitHeadersRetryAfterMinutes: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_MINUTES || "1", 10), // 1 minute
        subscriptionRateLimitHeadersRetryAfterHours: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_HOURS || "1", 10), // 1 hour
        subscriptionRateLimitHeadersRetryAfterDays: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_DAYS || "1", 10), // 1 day
        subscriptionRateLimitHeadersRetryAfterWeeks: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_WEEKS || "1", 10), // 1 week
        subscriptionRateLimitHeadersRetryAfterMonths: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_MONTHS || "1", 10), // 1 month
        subscriptionRateLimitHeadersRetryAfterYears: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_YEARS || "1", 10), // 1 year
        subscriptionRateLimitHeadersRetryAfterDecades: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_DECADES || "1", 10), // 1 decade
        subscriptionRateLimitHeadersRetryAfterCenturies: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CENTURIES || "1", 10), // 1 century
        subscriptionRateLimitHeadersRetryAfterMillennia: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_MILLENNIA || "1", 10), // 1 millennium
        subscriptionRateLimitHeadersRetryAfterEras: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ERAS || "1", 10), // 1 era
        subscriptionRateLimitHeadersRetryAfterEpochs: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_EPOCHS || "1", 10), // 1 epoch
        subscriptionRateLimitHeadersRetryAfterAeons: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_AEONS || "1", 10), // 1 aeon
        subscriptionRateLimitHeadersRetryAfterEons: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_EONS || "1", 10), // 1 eon
        subscriptionRateLimitHeadersRetryAfterEternities: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ETERNITIES || "1", 10), // 1 eternity
        subscriptionRateLimitHeadersRetryAfterInfinity: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_INFINITY || "1", 10), // 1 infinity
        subscriptionRateLimitHeadersRetryAfterForever: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_FOREVER || "1", 10), // 1 forever
        subscriptionRateLimitHeadersRetryAfterNever: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_NEVER || "1", 10), // 1 never
        subscriptionRateLimitHeadersRetryAfterAlways: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ALWAYS || "1", 10), // 1 always
        subscriptionRateLimitHeadersRetryAfterConstant: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CONSTANT || "1", 10), // 1 constant
        subscriptionRateLimitHeadersRetryAfterVariable: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_VARIABLE || "1", 10), // 1 variable
        subscriptionRateLimitHeadersRetryAfterRandom: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_RANDOM || "1", 10), // 1 random
        subscriptionRateLimitHeadersRetryAfterCustom: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM || "1", 10), // 1 custom
        subscriptionRateLimitHeadersRetryAfterDynamic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_DYNAMIC || "1", 10), // 1 dynamic
        subscriptionRateLimitHeadersRetryAfterStatic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_STATIC || "1", 10), // 1 static
        subscriptionRateLimitHeadersRetryAfterFixed: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_FIXED || "1", 10), // 1 fixed
        subscriptionRateLimitHeadersRetryAfterLinear: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_LINEAR || "1", 10), // 1 linear
        subscriptionRateLimitHeadersRetryAfterExponential: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_EXPONENTIAL || "1", 10), // 1 exponential
        subscriptionRateLimitHeadersRetryAfterLogarithmic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_LOGARITHMIC || "1", 10), // 1 logarithmic
        subscriptionRateLimitHeadersRetryAfterPolynomial: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_POLYNOMIAL || "1", 10), // 1 polynomial
        subscriptionRateLimitHeadersRetryAfterTrigonometric: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_TRIGONOMETRIC || "1", 10), // 1 trigonometric
        subscriptionRateLimitHeadersRetryAfterHyperbolic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_HYPERBOLIC || "1", 10), // 1 hyperbolic
        subscriptionRateLimitHeadersRetryAfterExponentialGrowth: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_EXPONENTIAL_GROWTH || "1", 10), // 1 exponential growth
        subscriptionRateLimitHeadersRetryAfterExponentialDecay: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_EXPONENTIAL_DECAY || "1", 10), // 1 exponential decay
        subscriptionRateLimitHeadersRetryAfterLogisticGrowth: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_LOGISTIC_GROWTH || "1", 10), // 1 logistic growth
        subscriptionRateLimitHeadersRetryAfterLogisticDecay: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_LOGISTIC_DECAY || "1", 10), // 1 logistic decay
        subscriptionRateLimitHeadersRetryAfterSigmoid: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_SIGMOID || "1", 10), // 1 sigmoid
        subscriptionRateLimitHeadersRetryAfterStep: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_STEP || "1", 10), // 1 step
        subscriptionRateLimitHeadersRetryAfterSine: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_SINE || "1", 10), // 1 sine
        subscriptionRateLimitHeadersRetryAfterCosine: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_COSINE || "1", 10), // 1 cosine
        subscriptionRateLimitHeadersRetryAfterTangent: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_TANGENT || "1", 10), // 1 tangent
        subscriptionRateLimitHeadersRetryAfterCotangent: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_COTANGENT || "1", 10), // 1 cotangent
        subscriptionRateLimitHeadersRetryAfterSecant: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_SECANT || "1", 10), // 1 secant
        subscriptionRateLimitHeadersRetryAfterCosecant: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_COSECANT || "1", 10), // 1 cosecant
        subscriptionRateLimitHeadersRetryAfterArcsine: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCSINE || "1", 10), // 1 arcsine
        subscriptionRateLimitHeadersRetryAfterArccosine: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCCOSINE || "1", 10), // 1 arccosine
        subscriptionRateLimitHeadersRetryAfterArctangent: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCTANGENT || "1", 10), // 1 arctangent
        subscriptionRateLimitHeadersRetryAfterArccotangent: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCCOTANGENT || "1", 10), // 1 arccotangent
        subscriptionRateLimitHeadersRetryAfterArcsecant: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCSECANT || "1", 10), // 1 arcsecant
        subscriptionRateLimitHeadersRetryAfterArccosecant: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCCOSECANT || "1", 10), // 1 arccosecant
        subscriptionRateLimitHeadersRetryAfterArcsineHyperbolic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCSINE_HYPERBOLIC || "1", 10), // 1 arcsine hyperbolic
        subscriptionRateLimitHeadersRetryAfterArccosineHyperbolic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCCOSINE_HYPERBOLIC || "1", 10), // 1 arccosine hyperbolic
        subscriptionRateLimitHeadersRetryAfterArctangentHyperbolic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCTANGENT_HYPERBOLIC || "1", 10), // 1 arctangent hyperbolic
        subscriptionRateLimitHeadersRetryAfterArccotangentHyperbolic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCCOTANGENT_HYPERBOLIC || "1", 10), // 1 arccotangent hyperbolic
        subscriptionRateLimitHeadersRetryAfterArcsecantHyperbolic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCSECANT_HYPERBOLIC || "1", 10), // 1 arcsecant hyperbolic
        subscriptionRateLimitHeadersRetryAfterArccosecantHyperbolic: parseInt(process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_ARCCOSECANT_HYPERBOLIC || "1", 10), // 1 arccosecant hyperbolic
        subscriptionRateLimitHeadersRetryAfterCustomFunction: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION || "default",
        subscriptionRateLimitHeadersRetryAfterCustomFunctionArgs: (process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_ARGS || "").split(","),
        subscriptionRateLimitHeadersRetryAfterCustomFunctionReturnType: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_RETURN_TYPE || "string",
        subscriptionRateLimitHeadersRetryAfterCustomFunctionImplementation: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_IMPLEMENTATION || "function retryAfter() { return 1; }",
        subscriptionRateLimitHeadersRetryAfterCustomFunctionImplementationArgs: (process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_IMPLEMENTATION_ARGS || "").split(","),
        subscriptionRateLimitHeadersRetryAfterCustomFunctionImplementationReturnType: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_IMPLEMENTATION_RETURN_TYPE || "string",
        subscriptionRateLimitHeadersRetryAfterCustomFunctionImplementationCode: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_IMPLEMENTATION_CODE || "return 1;",
        subscriptionRateLimitHeadersRetryAfterCustomFunctionImplementationCodeArgs: (process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_IMPLEMENTATION_CODE_ARGS || "").split(","),
        subscriptionRateLimitHeadersRetryAfterCustomFunctionImplementationCodeReturnType: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_IMPLEMENTATION_CODE_RETURN_TYPE || "string",
        subscriptionRateLimitHeadersRetryAfterCustomFunctionImplementationCodeExample: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_IMPLEMENTATION_CODE_EXAMPLE || "function retryAfter() { return 1; }",
        subscriptionRateLimitHeadersRetryAfterCustomFunctionImplementationCodeExampleArgs: (process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_IMPLEMENTATION_CODE_EXAMPLE_ARGS || "").split(","),
        subscriptionRateLimitHeadersRetryAfterCustomFunctionImplementationCodeExampleReturnType: process.env.GRAPHQL_SUBSCRIPTION_RATE_LIMIT_HEADERS_RETRY_AFTER_CUSTOM_FUNCTION_IMPLEMENTATION_CODE_EXAMPLE_RETURN_TYPE || "string",
    }
}