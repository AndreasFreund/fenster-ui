import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import {
  Button, Checkbox, CheckboxGroup, ColorArea, ColorPicker, ColorSwatchPicker, ColorWheel, ComboBox, DateField, DatePicker,
  Form, GroupBox, Link, Meter, NumberField, ProgressBar, Radio, RadioGroup, Select, SelectItem, Slider, Switch, TextField,
  TimeField, ToggleButton, ToggleButtonGroup, Tooltip, TooltipTrigger,
} from '@andreasfreund/fenster-ui';
import { copy } from '../copy';
import { Example, useDemo } from '../demo';

const BUTTONS = `
<Button variant="primary">Apply</Button>
<Button>Cancel</Button>
<Button variant="danger">Delete</Button>
<Link href="…">View log</Link>`;

const VIEW_MODES = [
  ['details', 'Details', 'Show files as a details list'],
  ['list', 'List', 'Show files as a plain list'],
  ['tiles', 'Tiles', 'Show files as tiles'],
];

export function Buttons() {
  const { say } = useDemo();
  return (
    <>
      <Example
        title="Buttons and links"
        note="One primary button per group, for the action most people came for. Danger is only for destroying data. Labels are one or two words in sentence case."
        code={BUTTONS}
      >
        <div className="fui-row-gap">
          <Button variant="primary" onPress={() => say('Applied.')}>Apply</Button>
          <Button onPress={() => say('Cancelled.')}>Cancel</Button>
          <Button isDisabled>Reset</Button>
          <Button variant="danger" onPress={() => say('Nothing was deleted.')}>Delete</Button>
          <Link onPress={() => say('Opened the log.')}>View log</Link>
        </div>
      </Example>
      <Example title="Toggle buttons" note="A toggled button takes the highlight colour. A group with one choice works like radio buttons.">
        <div className="fui-row-gap">
          <ToggleButtonGroup aria-label="View mode" selectionMode="single" defaultSelectedKeys={['details']} disallowEmptySelection>
            {VIEW_MODES.map(([id, label, tip]) => (
              <TooltipTrigger key={id}>
                <ToggleButton id={id}>{label}</ToggleButton>
                <Tooltip>{tip}</Tooltip>
              </TooltipTrigger>
            ))}
          </ToggleButtonGroup>
          <ToggleButton defaultSelected>Word wrap</ToggleButton>
        </div>
      </Example>
    </>
  );
}

const FIELDS = `
<Form onSubmit={save}>
  <TextField label="Host" defaultValue="db.internal" />
  <TextField label="Port" mono value={port} onChange={setPort} isInvalid={portInvalid}
    errorMessage="Port is out of range. Enter a number from 1 to 65535." />
  <Select label="Driver" defaultSelectedKey="pg">
    <SelectItem id="pg">PostgreSQL</SelectItem>
  </Select>
</Form>`;

export function Fields() {
  const [port, setPort] = useState('80800');
  const portInvalid = !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535;
  return (
    <>
      <Example
        title="Form"
        note="A Form puts labels in a fixed left column. An error says what is wrong, then what to enter; the status word before it comes from LabelsProvider."
        code={FIELDS}
      >
        <Form onSubmit={(e) => e.preventDefault()}>
          <TextField label="Host" defaultValue="db.internal" />
          <TextField label="Port" mono value={port} onChange={setPort} isInvalid={portInvalid} errorMessage="Port is out of range. Enter a number from 1 to 65535." />
          <TextField label="Data folder" mono defaultValue="/var/lib/billing" description="Absolute path on the server." />
          <TextField label="Replica" isDisabled defaultValue="none" />
          <Select label="Driver" defaultSelectedKey="pg">
            <SelectItem id="pg">PostgreSQL</SelectItem>
            <SelectItem id="mysql">MySQL</SelectItem>
            <SelectItem id="sqlite">SQLite</SelectItem>
          </Select>
          <ComboBox label="Region" defaultInputValue="eu-central-1" allowsCustomValue>
            <SelectItem id="eu-central-1">eu-central-1</SelectItem>
            <SelectItem id="eu-west-1">eu-west-1</SelectItem>
            <SelectItem id="us-east-1">us-east-1</SelectItem>
            <SelectItem id="ap-south-1">ap-south-1</SelectItem>
          </ComboBox>
          <NumberField label="Retries" defaultValue={3} minValue={0} maxValue={10} />
          <TextField label="Notes" multiline rows={3} defaultValue="Runs after the nightly backup." />
        </Form>
      </Example>
    </>
  );
}

const OPTIONS = [
  { id: 'hidden', label: 'Show hidden files' },
  { id: 'ext', label: 'Show file extensions' },
  { id: 'sync', label: 'Sync subfolders' },
];

export function Choices() {
  const [options, setOptions] = useState<Set<string>>(new Set(['hidden']));
  const toggle = (id: string, on: boolean) => setOptions((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
  const all = options.size === OPTIONS.length;
  return (
    <>
      <Example title="Checkboxes" note="A parent checkbox is indeterminate while only some of its options are on. A disabled GroupBox disables everything inside, so what does not apply stays visible.">
        <GroupBox legend="Folder options">
          <Checkbox isSelected={all} isIndeterminate={options.size > 0 && !all} onChange={(on) => setOptions(new Set(on ? OPTIONS.map((o) => o.id) : []))}>
            All options
          </Checkbox>
          <div className="fui-option-indent" style={{ display: 'flex', flexDirection: 'column' }}>
            {OPTIONS.map((o) => (
              <Checkbox key={o.id} isSelected={options.has(o.id)} onChange={(on) => toggle(o.id, on)}>{o.label}</Checkbox>
            ))}
          </div>
        </GroupBox>
        <GroupBox legend="Network share (not connected)" isDisabled>
          <Checkbox defaultSelected>Reconnect at sign-in</Checkbox>
          <Checkbox>Use different credentials</Checkbox>
        </GroupBox>
      </Example>
      <Example title="Radio buttons, groups and switches" note="Prefer a checkbox in a form. A switch is for a setting that applies at once.">
        <Form onSubmit={(e) => e.preventDefault()}>
          <RadioGroup label="Mode" defaultValue="rw">
            <Radio value="rw">Read and write</Radio>
            <Radio value="ro">Read only</Radio>
            <Radio value="off" isDisabled>Offline</Radio>
          </RadioGroup>
          <CheckboxGroup label="Notify" defaultValue={['email']}>
            <Checkbox value="email">By email</Checkbox>
            <Checkbox value="chat">In chat</Checkbox>
            <Checkbox value="pager">By pager</Checkbox>
          </CheckboxGroup>
        </Form>
        <Switch defaultSelected>Sync automatically</Switch>
      </Example>
    </>
  );
}

export function DatesAndColours() {
  return (
    <>
      <Example title="Date and time" note="Each part of a date or time is typed or stepped on its own. The picker adds a calendar.">
        <Form onSubmit={(e) => e.preventDefault()}>
          <DateField label="Start date" defaultValue={today(getLocalTimeZone())} />
          <TimeField label="Start time" />
          <DatePicker label="End date" defaultValue={today(getLocalTimeZone()).add({ days: 14 })} />
        </Form>
      </Example>
      <Example title="Colour" note="The picker opens an area, a hue slider and a hex field; swatches offer presets.">
        <ColorPicker aria-label="Label colour" hueLabel={copy.hue} hexLabel={copy.hex} defaultValue="#1f5fbf">
          <ColorSwatchPicker aria-label="Presets" colors={['#006e78', '#1f5fbf', '#4f46b8', '#85307f', '#43586e']} />
        </ColorPicker>
        <div className="fui-row-gap" style={{ alignItems: 'flex-start' }}>
          <ColorArea aria-label="Colour area" defaultValue="hsb(200, 70%, 60%)" />
          <ColorWheel aria-label="Hue" defaultValue="hsl(200, 70%, 45%)" />
        </div>
      </Example>
    </>
  );
}

export function Ranges() {
  return (
    <>
      <Example title="Slider">
        <Form onSubmit={(e) => e.preventDefault()}>
          <Slider label="Batch size" defaultValue={40} minValue={10} maxValue={100} step={10} />
        </Form>
      </Example>
      <Example title="Progress and meter" note="A progress bar shows work under way; without a known end it is indeterminate. A meter shows a level.">
        <div className="fui-stack" style={{ gap: 'var(--space-2)', maxWidth: 420 }}>
          <ProgressBar label="Copying" value={62} />
          <ProgressBar label="Connecting" isIndeterminate />
          <Meter label="Disk" value={81} />
        </div>
      </Example>
    </>
  );
}
