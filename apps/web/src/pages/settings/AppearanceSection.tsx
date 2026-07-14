import type { ThemePreference } from '../../api/types.js';
import { useTheme } from '../../theme/ThemeProvider.js';

const OPTIONS: Array<{ value: ThemePreference; label: string; note: string }> = [
  { value: 'light', label: 'Light', note: 'Bright background, dark text' },
  { value: 'dark', label: 'Dark', note: 'Dark background, light text' },
  { value: 'system', label: 'System', note: 'Follow the operating system' }
];

export function AppearanceSection(): React.JSX.Element
{
  const { preference, setPreference } = useTheme();

  return (
    <section>
      <h1 className="settings-title">Appearance</h1>

      <div className="settings-group">
        <h2>Theme</h2>
        <p className="settings-note">
          The theme also applies to HTML and PDF exports: documents are saved in whichever theme
          is active when you export them.
        </p>
        <div className="theme-options" role="radiogroup" aria-label="Theme">
          {OPTIONS.map((option) => (
            <label key={option.value} className="theme-option" data-selected={preference === option.value}>
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={preference === option.value}
                onChange={() => setPreference(option.value)}
              />
              <span className={`theme-swatch theme-swatch-${option.value}`} aria-hidden="true">
                Aa
              </span>
              <span className="theme-option-label">{option.label}</span>
              <span className="theme-option-note">{option.note}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
