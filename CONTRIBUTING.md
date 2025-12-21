# Contributing to Turbopuffer GUI

Thank you for your interest in contributing to Turbopuffer GUI! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment (see below)
4. Create a branch for your changes
5. Make your changes and test them
6. Submit a pull request

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or later
- npm 9.x or later
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/turbopuffer-gui.git
cd turbopuffer-gui

# Add upstream remote
git remote add upstream https://github.com/MrPeker/turbopuffer-gui.git

# Install dependencies
npm install

# Start the development server
npm run start
```

### Project Structure

```
turbopuffer-gui/
├── src/
│   ├── main.ts              # Electron main process entry
│   ├── main/                # Main process modules (IPC, services)
│   ├── preload.ts           # Preload script (context bridge)
│   ├── renderer/            # React application
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── stores/          # Zustand stores
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   └── types/               # TypeScript type definitions
├── assets/                  # Application icons and images
└── .github/                 # GitHub templates and workflows
```

## How to Contribute

### Reporting Bugs

Before submitting a bug report:

1. Check the [existing issues](https://github.com/MrPeker/turbopuffer-gui/issues) to avoid duplicates
2. Collect information about the bug:
   - OS and version
   - Application version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) when creating an issue.

### Suggesting Features

Feature suggestions are welcome! Please:

1. Check existing issues and discussions first
2. Clearly describe the problem your feature would solve
3. Explain your proposed solution
4. Consider alternative approaches

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) when creating an issue.

### Contributing Code

1. **Find an issue** to work on, or create one for discussion
2. **Comment on the issue** to let others know you're working on it
3. **Fork and branch** from `main`
4. **Write code** following our coding standards
5. **Test your changes** thoroughly
6. **Submit a pull request**

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features when applicable
3. **Ensure CI passes** - lint and build must succeed
4. **Keep PRs focused** - one feature or fix per PR
5. **Write a clear description** explaining the changes and why

### PR Checklist

- [ ] Code follows the project's coding standards
- [ ] Self-reviewed the code for obvious issues
- [ ] Tested the changes locally
- [ ] Updated documentation if needed
- [ ] No new linting warnings or errors

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Document complex functions with JSDoc

### React

- Use functional components with hooks
- Keep components focused and small
- Use the existing UI components from `src/components/ui/`
- Follow the established patterns in the codebase

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system (CSS variables in `index.css`)
- Avoid custom CSS unless necessary
- Support both light and dark themes

### File Organization

- One component per file
- Keep related files together
- Use index.ts for clean exports
- Follow existing naming conventions

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(documents): add export to CSV functionality

fix(connection): handle timeout errors gracefully

docs(readme): update installation instructions

refactor(store): simplify filter state management
```

## Questions?

If you have questions about contributing, feel free to:

1. Open a [Discussion](https://github.com/MrPeker/turbopuffer-gui/discussions)
2. Ask in an existing issue
3. Reach out to the maintainers

Thank you for contributing!
