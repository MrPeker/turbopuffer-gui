# Turbopuffer GUI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-36.5.0-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A third-party, open-source desktop GUI client for [Turbopuffer](https://turbopuffer.com) - the blazing-fast vector and full-text search engine.

> **Note**: This is an unofficial community project and is not affiliated with Turbopuffer.

> **⚠️ Beta Software**: This application is currently in beta and is released for testing and development purposes only. **Do not use with production data or systems.** Features may be incomplete, unstable, or subject to breaking changes.

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
- **Domain-restricted networking**: Outgoing requests are limited to `*.turbopuffer.com` only

### Network Security Note

This application disables Chromium's web security (CORS) to allow the Turbopuffer SDK to communicate with the API from the renderer process. To mitigate the associated risks, all outgoing network requests are filtered and restricted to:

- `*.turbopuffer.com` (Turbopuffer API)
- `localhost` / `127.0.0.1` (development only)
- Local files (`file://`)

Any request to other domains is blocked. This prevents potential data exfiltration even if a malicious script were to run in the renderer.

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

**Beta Software Notice**: This application is provided in beta for testing and development purposes only. It is **not intended for use with production data or systems**. The software may contain bugs, incomplete features, or security vulnerabilities. Use at your own risk.

**No Warranty**: THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**Data Loss Warning**: This software interacts with your Turbopuffer database and has the capability to read, write, and delete data. Always ensure you have proper backups before using this application. The authors are not responsible for any data loss or corruption.

**Third-Party Project**: This is an unofficial, third-party client. Turbopuffer is a trademark of Turbopuffer, Inc. This project is not affiliated with, endorsed by, or sponsored by Turbopuffer, Inc.
