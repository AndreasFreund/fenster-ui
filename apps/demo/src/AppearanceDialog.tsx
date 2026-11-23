import { useState, type CSSProperties } from 'react';
import {
  ACCENT_PRESETS, Button, Checkbox, ColorPicker, Dialog, DialogFooter, Form, GroupBox, Link, Radio, RadioGroup,
  applyAppearance, forcedAppearance, loadAppearance, resolveAccent, saveAppearance, useEffectiveDark,
  type AccentChoice, type Appearance, type ThemeChoice,
} from '@andreasfreund/fenster-ui';
import { Status } from './status';
import { copy } from './copy';

export interface AppearanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the saved appearance after OK. */
  onSave?: (a: Appearance) => void;
}

const accentKey = (a: AccentChoice) => (a.kind === 'custom' ? 'custom' : a.id);

/** Theme, size and accent settings. Changes preview live; OK saves, Cancel reverts. */
export function AppearanceDialog(props: AppearanceDialogProps) {
  return props.isOpen ? <AppearanceForm {...props} /> : null;
}

function AppearanceForm({ isOpen, onOpenChange, onSave }: AppearanceDialogProps) {
  const [saved, setSaved] = useState<Appearance>(loadAppearance);
  const [draft, setDraft] = useState<Appearance>(saved);
  const [lastCustom, setLastCustom] = useState(saved.accent.kind === 'custom' ? saved.accent.color : '#b0005a');
  const dark = useEffectiveDark(draft.theme);
  const t = copy.appearance;
  // The app can decide parts itself. Their controls are left out: they would never become available.
  const forced = forcedAppearance();

  const update = (next: Appearance) => {
    setDraft(next);
    applyAppearance(next); // live preview
  };

  const close = (commit: boolean) => {
    if (commit) {
      saveAppearance(draft);
      setSaved(draft);
      onSave?.(draft);
    } else {
      applyAppearance(saved);
    }
    onOpenChange(false);
  };

  const resolved = resolveAccent(draft.accent);
  const adjusted = draft.accent.kind === 'custom' && (dark ? resolved.adjustedDark : resolved.adjustedLight);

  return (
    <Dialog title={t.title} isOpen={isOpen} onOpenChange={(open) => { if (!open) close(false); }}>
      <Form onSubmit={(e) => { e.preventDefault(); close(true); }}>
        {!('theme' in forced) && (
          <RadioGroup label={t.theme} value={draft.theme} onChange={(v) => update({ ...draft, theme: v as ThemeChoice })}>
            <Radio value="system">{t.sameAsSystem}</Radio>
            <Radio value="light">{t.light}</Radio>
            <Radio value="dark">{t.dark}</Radio>
          </RadioGroup>
        )}

        {!('density' in forced) && (
          <RadioGroup label={t.size} value={draft.density} onChange={(v) => update({ ...draft, density: v as Appearance['density'] })}>
            <Radio value="compact">{t.compact}</Radio>
            <Radio value="comfortable">{t.comfortable}</Radio>
          </RadioGroup>
        )}

        {!('accent' in forced) && <RadioGroup
          label={t.accent}
          value={accentKey(draft.accent)}
          onChange={(v) => update({ ...draft, accent: v === 'custom' ? { kind: 'custom', color: lastCustom } : { kind: 'preset', id: v } })}
          description={
            adjusted ? (
              <>
                <Status kind="note" />
                {t.adjustedTo(dark ? resolved.dark : resolved.light)}
              </>
            ) : undefined
          }
        >
          {ACCENT_PRESETS.map((p) => (
            <Radio key={p.id} value={p.id}>
              <span className="fui-swatch" style={{ '--fui-swatch': dark ? p.dark : p.light } as CSSProperties} aria-hidden="true" />
              {t.presetNames[p.id] ?? p.id}
            </Radio>
          ))}
          <div className="fui-option-row">
            <Radio value="custom">
              <span className="fui-swatch" style={{ '--fui-swatch': dark ? resolveAccent({ kind: 'custom', color: lastCustom }).dark : resolveAccent({ kind: 'custom', color: lastCustom }).light } as CSSProperties} aria-hidden="true" />
              {t.custom}
            </Radio>
            <ColorPicker
              aria-label={t.customColour}
              hueLabel={copy.hue}
              hexLabel={copy.hex}
              value={lastCustom}
              onChange={(c) => {
                const hex = c.toString('hex');
                setLastCustom(hex);
                update({ ...draft, accent: { kind: 'custom', color: hex } });
              }}
            />
          </div>
        </RadioGroup>}

        <div className="fui-form-full">
          <GroupBox legend={t.preview}>
            <div className="fui-row-gap">
              <Button variant="primary" excludeFromTabOrder>{t.primary}</Button>
              <Checkbox defaultSelected excludeFromTabOrder>{t.checked}</Checkbox>
              <Link href="#appearance-preview">{t.link}</Link>
            </div>
          </GroupBox>
        </div>

        <DialogFooter className="fui-form-full">
          <Button variant="primary" type="submit">{t.ok}</Button>
          <Button onPress={() => close(false)}>{t.cancel}</Button>
        </DialogFooter>
      </Form>
    </Dialog>
  );
}
