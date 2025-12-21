# Turbopuffer GUI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-36.5.0-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A third-party, open-source desktop GUI client for [Turbopuffer](https://turbopuffer.com) - the blazing-fast vector and full-text search engine.

> **Note**: This is an unofficial community project and is not affiliated with Turbopuffer.

<!--
## Screenshots

TODO: Add screenshots of the application
![Main Interface](docs/screenshots/main.png)
-->

## Features

- **Connection Management**: Securely store and manage multiple Turbopuffer connections with encrypted API key storage
- **Namespace Browser**: View and manage all namespaces in your Turbopuffer instance
- **Document Explorer**: Browse, search, and filter documents with an intuitive interface
- **Schema Designer**: Visual schema design tool for configuring vector dimensions, full-text search, and attribute indexes
- **Advanced Filtering**: Build complex filters using a visual filter builder or raw query mode
- **Aggregations**: Run aggregation queries with group-by support
- **Dark Mode**: Full dark/light theme support

## Installation

### Download Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/MrPeker/turbopuffer-gui/releases) page:

- **macOS**: `.dmg` or `.zip`
- **Windows**: `.exe` installer
- **Linux**: `.deb` or `.rpm`

### Build from Source

See [Development](#development) section below.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or later
- npm 9.x or later

### Setup

```bash
# Clone the repository
git clone https://github.com/MrPeker/turbopuffer-gui.git
cd turbopuffer-gui

# Install dependencies
npm install

# Start development server
npm run start
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start development server with hot reload |
| `npm run package` | Package application (without installer) |
| `npm run make` | Build distributables for your platform |
| `npm run lint` | Run ESLint |

### Building for Distribution

```bash
# Package without installer
npm run package

# Build installer/distributables
npm run make
```

#### macOS Code Signing (Optional)

For signed macOS builds, copy `.env.example` to `.env` and configure your Apple Developer credentials:

```bash
cp .env.example .env
# Edit .env with your credentials
```

## Tech Stack

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[React 19](https://react.dev/)** - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Vite](https://vitejs.dev/)** - Build tool
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management
- **[@turbopuffer/turbopuffer](https://www.npmjs.com/package/@turbopuffer/turbopuffer)** - Official Turbopuffer SDK

## Security

- API keys are encrypted using Electron's [safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage) (OS-native encryption)
- Security fuses enabled to prevent common Electron vulnerabilities
- Context isolation and disabled Node integration in renderer

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This is an unofficial, third-party client. Turbopuffer is a trademark of Turbopuffer, Inc. This project is not affiliated with, endorsed by, or sponsored by Turbopuffer, Inc.
