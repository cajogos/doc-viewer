export function SignInPrompt({ what }: { what: string }): React.JSX.Element
{
  return (
    <div className="settings-group">
      <p className="settings-note">
        Sign in as the admin user (sidebar, bottom left) to {what}.
      </p>
    </div>
  );
}
