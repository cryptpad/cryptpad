// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Short version of config/config.example.js
// Used as a template for docker containers.

module.exports = {
    httpUnsafeOrigin: ^HTTP_UNSAFE_ORIGIN^,
    httpSafeOrigin: ^HTTP_SAFE_ORIGIN^,
    httpAddress: ^HTTP_ADDRESS^,
    httpPort: ^HTTP_PORT^,
    httpSafePort: ^HTTP_SAFE_PORT^,
    websocketPort: ^WEBSOCKET_PORT^,
    maxWorkers: ^MAX_WORKERS^,
    otpSessionExpiration: ^OTP_SESSION_EXPIRATION^,
    enforceMFA: ^ENFORCE_MFA^,
    logIP: ^LOG_IP^,
    adminKeys: ^ADMIN_KEYS^,
    inactiveTime: ^INACTIVE_TIME^,
    archiveRetentionTime: ^ARCHIVE_RETENTION_TIME^,
    accountRetentionTime: ^ACCOUNT_RETENTION_TIME^,
    disableIntegratedEviction: ^DISABLE_INTEGRATED_EVICTION^,
    maxUploadSize: ^MAX_UPLOAD_SIZE^,
    premiumUploadSize: ^PREMIUM_UPLOAD_SIZE^,
    filePath: ^FILE_PATH^,
    archivePath: ^ARCHIVE_PATH^,
    pinPath: ^PIN_PATH^,
    taskPath: ^TASK_PATH^,
    blockPath: ^BLOCK_PATH^,
    blobPath: ^BLOB_PATH^,
    blobStagingPath: ^BLOB_STAGING_PATH^,
    decreePath: ^DECREE_PATH^,
    logPath: ^LOG_PATH^,
    logToStdout: ^LOG_TO_STDOUT^,
    logLevel: ^LOG_LEVEL^,
    logFeedback: ^LOG_FEEDBACK^,
    verbose: ^VERBOSE^,
    installMethod: ^INSTALL_METHOD^,
};

