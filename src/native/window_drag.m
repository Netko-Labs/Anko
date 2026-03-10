#import <Cocoa/Cocoa.h>

/**
 * Native window drag monitor using performWindowDragWithEvent:
 *
 * Installs an NSEvent local monitor that intercepts LeftMouseDown events
 * BEFORE they reach WKWebView. If the click is in the titlebar drag region,
 * it calls performWindowDragWithEvent: with the real NSEvent (no synthesized
 * events, no timing issues) and consumes the event so Electrobun's manual
 * setFrameOrigin-based drag never fires.
 *
 * This is the same approach Tauri/Chromium/Electron use — delegate the drag
 * to the macOS Window Server, which handles tiling, snapping, and the
 * proportional-restore-on-untile behavior automatically.
 */

static const CGFloat kTitlebarHeight = 36.0;       // h-9 = 36px
static const CGFloat kTrafficLightsWidth = 80.0;    // w-20 = 80px (left exclusion)
static const CGFloat kSidebarButtonsWidth = 72.0;   // 2 × w-9 = 72px (right exclusion)

static id mouseDownMonitor = nil;

void installNativeDragMonitor(void) {
    if (mouseDownMonitor) return;

    mouseDownMonitor = [NSEvent addLocalMonitorForEventsMatchingMask:NSEventMaskLeftMouseDown
        handler:^NSEvent *(NSEvent *event) {
            NSWindow *window = [event window];
            if (!window) return event;

            // Only handle the app's main/key window
            if (window != [NSApp mainWindow] && window != [NSApp keyWindow]) return event;

            NSPoint loc = [event locationInWindow];
            NSRect frame = [window frame];
            // AppKit coordinates: (0,0) is bottom-left
            CGFloat yFromTop = frame.size.height - loc.y;

            // Outside titlebar region → pass through
            if (yFromTop > kTitlebarHeight) return event;

            // In traffic lights area (left) → pass through to macOS
            if (loc.x < kTrafficLightsWidth) return event;

            // In sidebar buttons area (right) → pass through to React handlers
            if (loc.x > frame.size.width - kSidebarButtonsWidth) return event;

            // Double-click → toggle zoom (maximize/restore)
            if ([event clickCount] == 2) {
                [window zoom:nil];
                return nil;
            }

            // Single click → start native Window Server drag
            [window performWindowDragWithEvent:event];
            return nil; // consume event so Electrobun's preload doesn't fire
        }];
}
