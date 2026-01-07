export default function Modal({ isOpen, title, children, onClose, footer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div>{children}</div>
        {footer && <div style={{ marginTop: 24 }}>{footer}</div>}
      </div>
    </div>
  );
}
