import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const inviteCode = searchParams.get('invite');
    const next = searchParams.get('next') ?? '/dashboard';
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // If there's an error from the OAuth provider
    if (errorParam) {
        return NextResponse.redirect(
            `${origin}/auth?error=${encodeURIComponent(errorDescription || errorParam)}`
        );
    }

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            return NextResponse.redirect(
                `${origin}/auth?error=${encodeURIComponent(error.message)}`
            );
        }

        if (data?.user) {
            // If there's an invite code, consume it
            if (inviteCode) {
                await supabase.rpc('use_invite_code', {
                    invite_code: inviteCode.toUpperCase().trim(),
                    user_id: data.user.id,
                });
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth?error=Could not authenticate`);
}
