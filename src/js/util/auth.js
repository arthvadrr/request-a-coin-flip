// Utility for Supabase anonymous login
import { supabase } from './supabaseClient.js';

export async function ensureAnonymousLogin() {
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
