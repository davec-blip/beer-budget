# Beer Budget — UI Spec

## Design Principles

- Mobile-first. Max content width `390px`, centered on desktop with a white card on a light gray background (`bg-gray-50`)
- Clean and minimal. White surfaces, thin borders, generous whitespace
- No shadows. Borders only: `border border-gray-200` (0.5px equivalent in Tailwind: use `border` with `border-gray-200`)
- Two font weights only: `font-normal` (400) and `font-medium` (500). Never `font-semibold` or `font-bold`
- Sentence case everywhere — no ALL CAPS, no Title Case in labels
- Bottom nav is fixed to the bottom of the screen on all app pages

---

## Color Tokens

Define these as Tailwind config extensions or CSS variables. Used consistently across all screens.

```js
// tailwind.config.js
colors: {
  budget: {
    positive: '#1D9E75',   // green — budget > 0
    zero:     '#BA7517',   // amber — budget === 0
    negative: '#E24B4A',   // red   — budget < 0
  },
  delta: {
    posText:  '#0F6E56',
    posBg:    '#E1F5EE',
    negText:  '#A32D2D',
    negBg:    '#FCEBEB',
    neutText: '#5F5E5A',
    neutBg:   '#F1EFE8',
  }
}
```

---

## Layout Shell

All authenticated pages share this shell:

```
┌─────────────────────────────┐
│  page content (scrollable)  │
│                             │
│                             │
├─────────────────────────────┤
│  bottom nav (fixed)         │
└─────────────────────────────┘
```

```tsx
// Outer wrapper — centers on desktop
<div className="min-h-screen bg-gray-50 flex justify-center">
  <div className="w-full max-w-[390px] bg-white min-h-screen flex flex-col relative">
    <main className="flex-1 overflow-y-auto pb-20">
      {/* page content */}
    </main>
    <BottomNav />
  </div>
</div>
```

---

## Bottom Nav

Fixed to bottom. Three items: Home, Log, Settings. Active item uses `text-gray-900`, inactive `text-gray-400`.

```tsx
<nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-200 flex justify-around items-center py-2 pb-3 z-10">
  <NavItem href="/" icon={<HomeIcon />} label="Home" />
  <NavItem href="/log" icon={<NotebookIcon />} label="Log" />
  <NavItem href="/settings" icon={<SettingsIcon />} label="Settings" />
</nav>
```

Each `NavItem`:
```tsx
<Link href={href} className="flex flex-col items-center gap-0.5">
  <span className={cn("w-5 h-5", isActive ? "text-gray-900" : "text-gray-400")}>
    {icon}
  </span>
  <span className={cn("text-[10px]", isActive ? "text-gray-900" : "text-gray-400")}>
    {label}
  </span>
</Link>
```

Use Lucide icons: `Home`, `BookOpen`, `Settings` (20px).

---

## Login Page `/login`

No bottom nav. Vertically centered content.

```
┌─────────────────────────────┐
│                             │
│                             │
│         🍺                  │
│      Beer Budget            │
│   Sign in to your account   │
│                             │
│  Username                   │
│  [____________________]     │
│                             │
│  Password                   │
│  [____________________]     │
│                             │
│  [      Sign in       ]     │
│                             │
└─────────────────────────────┘
```

```tsx
<div className="min-h-screen bg-white flex flex-col justify-center px-6 max-w-[390px] mx-auto">
  <div className="text-4xl text-center mb-1">🍺</div>
  <h1 className="text-2xl font-medium text-center text-gray-900 mb-1">Beer Budget</h1>
  <p className="text-sm text-gray-500 text-center mb-8">Sign in to your account</p>

  <label className="text-xs text-gray-500 mb-1 block">Username</label>
  <input
    type="text"
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-4 focus:outline-none focus:ring-1 focus:ring-gray-400"
  />

  <label className="text-xs text-gray-500 mb-1 block">Password</label>
  <input
    type="password"
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-6 focus:outline-none focus:ring-1 focus:ring-gray-400"
  />

  <button className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg">
    Sign in
  </button>
</div>
```

Error state: red `text-xs text-red-600 mt-2` message below the button.

---

## Home Page `/`

### Layout

```
┌─────────────────────────────┐
│  Tuesday, May 12            │  ← text-base font-medium text-gray-900 text-center, mt-6
│                             │
│           4.0               │  ← text-[72px] font-medium text-center (color by budget value)
│     beers in budget         │  ← text-sm text-gray-500 text-center mt-1
│                             │
│  ─────────────────────────  │  ← border-t border-gray-200 mx-5
│                             │
│     Today's drinks          │  ← text-sm text-gray-500 text-center (or "X drinks so far today")
│                             │
│    [−]      2      [+]      │  ← counter row
│                             │
│       [    Submit    ]      │  ← centered button
└─────────────────────────────┘
```

### Budget number color logic
```tsx
function budgetColor(value: number) {
  if (value > 0) return '#1D9E75'
  if (value === 0) return '#BA7517'
  return '#E24B4A'
}

<span style={{ color: budgetColor(budget) }} className="text-[72px] font-medium leading-none">
  {budget.toFixed(1)}
</span>
```

### Date label
```tsx
// Uses logDate from API — shows yesterday if before 8am in user's timezone
<p className="text-base font-medium text-gray-900 text-center mt-6 mb-5">
  {format(parseISO(logDate), 'EEEE, MMM d')}
</p>
```

### Divider
```tsx
<div className="border-t border-gray-200 mx-5 my-5" />
```

### Today's drinks label
```tsx
<p className="text-sm text-gray-500 text-center mb-3">
  {count === 0 ? "Today's drinks" : `${count} drinks so far today`}
</p>
```

### Counter row
```tsx
<div className="flex items-center justify-center gap-6">
  <button
    onClick={decrement}
    className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 text-xl"
  >
    <Minus className="w-5 h-5" />
  </button>
  <span className="text-[40px] font-medium text-gray-900 min-w-[44px] text-center">
    {count}
  </span>
  <button
    onClick={increment}
    className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
  >
    <Plus className="w-5 h-5" />
  </button>
</div>
```

### Submit button

Centered below counter. Disabled (grayed) when `count === todayCount` (no change from loaded value).

```tsx
<div className="flex justify-center mt-5">
  <button
    onClick={handleSubmit}
    disabled={count === todayCount}
    className={cn(
      "px-9 py-2.5 rounded-lg text-sm font-medium transition-colors",
      count !== todayCount
        ? "bg-gray-900 text-white"
        : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
    )}
  >
    Submit
  </button>
</div>
```

---

## Log Page `/log`

### Tab bar

```tsx
<div className="flex border-b border-gray-200 mt-1">
  <button
    className={cn(
      "flex-1 text-center py-2.5 text-sm transition-colors",
      activeTab === 'drinks'
        ? "text-gray-900 font-medium border-b-2 border-gray-900 -mb-px"
        : "text-gray-400"
    )}
    onClick={() => setActiveTab('drinks')}
  >
    Drinks
  </button>
  <button
    className={cn(
      "flex-1 text-center py-2.5 text-sm transition-colors",
      activeTab === 'budget'
        ? "text-gray-900 font-medium border-b-2 border-gray-900 -mb-px"
        : "text-gray-400"
    )}
    onClick={() => setActiveTab('budget')}
  >
    Budget
  </button>
</div>
```

---

### Drinks Tab

**Add entry button:**
```tsx
<button className="flex items-center gap-1.5 text-sm text-blue-600 mt-4 mb-4">
  <PlusCircle className="w-4 h-4" />
  Add entry
</button>
```

**Section headers:**
```tsx
<p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
  Past 7 days
</p>
```

**Drink log row** (tappable, links to `/log/[date]`):
```tsx
<Link href={`/log/${entry.date}`}
  className="flex justify-between items-center py-2.5 border-b border-gray-100">
  <span className="text-sm text-gray-900">{formattedDate}</span>
  <span className="text-sm text-gray-500">{entry.count} {entry.count === 1 ? 'drink' : 'drinks'}</span>
</Link>
```

**Reset marker row** (non-interactive, rendered inline in the sorted list):
```tsx
<div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
  <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
  <span className="text-sm text-gray-400">
    Budget reset — {format(parseISO(resetLogDate), 'MMM d, yyyy')}
  </span>
</div>
```

---

### Budget Tab

**Window toggle:**
```tsx
<div className="flex gap-1.5 mt-4 mb-4">
  {(['7d', '30d', '90d', 'All'] as const).map(w => (
    <button
      key={w}
      onClick={() => setWindow(w)}
      className={cn(
        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
        window === w
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-500 border-gray-200"
      )}
    >
      {w}
    </button>
  ))}
</div>
```

**Chart toggle:**
```tsx
<button
  onClick={() => setShowChart(!showChart)}
  className="flex items-center gap-1.5 text-xs text-gray-500 mb-3"
>
  <LineChart className="w-3.5 h-3.5" />
  {showChart ? 'Hide chart' : 'Show chart'}
</button>
```

**Chart** (Recharts, shown when `showChart` is true):
```tsx
<div className="bg-gray-50 rounded-lg p-3 mb-4">
  <ResponsiveContainer width="100%" height={120}>
    <LineChart data={budgetLog}>
      <XAxis
        dataKey="date"
        tickFormatter={d => format(parseISO(d), 'M/d')}
        tick={{ fontSize: 10, fill: '#9CA3AF' }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis hide />
      <Tooltip
        formatter={(v: number) => [v.toFixed(1), 'Budget']}
        labelFormatter={l => format(parseISO(l as string), 'MMM d')}
        contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8 }}
      />
      <Line
        type="monotone"
        dataKey="budget"
        stroke="#1D9E75"
        strokeWidth={1.5}
        dot={false}
        activeDot={{ r: 3, fill: '#1D9E75' }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
```

**Budget log rows:**
```tsx
<div className="flex justify-between items-center py-2.5 border-b border-gray-100">
  <span className="text-sm text-gray-900">{format(parseISO(row.date), 'MMM d')}</span>
  <div className="flex items-center gap-2">
    <DeltaPill delta={row.delta} />
    <span className="text-sm font-medium min-w-[36px] text-right"
      style={{ color: budgetColor(row.budget) }}>
      {row.budget.toFixed(1)}
    </span>
  </div>
</div>
```

**DeltaPill component:**
```tsx
function DeltaPill({ delta }: { delta: number }) {
  const isPos = delta > 0
  const isNeg = delta < 0
  return (
    <span className={cn(
      "text-xs font-medium px-2 py-0.5 rounded-full",
      isPos && "bg-[#E1F5EE] text-[#0F6E56]",
      isNeg && "bg-[#FCEBEB] text-[#A32D2D]",
      !isPos && !isNeg && "bg-[#F1EFE8] text-[#5F5E5A]"
    )}>
      {isPos ? '+' : ''}{delta.toFixed(1)}
    </span>
  )
}
```

---

## Add / Edit Entry `/log/new` and `/log/[date]`

```
┌─────────────────────────────┐
│  ← Log                      │  ← back link
│                             │
│  Add entry                  │  ← text-xl font-medium
│                             │
│  Date                       │
│  [____________________]     │
│                             │
│  Number of drinks           │
│  [____________________]     │
│                             │
│  [      Save entry    ]     │
│                             │
│  (overwrite warning here    │
│   if date already exists)   │
└─────────────────────────────┘
```

**Back link:**
```tsx
<Link href="/log" className="flex items-center gap-1.5 text-sm text-gray-500 mt-5 mb-5">
  <ArrowLeft className="w-4 h-4" />
  Log
</Link>
```

**Page title:**
```tsx
<h1 className="text-xl font-medium text-gray-900 mb-6">
  {isEdit ? 'Edit entry' : 'Add entry'}
</h1>
```

**Form fields:**
```tsx
<label className="text-xs text-gray-500 block mb-1">Date</label>
<input
  type="date"
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-4 focus:outline-none focus:ring-1 focus:ring-gray-400"
/>

<label className="text-xs text-gray-500 block mb-1">Number of drinks</label>
<input
  type="number"
  min="0"
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-6 focus:outline-none focus:ring-1 focus:ring-gray-400"
/>
```

**Overwrite warning** (shown when editing a date that already has an entry):
```tsx
<div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4 text-xs text-amber-800">
  An entry already exists for this date. Saving will overwrite it.
</div>
```

**Save button:**
```tsx
<button className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg">
  Save entry
</button>
```

---

## Settings Page `/settings`

### Section structure
```tsx
<div className="px-5 pt-6">
  <h1 className="text-xl font-medium text-gray-900 mb-6">Settings</h1>

  <SectionHeader label="Budget" />
  {/* rows */}

  <SectionHeader label="Account" />
  {/* rows */}

  <div className="mt-8 mb-6">
    {/* danger zone */}
  </div>
</div>
```

**Section header:**
```tsx
<p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 mt-5">
  {label}
</p>
```

**Standard setting row:**
```tsx
<div className="flex justify-between items-center py-3 border-b border-gray-100">
  <span className="text-sm text-gray-900">{label}</span>
  <span className="text-sm text-gray-500 flex items-center gap-1">
    {value}
    {tappable && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
  </span>
</div>
```

**Accrual rate stepper:**
```tsx
<div className="flex justify-between items-center py-3 border-b border-gray-100">
  <span className="text-sm text-gray-900">Daily accrual rate</span>
  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1">
    <button onClick={decrement} className="w-6 h-6 flex items-center justify-center text-gray-500">
      <Minus className="w-3.5 h-3.5" />
    </button>
    <span className="text-sm font-medium min-w-[32px] text-center">{rate.toFixed(2)}</span>
    <button onClick={increment} className="w-6 h-6 flex items-center justify-center text-gray-500">
      <Plus className="w-3.5 h-3.5" />
    </button>
  </div>
</div>
```

Step: `0.25`. Min: `0.25`. Auto-saves on change (debounced 500ms or on blur).

**Timezone selector:**
```tsx
<div className="flex justify-between items-center py-3 border-b border-gray-100">
  <span className="text-sm text-gray-900">Timezone</span>
  <select
    className="text-sm text-gray-500 bg-transparent border-none focus:outline-none text-right max-w-[180px]"
    value={timezone}
    onChange={e => saveTimezone(e.target.value)}
  >
    {Intl.supportedValuesOf('timeZone').map(tz => (
      <option key={tz} value={tz}>{tz}</option>
    ))}
  </select>
</div>
```

**Sign out row:**
```tsx
<div className="flex justify-between items-center py-3 border-b border-gray-100">
  <span className="text-sm text-gray-900">Signed in as</span>
  <span className="text-sm text-gray-500">{username}</span>
</div>
<button
  onClick={() => signOut()}
  className="flex justify-between items-center w-full py-3 border-b border-gray-100"
>
  <span className="text-sm text-gray-900">Sign out</span>
  <LogOut className="w-4 h-4 text-gray-400" />
</button>
```

**Reset budget button (danger zone):**
```tsx
<button
  onClick={() => setShowResetModal(true)}
  className="w-full py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium"
>
  Reset budget to 0
</button>
```

**Reset confirmation modal:**

Use a simple full-screen overlay (no `position: fixed` issues in a mobile web context):

```tsx
{showResetModal && (
  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 px-6">
    <div className="bg-white rounded-2xl p-6 w-full max-w-[320px]">
      <h2 className="text-base font-medium text-gray-900 mb-2">Reset budget?</h2>
      <p className="text-sm text-gray-500 mb-5">
        This will set your budget to 0 and start a new tracking period from today.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setShowResetModal(false)}
          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleReset}
          className="flex-1 py-2 bg-red-600 rounded-lg text-sm text-white font-medium"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Shared Components Summary

| Component | Location | Notes |
|---|---|---|
| `BudgetDisplay` | `components/BudgetDisplay.tsx` | Large number + label, color logic |
| `DrinkCounter` | `components/DrinkCounter.tsx` | −/+ buttons, count display, submit |
| `DeltaPill` | `components/DeltaPill.tsx` | Colored pill for budget delta |
| `BudgetLogChart` | `components/BudgetLogChart.tsx` | Recharts wrapper |
| `WindowToggle` | `components/WindowToggle.tsx` | 7d/30d/90d/All pill selector |
| `ResetMarker` | `components/ResetMarker.tsx` | Muted reset row in drink log |
| `TimezoneSelect` | `components/TimezoneSelect.tsx` | Intl timezone dropdown |
| `BottomNav` | `components/BottomNav.tsx` | Fixed bottom nav, active state |
| `SectionHeader` | `components/SectionHeader.tsx` | Muted uppercase section label |

---

## Responsive Behavior

The app is designed for mobile (390px). On desktop:
- The `max-w-[390px]` container is centered
- `bg-gray-50` fills the rest of the screen
- The bottom nav stays within the container (not full-width)
- No other layout changes needed — this is not a responsive multi-column layout
