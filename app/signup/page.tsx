import SignUpForm from './SignUpForm';

export default function SignUpPage() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
  const configured = Boolean(supabaseUrl && supabaseAnonKey);
  return (
    <SignUpForm
      supabaseUrl={configured ? supabaseUrl : null}
      supabaseAnonKey={configured ? supabaseAnonKey : null}
    />
  );
}
