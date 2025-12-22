# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial open-source release
- Community documentation (README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)
- GitHub issue and PR templates
- CI/CD workflow with multi-platform builds

## [0.1.0] - 2025-12-22

### Added

- Desktop GUI for Turbopuffer vector database
- Connection management with encrypted credential storage
- Namespace browser and document viewer
- Advanced query builder with visual filter UI
- Raw query mode with Monaco editor
- Document import/export (JSON, CSV)
- Schema designer and viewer
- Query history with per-namespace storage
- Dark/light theme support
- Cross-platform support (macOS, Windows, Linux)

### Security

- API keys encrypted using OS-native secure storage (Keychain, DPAPI, Secret
  Service)
- Context isolation and sandbox enabled
- Security fuses enabled for packaged application

[Unreleased]: https://github.com/MrPeker/turbopuffer-gui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/MrPeker/turbopuffer-gui/releases/tag/v0.1.0
