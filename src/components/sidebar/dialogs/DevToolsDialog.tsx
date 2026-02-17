import {
  IconBug,
  IconDatabase,
  IconDatabaseOff,
  IconDownload,
  IconFolderOff,
  IconLayoutGrid,
  IconPlugConnected,
  IconRefresh,
  IconServer,
  IconSparkles,
  IconTerminal,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useDevToolsActions } from '@/hooks/useDevToolsActions'
import { ConfirmDialog } from './ConfirmDialog'
import { type DevToolsDialogProps } from './definitions'

export function DevToolsDialog({ open, onOpenChange }: DevToolsDialogProps) {
  const {
    confirmDialog,
    setConfirmDialog,
    isLoading,
    debugMode,
    enabledNamespaces,
    toggleNamespace,
    stats,
    handleClearSchemaCache,
    handleResetWorkspaces,
    handleClearAllData,
    handleViewSchemaCache,
    handleViewActiveConnections,
    handleViewStoreState,
    handleToggleDebug,
    handleClearLocalStorage,
    handleLoadTestDatabases,
    handleExportConnections,
    handleImportConnections,
    handleTestUpdateModal,
    handleViewSavedConnections,
  } = useDevToolsActions(onOpenChange)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Developer Tools</DialogTitle>
            <DialogDescription>
              Debug utilities and data management tools for development.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Reset Options */}
            <div>
              <h3 className="text-sm font-medium mb-3">Reset Options</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleClearSchemaCache}
                >
                  <IconRefresh className="size-4 mr-2" />
                  Clear Schema Cache
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: 'Reset Workspaces',
                      description:
                        'This will delete all custom workspaces and reset to the default workspace only. Your connections will remain.',
                      onConfirm: handleResetWorkspaces,
                      variant: 'default',
                    })
                  }
                >
                  <IconLayoutGrid className="size-4 mr-2" />
                  Reset Workspaces
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: 'Clear All Data',
                      description:
                        'This will delete all saved connections and workspaces. This action cannot be undone.',
                      onConfirm: handleClearAllData,
                      variant: 'destructive',
                    })
                  }
                >
                  <IconTrash className="size-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </div>

            <Separator />

            {/* Test Databases */}
            <div>
              <h3 className="text-sm font-medium mb-3">Test Databases</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLoadTestDatabases}
                  disabled={isLoading}
                >
                  <IconServer className="size-4 mr-2" />
                  {isLoading ? 'Loading...' : 'Load Docker Test DBs'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Loads 5 test databases from docker-compose.yml (MySQL 8, PostgreSQL 16, MariaDB
                  11, PostgreSQL 15, MySQL 8.4 LTS)
                </p>
              </div>
            </div>

            <Separator />

            {/* Debug Utilities */}
            <div>
              <h3 className="text-sm font-medium mb-3">Debug Utilities</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={handleViewSchemaCache}
                >
                  <IconDatabase className="size-4 mr-2" />
                  View Schema Cache
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={handleViewActiveConnections}
                >
                  <IconPlugConnected className="size-4 mr-2" />
                  View Connections
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={handleViewStoreState}
                >
                  <IconTerminal className="size-4 mr-2" />
                  View Store State
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={handleToggleDebug}
                >
                  <IconBug className="size-4 mr-2" />
                  Debug: {debugMode ? 'On' : 'Off'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start col-span-2"
                  onClick={handleTestUpdateModal}
                  disabled={isLoading}
                >
                  <IconSparkles className="size-4 mr-2" />
                  Test Update Modal
                </Button>
              </div>

              {/* Log Namespace Controls */}
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Log Namespaces:</p>
                <div className="flex gap-2">
                  {['tauri', 'store', 'app'].map((ns) => (
                    <Button
                      key={ns}
                      variant={enabledNamespaces.has(ns) ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => toggleNamespace(ns)}
                    >
                      {ns}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Data Management */}
            <div>
              <h3 className="text-sm font-medium mb-3">Data Management</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={handleExportConnections}
                >
                  <IconDownload className="size-4 mr-2" />
                  Export Connections
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={handleImportConnections}
                >
                  <IconUpload className="size-4 mr-2" />
                  Import Connections
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      title: 'Clear Local Storage',
                      description:
                        'This will clear all browser local storage for this app. Theme and other preferences will be reset.',
                      onConfirm: async () => {
                        handleClearLocalStorage()
                        setConfirmDialog(null)
                      },
                      variant: 'default',
                    })
                  }
                >
                  <IconFolderOff className="size-4 mr-2" />
                  Clear Local Storage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={handleViewSavedConnections}
                >
                  <IconDatabaseOff className="size-4 mr-2" />
                  View Saved Conns
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="pt-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Active Connections:</span>
                <span>{stats.activeConnections}</span>
              </div>
              <div className="flex justify-between">
                <span>Saved Connections:</span>
                <span>{stats.savedConnections}</span>
              </div>
              <div className="flex justify-between">
                <span>Workspaces:</span>
                <span>{stats.workspaces}</span>
              </div>
              <div className="flex justify-between">
                <span>Cached Schemas:</span>
                <span>{stats.cachedSchemas}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null)
          }}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          isLoading={isLoading}
          variant={confirmDialog.variant}
          confirmText={confirmDialog.variant === 'destructive' ? 'Delete' : 'Confirm'}
        />
      )}
    </>
  )
}
