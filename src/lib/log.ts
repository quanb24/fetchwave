/**
 * Renderer-side logger that forwards every event to the main process so it
 * lands in the same log file as backend events. Also mirrors to the dev
 * console. Safe to call before window.api is ready (queues until then).
 */
type Level = 'info' | 'warn' | 'error' | 'debug';

const queue: Array<[Level, string, string]> = [];
let flushed = false;

function flush() {
  if (flushed) return;
  if (typeof window === 'undefined' || !window.api?.logs?.write) return;
  flushed = true;
  for (const [lvl, tag, msg] of queue) {
    void window.api.logs.write(lvl, tag, msg);
  }
  queue.length = 0;
}

function send(level: Level, tag: string, msg: string) {
  // eslint-disable-next-line no-console
  (console[level === 'debug' ? 'log' : level] ?? console.log)(`[${tag}]`, msg);
  if (typeof window !== 'undefined' && window.api?.logs?.write) {
    flush();
    void window.api.logs.write(level, tag, msg);
  } else {
    queue.push([level, tag, msg]);
  }
}

export const log = {
  info:  (tag: string, msg: string) => send('info',  tag, msg),
  warn:  (tag: string, msg: string) => send('warn',  tag, msg),
  error: (tag: string, msg: string) => send('error', tag, msg),
  debug: (tag: string, msg: string) => send('debug', tag, msg),
};

// Capture global errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    log.error('window.error', `${e.message} @ ${e.filename}:${e.lineno}:${e.colno}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    log.error('window.unhandledRejection', String(e.reason));
  });
}
