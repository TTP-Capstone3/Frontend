import { createPortal } from 'react-dom';

export default function Modal({ title, onClose, children }) {

    return createPortal(
        <div className="modal-backdrop" onMouseDown={onClose}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className="modal-card"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="modal-header">
                    <h2 id="modal-title">{title}</h2>
                    <button type="button" onClick={onClose} aria-label="Close">
                        x
                    </button>
                </header>

                {children}
            </section>
        </div>,
        document.body,
    );
}