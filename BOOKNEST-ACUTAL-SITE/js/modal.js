// Custom Modal System - Beautiful alerts and confirms
class CustomModal {
    static show(options) {
        const {
            title = 'Notification',
            message = '',
            type = 'info', // info, success, warning, error, confirm
            icon = null,
            onConfirm = null,
            onCancel = null,
            confirmText = 'OK',
            cancelText = 'Cancel',
            showCancel = false
        } = options;

        // Remove existing modal if any
        const existing = document.getElementById('customModalOverlay');
        if (existing) existing.remove();

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'customModalOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            animation: fadeIn 0.2s ease;
        `;

        // Get icon and color based on type
        const typeConfig = {
            info: { icon: 'fa-info-circle', color: '#3b82f6', bg: '#dbeafe' },
            success: { icon: 'fa-check-circle', color: '#10b981', bg: '#d1fae5' },
            warning: { icon: 'fa-exclamation-triangle', color: '#f59e0b', bg: '#fef3c7' },
            error: { icon: 'fa-times-circle', color: '#ef4444', bg: '#fee2e2' },
            confirm: { icon: 'fa-question-circle', color: '#2F5D62', bg: '#F5F1E8' }
        };

        const config = typeConfig[type] || typeConfig.info;
        const finalIcon = icon || config.icon;

        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: ${type === 'info' ? '1000px' : '500px'};
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            position: relative;
        `;

        modal.innerHTML = `
            <div style="text-align: center;">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: ${config.bg};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                ">
                    <i class="fas ${finalIcon}" style="font-size: 2.5rem; color: ${config.color};"></i>
                </div>
                
                <h2 style="
                    margin: 0 0 1rem;
                    font-size: 1.5rem;
                    color: #1f2937;
                    font-weight: 700;
                ">${title}</h2>
                
                <p style="
                    margin: 0 0 2rem;
                    color: #6b7280;
                    font-size: 1rem;
                    line-height: 1.6;
                    white-space: pre-wrap;
                ">${message}</p>
                
                <div style="
                    display: flex;
                    gap: 0.75rem;
                    justify-content: center;
                ">
                    ${showCancel ? `
                        <button id="modalCancelBtn" style="
                            padding: 0.75rem 2rem;
                            border: 2px solid #e5e7eb;
                            background: white;
                            color: #6b7280;
                            border-radius: 8px;
                            font-size: 1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                            ${cancelText}
                        </button>
                    ` : ''}
                    
                    <button id="modalConfirmBtn" style="
                        padding: 0.75rem 2rem;
                        border: none;
                        background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%);
                        color: white;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: 0 4px 15px rgba(47, 93, 98, 0.4);
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(47, 93, 98, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(47, 93, 98, 0.4)'">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(30px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);

        // Handle button clicks
        const confirmBtn = document.getElementById('modalConfirmBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');

        const closeModal = () => {
            overlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => overlay.remove(), 200);
        };

        confirmBtn.onclick = () => {
            closeModal();
            if (onConfirm) onConfirm();
        };

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                closeModal();
                if (onCancel) onCancel();
            };
        }

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeModal();
                if (onCancel) onCancel();
            }
        };
    }

    static alert(message, title = 'Notification', type = 'info') {
        return new Promise((resolve) => {
            this.show({
                title,
                message,
                type,
                confirmText: 'OK',
                onConfirm: resolve
            });
        });
    }

    static success(message, title = 'Success!') {
        return this.alert(message, title, 'success');
    }

    static error(message, title = 'Error') {
        return this.alert(message, title, 'error');
    }

    static warning(message, title = 'Warning') {
        return this.alert(message, title, 'warning');
    }

    static confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            this.show({
                title,
                message,
                type: 'confirm',
                showCancel: true,
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });
    }
}

// Make it globally available
window.CustomModal = CustomModal;
