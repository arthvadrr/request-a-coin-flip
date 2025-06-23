import html from '../../html/requestView.html';
import { supabase } from '../util/supabaseClient.js';
import { copyToClipboard } from '../copyToClipboard.js';
import { ensureAnonymousLogin } from '../util/auth.js';
import { showToast } from '../util/toast.js';

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

		await copyToClipboard(`${window.location.href}?flipid=${data[0].id}`);
		showToast('Link copied!');
		const $div__request_success = document.getElementById('request-success');
		$div__request_success.classList.add('show');
	} catch (err) {
		console.error(err);
		const $div__request_error = document.getElementById('request-error');
		$div__request_error.classList.add('show');
	} finally {
		e.target.disabled = true;
	}
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
