// Utility for showing a toast message
export function showToast(message) {
	const toast = document.createElement('div');
	toast.setAttribute('role', 'status');
	toast.setAttribute('aria-live', 'polite');
	toast.classList.add('toast');
	toast.textContent = message;
	document.body.appendChild(toast);
	setTimeout(() => {
		toast.remove();
	}, 2000);
}
