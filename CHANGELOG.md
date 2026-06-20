# Changelog

All notable changes to Anko will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- CHANGELOG_INSERT_MARKER -->
## [v0.5.13] - 2026-06-20

### Highlights
Your connections just got a power-up! This release brings bulk operations, smoother scrolling, and finally separates your dev and prod environments so they stop stepping on each other's toes.

### New Features ✨
- **Tab-row wheel scrolling** – Scroll through your tabs like you're speedrunning through a list. No more awkward side-scrolling.
- **Multi-select & bulk-delete connections** – Select multiple connections and nuke them in one go. It's like a batch script, but with a GUI that doesn't look like it's from 1995.
- **Edit workspaces** – Tired of being stuck with your workspace choices? Now you can tweak them without starting over. Freedom!

### Bug Fixes 🐛
- **Windows dev/prod isolation** – Fixed the chaos where development and production app data were sharing the same folder like roommates with no boundaries. They now have their own spaces.

### Under the Hood 🔧
- Bumped mirin to 0.1.0-alpha.7 for better dev/prod separation across the board.

## [v0.5.12] - 2026-06-20

### Highlights
We're keeping things tight and focused this release—think of it as a quality-over-quantity sprint. Windows users, we've got something special cooking for you! 🍜

### Under the Hood 🔧
Update Mirin to 0.1.0-alpha.6, bringing Windows auto-updater fixes to the table. Because nothing says smooth sailing like updates that actually work on the first try. Your Windows setup just leveled up.

## [v0.5.11] - 2026-06-20

### Highlights
We've been grinding on the small stuff that makes a big difference. This update is all about keeping your experience smooth—no more surprise console windows crashing the party when you connect.

### Bug Fixes 🐛
- **Windows**: Eliminate the annoying console flash that appeared on connection. Your screen now stays as chill as you deserve it to be.

## [v0.5.10] - 2026-06-20

### Highlights
We've been polishing things like it's a speedrun any% WR attempt! The Windows installer now feels as smooth as butter, and we've upgraded our query engine (mirin) to keep your SQL flowing like a well-paced anime arc.

### New Features ✨
- **Windows Installer Polish** – Installation is now smoother than a perfectly animated frame. No more jank, just vibes and efficiency.
- **mirin 0.1.0-alpha.5 Integration** – Our query engine just got a fresh coat of paint. Better performance, better stability, better *everything*. Time to make your queries shine.

## [v0.5.9] - 2026-06-20

### Highlights
We've leveled up Anko's build pipeline and got our UI looking *crisp*. Think of this as the polish patch before the main event—small but mighty improvements that make everything just work better. ✨

### Improvements ⚡
Upgrade mirin dependency to 0.1.0-alpha.3, bringing console-free operation and exe icon support to the table. Your Anko icon will now show up in the taskbar like it actually belongs there. (Spoiler: it does.)

## [v0.5.8] - 2026-06-20

### Highlights
We've leveled up our installer game! This release brings smoother Windows installation experience with our new NSIS-powered setup wizard. Think of it as our way of saying welcome to Anko without the awkward handshake. ✨

### Under the Hood 🔧
- Bump mirin to 0.1.0-alpha.1 for improved Windows installer support
- Configure CI/CD to properly build and package the NSIS installer

## [v0.5.7] - 2026-06-20

### Highlights
We're bringing the Windows experience to the next level! Anko now gets proper title-bar controls and we're shipping our shiny new Mirin UI library. It's like we finally gave our Windows build the legendary arc it deserved. 🪟✨

### New Features ✨
- **Windows Title-Bar Controls** – Customize your window buttons like you're configuring a gaming rig. Drag, snap, and control Anko the way *you* want it
- **Mirin 0.1.0-alpha.0 Integration** – Our fresh new UI library is here and ready to make the interface even cleaner. Buckle up for the anime-smooth transitions ahead
- **Official Windows Release** – Anko is now fully ready for the Windows squad. No more beta energy; this is the real deal

## [v0.5.6] - 2026-06-15

### Highlights
We've patched up a nasty dependency issue that was causing dev builds to crash faster than a poorly optimized query. Now you can run Anko in dev mode without it ragequitting on you! 🎮

### Bug Fixes 🐛
- **Mirinjs Dependency** — Fixed a critical issue where running the dev build alongside an installed version of Anko would cause it to crash on relaunch. Updated to mirinjs alpha.19 for smooth sailing (and no more ctrl+alt+delete moments).

## [v0.5.5] - 2026-06-15

### Highlights
Right-click copy is back, baby! We've restored the context menu functionality and made sure our secure APIs are playing nice with the latest mirinjs alpha. Your clipboard has been vindicated.

### Bug Fixes 🐛
- **Restore right-click copy + secure-context APIs**: Fixed a regression where right-click copying stopped working. Also patched up compatibility with mirinjs alpha.17's secure-context implementation. Context menus are officially un-broken™.

## [v0.5.4] - 2026-06-15

### Highlights
We're back with a stability patch that fixes some sneaky bugs lurking in the shadows. Nothing groundbreaking, but your database connections will thank you! 🙏

### Bug Fixes 🐛
- **Fix ID generation in app:// webviews** – Turns out  doesn't play nice with the app protocol. We've switched to a more compatible approach, because apparently not all code paths lead to Rome.
- **Surface real database connection errors** – No more false positives! We now properly surface actual connection errors instead of gaslighting you with misleading messages. Your test connections just got honest.

## [v0.5.3] - 2026-06-14

### Highlights
We've rolled out v0.5.3! While this is a maintenance release, we're keeping the lights on and the queries running smooth. Think of it as a perfectly balanced patch – no bloat, just the good stuff.

## [v0.5.2] - 2026-06-14

### Highlights

We've rolled out v0.5.2 with some solid improvements under the hood. Think of it as a maintenance arc—not flashy, but absolutely necessary for the long-term story. 📖

### Under the Hood 🔧

Release prep and internal polish to keep Anko running smooth as butter. No breaking changes here, just good housekeeping to make sure the app stays stable and snappy.

## [v0.5.1] - 2026-06-13

### Highlights

We're shipping v0.5.1 to keep Anko running smooth as butter. This is a maintenance release that keeps the lights on while we cook up bigger features behind the scenes. 🔧

## [v0.5.0] - 2026-06-13

### Highlights
We've leveled up from Electrobun to **mirinjs** and it's been a whole thing—like evolving your starter Pokémon into something way cooler. Plus, your app now auto-updates itself like a responsible desktop citizen, and the UI actually *feels* snappier.

### New Features ✨
- **Real auto-updates** – Anko now updates itself without you having to manually hunt down new versions like you're playing a roguelike
- **Native drag region for titlebar** – Those title-bar buttons are finally clickable and don't betray you mid-drag. Revolutionary stuff, really
- **Window state persistence** – Anko remembers where you left it. It's like it actually cares about your workflow
- **Native save dialog** – Proper file saving, the way the OS intended
- **App icon + DevTools window** – Looking sharp and easier to debug when things get weird

### Improvements ⚡
- **Migrated to mirinjs runtime** – Ditched Electrobun and ported the entire foundation to a snappier, lighter runtime. This is the deep refactor that makes everything feel more responsive
- **Switched to Drizzle ORM** – Storage queries now use Drizzle for cleaner, type-safe database operations. Your persistence layer just got a glow-up
- **Multiple runtime refinements** – Title-bar latency fixes, click passthrough improvements, and better logging. It's the thousand small cuts that make the big picture

### Bug Fixes 🐛
- **Toast notifications no longer spam the main window** – Toasts now stay in their lane and don't clutter up your interface

## [v0.5.0] - 2026-06-13

### Highlights
We've migrated from Electrobun to mirinjs and it's *chef's kiss*. This release is all about a fresh engine swap, native vibes, and actually working auto-updates. Your Anko experience just got a major glow-up.

### New Features ✨
- **Auto-Updates**: Real, honest-to-goodness auto-updates are now live. No more manual refreshes—we'll keep you current while you're out there querying databases like a boss.
- **Native Titlebar Magic**: The titlebar now has proper drag regions and clickable buttons. It's the little things that make a UI feel *native*.
- **Window State Persistence**: Anko remembers where you left it. Close it, reopen it, and boom—your window's exactly where you want it.
- **Native File Dialog**: Save your work with a proper system save dialog instead of the usual web nonsense.
- **App Icon**: We're no longer using the default question mark in a box look. Anko now has a proper icon that actually looks intentional.
- **DevTools Window**: Debug like a pro with a dedicated DevTools window on launch.

### Improvements ⚡
- **Storage Layer Overhaul**: Migrated to Drizzle ORM for cleaner, more maintainable persistence queries.
- **Framework Migration**: Ditched Electrobun and ported everything to mirinjs. The new foundation is leaner, meaner, and significantly less headache-inducing.
- **Titlebar Performance**: Squashed click latency issues across multiple mirinjs alpha releases. Your clicks now land where you expect.

### Bug Fixes 🐛
- **Toast Relay Fix**: Main window no longer gets pelted with toast notifications meant for other windows. Peace and quiet restored.

## [v0.4.1] - 2026-04-09

### Highlights
We're back with a hotfix that gets Anko running smooth as butter on Electrobun. Sometimes the best optimizations are knowing what *not* to do. ✨

### Bug Fixes 🐛
- **Build**: Remove lazy imports that were breaking the Electrobun CEF bundle – turns out lazy loading isn't always lazy in the best way. Now everything loads right the first time!

## [v0.4.0] - 2026-04-09

### Highlights
SQLite support has finally arrived—your favorite lightweight database is now ready to party! Plus, we've given the UI a fresh coat of paint and added some dev tools to make debugging feel less like a raid you're unprepared for.

### New Features ✨
- **SQLite Support** – Connect to SQLite databases and stop pretending your CSV files are a real data solution
- **Developer Tools** – New debugging and inspection tools to help you peek under the hood
- **UI Refactor** – Streamlined interface that's snappier than a well-timed dodge roll

### Under the Hood 🔧
- Migrated CI workflows to Blacksmith for smoother builds and faster iterations
- Added Claude-powered PR reviews because even code needs a second opinion sometimes

## [v0.3.3] - 2026-03-10

### Highlights
We're shipping a small but mighty update that fixes how Anko detects whether you're in the production zone. No more environment variable mix-ups—just pure, version-based confidence. It's like finally getting the right save file loaded! 🎮

### Bug Fixes 🐛
- **Production detection now uses version.json** – We switched from relying on environment variables to reading the channel directly from version.json. This means Anko now knows exactly where it stands, no guesswork required. Your production queries are safer than ever.

## [v0.3.2] - 2026-03-10

### Highlights
We've been grinding on the backend so Anko plays nice with macOS notarization. Think of it as getting our security clearance – no more sus vibes from Apple's gatekeeper! 🍎

### Bug Fixes 🐛
Fix macOS codesigning for libWindowDrag.dylib via postBuild hook to ensure proper notarization. Because apparently dragging windows requires proper documentation these days.

## [v0.3.1] - 2026-03-10

### Highlights
We've leveled up our release pipeline! This patch focuses on getting Anko properly signed and packaged—think of it as putting on our formal attire before heading to production. ✨

### Bug Fixes 🐛
Fix CI environment configuration for release builds to properly enable code signing and artifact generation. No more works on my machine energy—your binaries are now officially blessed and ready to roll.

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

