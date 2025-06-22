import html from '../../html/requestView.html';
import { createClient } from '@supabase/supabase-js';
import { copyToClipboard } from '../copyToClipboard.js';

const SERVER_URI = process.env.SERVER_URI;
const ANON_KEY = process.env.ANON_KEY;
const supabase = createClient(SERVER_URI, ANON_KEY);

async function ensureAnonymousLogin() {
	try {
		const { data } = await supabase.auth.getSession();

		if (!data.session) {
			const { data: anonData, error: anonError } =
				await supabase.auth.signInAnonymously();
			if (anonError) {
				console.error('Anonymous sign-in failed:', anonError.message);
			} else {
				console.log('Signed in anonymously:', anonData.user.id);
			}
		}
	} catch (error) {
		console.error('Error during anonymous login:', error.message || error);
	}
}

async function handleRequestFlip(e) {
	try {
		const { data: userData, error: userError } = await supabase.auth.getUser();
		const userId = userData?.user?.id;

		if (!userId || userError) {
			console.error('User fetch failed:', userError?.message || 'No user ID');
			throw new Error('Unable to get authenticated user.');
		}

		const { data, error, status } = await supabase
			.from('flip-results')
			.insert([{ result: null }])
			.select();

		if (error) {
			console.error('Supabase insert error:', error.message);
			throw error;
		}

		if (!data || !data[0]) {
			if (status === 403) {
				throw new Error(
					'Insert forbidden: check RLS policies and insert permissions.'
				);
			}
			throw new Error('Insert succeeded but no data returned.');
		}

		const url = new URL(window.location.href);
		url.pathname = `?flip_id=${data[0].id}`;
		await copyToClipboard(url.toString());
		showToast('Link copied!');
		const $div__request_success = document.getElementById('request-success');
		$div__request_success.classList.add('show');
	} catch (err) {
		console.error(err);
		const $div__request_error = document.getElementById('request-error');
		$div__request_error.classList.add('show');
		document.createElement('div');
	} finally {
		e.target.disabled = true;
	}
}

function showToast(message) {
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

export function renderRequestView(container) {
	ensureAnonymousLogin();
	supabase.auth.getUser().then(({ data }) => {
		console.log('Supabase user ID:', data?.user?.id);
	});

	container.innerHTML = html;
	document
		.getElementById('requestFlip')
		.addEventListener('click', handleRequestFlip);
}
