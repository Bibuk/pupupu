class Modal {
    constructor(title, content) {
        this.title = title;
        this.content = content;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        
        this.element.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title">${this.title}</h2>
                    <button class="modal-close" aria-label="Закрыть">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.content}
                </div>
            </div>
        `;

        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.close();
            }
        });

        this.element.querySelector('.modal-close').addEventListener('click', () => {
            this.close();
        });

        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escHandler);

        return this.element;
    }

    show() {
        document.body.appendChild(this.render());
        setTimeout(() => {
            this.element.classList.add('show');
        }, 10);
    }

    close() {
        this.element.classList.remove('show');
        document.removeEventListener('keydown', this.escHandler);
        setTimeout(() => {
            this.element?.remove();
        }, 300);
    }
}

window.Modal = Modal;
