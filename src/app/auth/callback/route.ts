import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const inviteCode = searchParams.get('invite');
    const next = searchParams.get('next') ?? '/dashboard';
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('[Auth Callback] Processing callback:', {
        hasCode: !!code,
        hasInvite: !!inviteCode,
        hasError: !!errorParam,
        origin,
        next,
    });

    // If there's an error from the OAuth provider
    if (errorParam) {
        console.log('[Auth Callback] OAuth error:', errorParam, errorDescription);
        return NextResponse.redirect(
            `${origin}/auth?error=${encodeURIComponent(errorDescription || errorParam)}`
        );
    }

    if (code) {
        try {
            const supabase = await createClient();
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error('[Auth Callback] Code exchange error:', error);
                return NextResponse.redirect(
                    `${origin}/auth?error=${encodeURIComponent(error.message)}`
                );
            }

            console.log('[Auth Callback] Session established for user:', data?.user?.id);

            if (data?.user) {
                // If there's an invite code, consume it
                if (inviteCode) {
                    console.log('[Auth Callback] Consuming invite code:', inviteCode);
                    await supabase.rpc('use_invite_code', {
                        invite_code: inviteCode.toUpperCase().trim(),
                        user_id: data.user.id,
                    });
                }

                return NextResponse.redirect(`${origin}${next}`);
            }
        } catch (err) {
            console.error('[Auth Callback] Unexpected error:', err);
            return NextResponse.redirect(
                `${origin}/auth?error=${encodeURIComponent('Authentication failed unexpectedly')}`
            );
        }
    }

    // Return the user to an error page with instructions
    console.log('[Auth Callback] No code received, redirecting to auth');
    return NextResponse.redirect(`${origin}/auth?error=Could not authenticate`);
}
