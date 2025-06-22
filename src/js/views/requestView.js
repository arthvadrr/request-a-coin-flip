import html from '../../html/requestView.html';
import { createClient } from '@supabase/supabase-js';

const SERVER_URI = process.env.SERVER_URI;
const ANON_KEY = process.env.ANON_KEY;
const supabase = createClient(SERVER_URI, ANON_KEY);
window.supabase = supabase; // expose for debugging

async function ensureAnonymousLogin() {
	const { data, error } = await supabase.auth.getSession();
	if (!data.session) {
		const { data: anonData, error: anonError } =
			await supabase.auth.signInAnonymously();
		if (anonError) {
			console.error('Anonymous sign-in failed:', anonError.message);
		} else {
			console.log('Signed in anonymously:', anonData.user.id);
		}
	}
}

export function renderRequestView(container) {
	ensureAnonymousLogin();
	supabase.auth.getUser().then(({ data }) => {
		console.log('Supabase user ID:', data?.user?.id);
	});

	container.innerHTML = html;

	document.getElementById('requestFlip').addEventListener('click', async () => {
		try {
			const result = Math.random() < 0.5;

			// Ensure user is fetched before inserting
			const { data: userData, error: userError } =
				await supabase.auth.getUser();
			const userId = userData?.user?.id;

			if (!userId || userError) {
				console.error('User fetch failed:', userError?.message || 'No user ID');
				throw new Error('Unable to get authenticated user.');
			}

			console.log('Insert user_id:', userId);

			const { data, error, status } = await supabase
				.from('flip-results')
				.insert([{ result }])
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
			url.pathname = `/flip/${data[0].id}`;
			navigator.clipboard.writeText(url.toString());
			alert('Link copied to clipboard!');
		} catch (err) {
			console.error(err);
			alert('Error requesting coin flip.');
		}
	});
}
