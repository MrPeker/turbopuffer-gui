# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Model

Turbopuffer GUI is an Electron desktop application that implements several security measures:

### Credential Storage

- **API keys are encrypted** using Electron's [safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage) API
- Credentials are stored in the OS-native secure storage:
  - **macOS**: Keychain
  - **Windows**: DPAPI (Data Protection API)
  - **Linux**: Secret Service API (libsecret)
- Connection metadata (names, regions) is stored unencrypted locally

### Electron Security

- **Context Isolation**: Enabled - renderer has no direct access to Node.js
- **Node Integration**: Disabled in renderer process
- **Sandbox**: Enabled for renderer process
- **Security Fuses**: Enabled to prevent common vulnerabilities
  - `runAsNode` disabled
  - ASAR integrity validation enabled
  - Node.js CLI flags disabled in packaged app

### Network Security

- All connections to Turbopuffer use HTTPS
- No data is sent to third-party services
- API keys are only transmitted to configured Turbopuffer endpoints

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Please DO NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report security vulnerabilities by emailing the maintainer directly or using GitHub's private vulnerability reporting feature:

1. Go to the [Security tab](https://github.com/MrPeker/turbopuffer-gui/security)
2. Click "Report a vulnerability"
3. Fill out the form with details

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information for follow-up questions

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Initial Assessment**: Within 7 days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

### Disclosure Policy

- We will work with you to understand and resolve the issue
- We will credit you in the release notes (unless you prefer anonymity)
- We ask that you give us reasonable time to address the issue before public disclosure

## Known Security Considerations

### Local Data Storage

The application stores data locally in the user's app data directory:

- **macOS**: `~/Library/Application Support/turbopuffer-gui/`
- **Windows**: `%APPDATA%/turbopuffer-gui/`
- **Linux**: `~/.config/turbopuffer-gui/`

Files stored:
- `connections.json` - Connection metadata (unencrypted)
- `settings.json` - Application settings (unencrypted)
- `query-history/` - Query history per namespace (unencrypted)

**Note**: API keys are NOT stored in these files; they are stored in the OS secure storage.

### Third-Party Dependencies

This project uses third-party npm packages. We recommend:

- Running `npm audit` periodically
- Keeping dependencies updated
- Reviewing the dependency tree for untrusted packages

## Security Best Practices for Users

1. **Keep the application updated** to receive security patches
2. **Use strong, unique API keys** for your Turbopuffer accounts
3. **Don't share your configuration files** as they may contain sensitive metadata
4. **Lock your computer** when stepping away to protect stored credentials
5. **Review connection settings** before connecting to ensure correct endpoints

## Contact

For security concerns, contact the maintainer through GitHub's private vulnerability reporting or open a discussion for general security questions.
