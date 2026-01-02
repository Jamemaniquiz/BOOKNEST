// Custom Modal System for BookNest
// Replaces ugly browser alerts and confirms with beautiful styled modals

class ModalSystem {
    constructor() {
        this.currentModal = null;
    }

    // Show a custom alert modal
    showAlert(options) {
        return new Promise((resolve) => {
            const {
                title = 'Notice',
                message = '',
                icon = 'info-circle',
                iconColor = '#667eea',
                confirmText = 'OK',
                confirmColor = '#667eea'
            } = options;

            this.closeCurrentModal();

            const modal = document.createElement('div');
            modal.className = 'custom-modal-overlay';
            modal.innerHTML = `
                <div class="custom-modal">
                    <div class="modal-header">
                        <i class="fas fa-${icon}" style="color: ${iconColor};"></i>
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-primary" style="background: ${confirmColor};">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.currentModal = modal;

            // Trigger animation
            setTimeout(() => modal.classList.add('show'), 10);

            const confirmBtn = modal.querySelector('.modal-btn-primary');
            confirmBtn.onclick = () => {
                this.closeCurrentModal();
                resolve(true);
            };

            // Close on overlay click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeCurrentModal();
                    resolve(true);
                }
            };
        });
    }

    // Show a custom confirm modal
    showConfirm(options) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm',
                message = '',
                icon = 'question-circle',
                iconColor = '#667eea',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                confirmColor = '#667eea',
                dangerMode = false
            } = options;

            this.closeCurrentModal();

            const modal = document.createElement('div');
            modal.className = 'custom-modal-overlay';
            modal.innerHTML = `
                <div class="custom-modal ${dangerMode ? 'danger-modal' : ''}">
                    <div class="modal-header">
                        <i class="fas fa-${icon}" style="color: ${iconColor};"></i>
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-secondary">
                            ${cancelText}
                        </button>
                        <button class="modal-btn modal-btn-primary" style="background: ${confirmColor};">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.currentModal = modal;

            // Trigger animation
            setTimeout(() => modal.classList.add('show'), 10);

            const confirmBtn = modal.querySelector('.modal-btn-primary');
            const cancelBtn = modal.querySelector('.modal-btn-secondary');

            confirmBtn.onclick = () => {
                this.closeCurrentModal();
                resolve(true);
            };

            cancelBtn.onclick = () => {
                this.closeCurrentModal();
                resolve(false);
            };

            // Close on overlay click = cancel
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeCurrentModal();
                    resolve(false);
                }
            };
        });
    }

    // Show a success modal
    showSuccess(message, title = 'Success!') {
        return this.showAlert({
            title,
            message,
            icon: 'check-circle',
            iconColor: '#10b981',
            confirmColor: '#10b981'
        });
    }

    // Show an error modal
    showError(message, title = 'Error') {
        return this.showAlert({
            title,
            message,
            icon: 'exclamation-circle',
            iconColor: '#ef4444',
            confirmColor: '#ef4444'
        });
    }

    // Show a warning modal
    showWarning(message, title = 'Warning') {
        return this.showAlert({
            title,
            message,
            icon: 'exclamation-triangle',
            iconColor: '#f59e0b',
            confirmColor: '#f59e0b'
        });
    }

    closeCurrentModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('show');
            setTimeout(() => {
                if (this.currentModal && this.currentModal.parentNode) {
                    this.currentModal.remove();
                }
                this.currentModal = null;
            }, 300);
        }
    }
}

// Create global instance
window.modalSystem = new ModalSystem();

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .custom-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        opacity: 0;
        transition: opacity 0.3s ease;
        padding: 20px;
    }

    .custom-modal-overlay.show {
        opacity: 1;
    }

    .custom-modal {
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 100%;
        transform: scale(0.9) translateY(20px);
        transition: transform 0.3s ease;
        overflow: hidden;
    }

    .custom-modal-overlay.show .custom-modal {
        transform: scale(1) translateY(0);
    }

    .modal-header {
        padding: 2rem;
        text-align: center;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-header i {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: block;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.5rem;
        color: #1f2937;
        font-weight: 700;
    }

    .modal-body {
        padding: 2rem;
    }

    .modal-body p {
        margin: 0;
        color: #4b5563;
        font-size: 1rem;
        line-height: 1.6;
        text-align: center;
        white-space: pre-line;
    }

    .modal-footer {
        padding: 1.5rem 2rem;
        background: #f9fafb;
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .modal-btn {
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
    }

    .modal-btn-primary {
        background: #667eea;
        color: white;
    }

    .modal-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .modal-btn-secondary {
        background: white;
        color: #6b7280;
        border: 2px solid #e5e7eb;
    }

    .modal-btn-secondary:hover {
        background: #f9fafb;
        border-color: #d1d5db;
    }

    .danger-modal .modal-header i {
        color: #ef4444 !important;
    }

    .danger-modal .modal-btn-primary {
        background: #ef4444;
    }

    .danger-modal .modal-btn-primary:hover {
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }

    @media (max-width: 640px) {
        .modal-footer {
            flex-direction: column-reverse;
        }
        
        .modal-btn {
            width: 100%;
        }
    }
`;
document.head.appendChild(style);
