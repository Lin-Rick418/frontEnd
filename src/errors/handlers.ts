import type { App } from 'vue'

export function installErrorHandlers(app: App, target: Window = window) {
  const reportedErrors = new WeakSet<object>()
  const previousHandler = app.config.errorHandler

  function reportError(error: unknown, source: string) {
    if (typeof error === 'object' && error !== null) {
      if (reportedErrors.has(error)) return
      reportedErrors.add(error)
    }
    console.error(`[${source}]`, error)
  }

  const vueErrorHandler: NonNullable<App['config']['errorHandler']> = (
    error,
    _instance,
    info,
  ) => reportError(error, `Vue: ${info}`)

  function onError(event: ErrorEvent) {
    reportError(
      event.error ??
        `${event.message} (${event.filename}:${event.lineno}:${event.colno})`,
      'Window',
    )
    // The error has been logged; suppress the browser's duplicate console entry.
    event.preventDefault()
  }

  function onUnhandledRejection(event: PromiseRejectionEvent) {
    reportError(event.reason, 'Unhandled Promise')
    event.preventDefault()
  }

  app.config.errorHandler = vueErrorHandler
  target.addEventListener('error', onError)
  target.addEventListener('unhandledrejection', onUnhandledRejection)

  function cleanup() {
    target.removeEventListener('error', onError)
    target.removeEventListener('unhandledrejection', onUnhandledRejection)
    if (app.config.errorHandler === vueErrorHandler) {
      app.config.errorHandler = previousHandler
    }
  }

  app.onUnmount(cleanup)
  return cleanup
}
