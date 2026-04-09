#import <Cocoa/Cocoa.h>

/**
 * Native window drag monitor using performWindowDragWithEvent:
 */

static const CGFloat kTitlebarHeight = 36.0;
static const CGFloat kLeftInteractiveWidth = 240.0;   // traffic lights + sidebar toggle + workspace switcher
static const CGFloat kRightInteractiveWidth = 96.0;    // search + settings + right sidebar toggle

static id mouseDownMonitor = nil;

void installNativeDragMonitor(void) {
    if (mouseDownMonitor) return;

    mouseDownMonitor = [NSEvent addLocalMonitorForEventsMatchingMask:NSEventMaskLeftMouseDown
        handler:^NSEvent *(NSEvent *event) {
            NSWindow *window = [event window];
            if (!window) return event;
            if (window != [NSApp mainWindow] && window != [NSApp keyWindow]) return event;

            NSPoint loc = [event locationInWindow];
            NSRect frame = [window frame];
            CGFloat yFromTop = frame.size.height - loc.y;

            if (yFromTop > kTitlebarHeight) return event;
            if (loc.x < kLeftInteractiveWidth) return event;
            if (loc.x > frame.size.width - kRightInteractiveWidth) return event;

            if ([event clickCount] == 2) {
                [window zoom:nil];
                return nil;
            }

            [window performWindowDragWithEvent:event];
            return nil;
        }];
}

/**
 * Repositions traffic lights using Auto Layout constraints so macOS
 * cannot override positions during fullscreen/resize animations.
 */
void repositionTrafficLights(void) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSWindow *window = [NSApp mainWindow];
        if (!window) window = [NSApp keyWindow];
        if (!window) return;

        NSButton *closeBtn = [window standardWindowButton:NSWindowCloseButton];
        NSButton *miniBtn = [window standardWindowButton:NSWindowMiniaturizeButton];
        NSButton *zoomBtn = [window standardWindowButton:NSWindowZoomButton];
        if (!closeBtn || !miniBtn || !zoomBtn) return;

        NSView *titlebarView = [closeBtn superview];
        if (!titlebarView) return;

        CGFloat startX = 13.0;
        CGFloat spacing = 20.0;
        CGFloat topOffset = (kTitlebarHeight - closeBtn.frame.size.height) / 2.0;

        NSArray *buttons = @[closeBtn, miniBtn, zoomBtn];
        for (NSUInteger i = 0; i < buttons.count; i++) {
            NSButton *btn = buttons[i];
            btn.translatesAutoresizingMaskIntoConstraints = NO;

            // Remove any existing constraints on this button from the superview
            NSMutableArray *toRemove = [NSMutableArray array];
            for (NSLayoutConstraint *c in titlebarView.constraints) {
                if (c.firstItem == btn || c.secondItem == btn) {
                    [toRemove addObject:c];
                }
            }
            [titlebarView removeConstraints:toRemove];

            // Pin: left edge, top edge from superview top
            [NSLayoutConstraint activateConstraints:@[
                [btn.leadingAnchor constraintEqualToAnchor:titlebarView.leadingAnchor constant:startX + spacing * i],
                [btn.topAnchor constraintEqualToAnchor:titlebarView.topAnchor constant:topOffset],
            ]];
        }
    });
}
