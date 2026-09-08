import { useState, type ReactNode, type ButtonHTMLAttributes } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  IconX,
  IconLoader2,
  IconArrowUpRight,
  IconFocus2,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../store';
import type { Source } from '../api';
export const MARK =
  'https://i.mscdn.ai/o/BqBHIShPM59EtKMh/images/af0e0ca6-4a0e-49ec-acd3-61f8c24909c2_1788894828901.png';
export const LOCKUP =
  'https://i.mscdn.ai/o/BqBHIShPM59EtKMh/images/af0e0ca6-4a0e-49ec-acd3-61f8c24909c2_1788894828015.png';
export function Button({
  children,
  loading,
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  return (
    <button
      type="button"
      {...props}
      className={`button ${variant} ${className}`}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
    >
      <span className={loading ? 'button-label hidden' : 'button-label'}>{children}</span>
      {loading && <IconLoader2 className="button-spinner spin" size={18} />}
    </button>
  );
}
export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Score({ value, label = 'FIT' }: { value: number; label?: string }) {
  return (
    <span
      className={`score ${value >= 0.65 ? 'positive' : 'muted'}`}
      title="Ranked from available evidence. Not a probability of sponsorship."
    >
      <span className="tiny-dot" />
      {label} {value.toFixed(2)}
    </span>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
  drawer = false,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  drawer?: boolean;
  busy?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal ${wide ? 'wide' : ''} ${drawer ? 'drawer' : ''}`}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <header className="modal-head">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              {description && <Dialog.Description>{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" aria-label="Close" disabled={busy}>
                <IconX size={18} />
              </button>
            </Dialog.Close>
          </header>
          <div className="modal-body">{children}</div>
          {footer && <footer className="modal-footer">{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-reticle">
        <IconFocus2 size={36} stroke={1} />
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
export function Sources({ sources }: { sources: Source[] }) {
  const [selected, setSelected] = useState<Source | null>(null);
  return (
    <>
      <div className="sources">
        {sources.map((source) =>
          source.isSample ? (
            <button
              className="source-chip"
              key={source.id}
              onClick={() => setSelected(source)}
              title={source.title}
            >
              <IconArrowUpRight size={11} />
              Sample source
            </button>
          ) : (
            <a
              className={`source-chip ${!source.checked ? 'unconfirmed' : ''}`}
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${source.title}\n${source.checked ? 'Excerpt corroborated' : 'Excerpt unconfirmed'} · ${new Date(source.retrievedAt).toLocaleDateString()}`}
            >
              <IconArrowUpRight size={11} />
              {domainLabel(source.url)}
              {!source.checked && ' ?'}
            </a>
          ),
        )}
      </div>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Sample evidence"
        description="Fictional fixture content, not a live research citation."
      >
        <Badge tone="amber">SAMPLE SOURCE</Badge>
        <h3 className="space-top">{selected?.title}</h3>
        <blockquote className="ask">{selected?.excerpt}</blockquote>
      </Modal>
    </>
  );
}
export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`toast ${toast.kind}`}
          >
            {toast.kind === 'error' ? <IconAlertTriangle size={18} /> : <IconCheck size={18} />}
            <span>{toast.message}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              <IconX size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
export function domainLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}
export function dateLabel(value: number, full = false) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(full ? { year: 'numeric' as const } : {}),
  }).format(value);
}
export function shortId(id: string) {
  return `RUN-${id.replaceAll('-', '').slice(0, 6).toUpperCase()}`;
}
export function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {(hint !== undefined || error !== undefined) && (
        <span className={`field-hint ${error ? 'negative' : ''}`}>{error || hint || '\u00a0'}</span>
      )}
    </label>
  );
}
