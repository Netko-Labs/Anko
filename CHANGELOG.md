# Changelog

All notable changes to Anko will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- CHANGELOG_INSERT_MARKER -->
## [v0.3.0] - 2026-03-10

### Highlights
We've powered up Anko with a major engine swap—say hello to Electrobun! This release also brings automatic updates and a freshly reorganized codebase that's cleaner than a perfectly normalized database schema.

### New Features ✨
- **Check for Updates** – Anko now automatically notifies you when a new version is available (no more manually hunting for patches like you're grinding side quests)

### Improvements ⚡
- **Framework Migration** – Migrate from Tauri to Electrobun for better performance and reliability
- **Code Architecture** – Refactored component structure and extracted hooks into smaller, more maintainable pieces (think of it as breaking down a monolithic query into efficient CTEs)
- **Build & CI/CD** – Revamped the entire build pipeline with Electrobun support, including macOS code signing and auto-update configuration
- **Code Quality** – Improved linting standards with Husky hooks and Biome formatting to keep everything tidy

### Bug Fixes 🐛
- **Commitlint Regex** – Fixed handling of emoji variation selectors so commit messages parse correctly every time

## [v0.3.0] - 2026-03-10

### Highlights
The big migration is here. Anko has moved from Tauri to Electrobun, bringing native macOS performance and a streamlined architecture. Plus, the auto-update system is now fully wired up.

### New Features
- **Electrobun Migration** — Complete rewrite of the backend runtime from Tauri/Rust to Electrobun/Bun for faster startup and native macOS integration
- **Auto-Update System** — Check for updates from the settings menu with progress toasts, download with real-time progress tracking, and one-click restart to apply updates
- **BSDIFF Patch Updates** — Incremental updates via Electrobun's patch chain system for smaller, faster downloads

### Improvements
- **Project Cleanup** — Removed duplicated icon assets (~4.5MB), fixed app title and favicon, cleaned up Vite scaffold remnants
- **CI/CD Overhaul** — Updated build pipeline for Electrobun with macOS code signing and auto-update artifact publishing
- **Component Architecture** — Reorganized component structure, extracted hooks and sub-components for better maintainability

### Under the Hood
- Added Husky pre-commit hooks with Biome lint/format
- Suppressed false-positive Biome warnings on RPC schema types
- Fixed commitlint regex to handle emoji variation selectors
- Updated changelog URL to Netko-Labs organization

## [v0.2.3] - 2026-01-26

### Highlights
We're shipping v0.2.3! This release is more of a checkpoint than a plot twist, but hey—sometimes the best episodes are the ones that set up for something bigger. 🎬

## [v0.2.2] - 2026-01-18

### Highlights
Ever get tired of playing the guessing game with changelog updates? Say no more. We've leveled up the update experience so you can actually *see* what's new before committing to the download.

### New Features ✨
- **Dynamic Changelog in Update Modal** — Fetch and display changelog entries directly from CHANGELOG.md. No more mysterious version bumps shrouded in mystery. Transparency, baby! 📖

### Under the Hood 🔧
- Fine-tuned the changelog prompt for smoother operations during testing and deployments.

## [v0.2.2] - 2026-01-18

### New Features

- **Changelog in Updates**: Update modal now displays changelog from CHANGELOG.md instead of empty release notes
- **Test Update Modal**: Added button in Developer Tools to test the update modal with latest changelog

## [v0.2.1] - 2026-01-18

### Bug Fixes

- Resolve TypeScript errors in release build

## [v0.2.0] - 2026-01-18

### Highlights
Major redesign of the right sidebar with persistent context and new query management features. Anko now saves your query history and lets you organize frequently-used queries in your workspace.

### New Features
- **Right Sidebar Redesign**: View table details, row information, and Zod schema in organized tabs with resizable panels
- **Saved Queries**: Save and organize your frequently-used queries within your workspace
- **Query History**: Automatic 30-day query history retention for easy access to past queries
- **Workspace Management**: Add context menu with edit and delete options for your saved queries and workspaces
- **Persistent Context**: Table selections now persist when navigating between rows and cells

### Bug Fixes
- Fix MySQL type handling for TIMESTAMP, DECIMAL, and JSON columns
- Fix row details duplication and implement proper custom tabs layout
- Fix nested button error and simplify tabs layout
- Fix 'Open in Editor' functionality and add Save Query button
- Hide Developer Tools in production builds
- Disable right-click and reload actions in production

## [v0.1.2] - 2026-01-18

### Highlights

This release focuses on improving our development and release processes to ensure more reliable updates.

### Under the Hood

Improve CI/CD pipeline with automated checks on pull requests and enhanced release validation process.

## [v0.1.1] - 2026-01-18

### Highlights
This patch release resolves critical TypeScript compilation errors to ensure stable production builds.

### Bug Fixes
- Fix TypeScript errors in production build

## [v0.1.0] - 2026-01-18

### Highlights
Anko's initial release brings a fully functional SQL desktop client with core database management capabilities. This version establishes the foundation for efficient SQL query execution and database exploration.

### New Features
- Auto-update functionality to keep Anko current with the latest improvements
- Commitlint integration for maintaining code quality standards

