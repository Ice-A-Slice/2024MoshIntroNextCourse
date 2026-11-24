'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Question = { a: number; b: number }
type Phase = 'start' | 'play' | 'won' | 'caught'
type Feedback = { kind: 'right' | 'wrong'; text: string } | null

const TOTAL_STEPS = 10 // rätta svar som behövs för att nå människobyn
const MAX_MISSES = 5 // så många fel innan Shere Khan hinner ikapp

const PRAISE = [
  'Baloo: "Toppen, lilla grabben! Det är det enkla livet det!"',
  'Baloo: "Snyggt! Du räknar som en riktig djungelbjörn!"',
  'Bagheera: "Mycket bra, Mowgli. Fortsätt så."',
  'Hathi: "Framåt marsch! Helt rätt!"',
  'Baloo: "Wow! Det där var godare än honung!"',
  'Kaa: "Ssssså klokt… helt rätt, ssssåklart."',
]

const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildDeck(tables: number[]): Question[] {
  const all: Question[] = []
  for (const a of tables) for (let b = 1; b <= 10; b++) all.push({ a, b })
  return shuffle(all)
}

function hintFor(q: Question): string {
  const { a, b } = q
  if (b <= 5) {
    return `Bagheera viskar: ${a} × ${b} är samma sak som ${Array(b).fill(a).join(' + ')}.`
  }
  const half = a * 5
  return `Bagheera viskar: ${a} × 5 = ${half}, och sedan ${half} + ${Array(b - 5).fill(a).join(' + ')} = ${a * b}.`
}

export default function JungleMultiplication() {
  const [selected, setSelected] = useState<number[]>([2, 3, 4, 5])
  const [phase, setPhase] = useState<Phase>('start')
  const [deck, setDeck] = useState<Question[]>([])
  const [current, setCurrent] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [steps, setSteps] = useState(0)
  const [misses, setMisses] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [mistakes, setMistakes] = useState<{ q: Question; given: string }[]>([])
  const [showTable, setShowTable] = useState(false)
  const [locked, setLocked] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase === 'play' && !locked) inputRef.current?.focus()
  }, [phase, current, locked])

  const toggleTable = (t: number) =>
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t].sort((x, y) => x - y)))

  const start = () => {
    if (selected.length === 0) return
    const d = buildDeck(selected)
    setCurrent(d[0])
    setDeck(d.slice(1))
    setAnswer('')
    setSteps(0)
    setMisses(0)
    setStreak(0)
    setBestStreak(0)
    setFeedback(null)
    setMistakes([])
    setLocked(false)
    setPhase('play')
  }

  const nextQuestion = (remaining: Question[]) => {
    let d = remaining
    if (d.length === 0) d = buildDeck(selected)
    setCurrent(d[0])
    setDeck(d.slice(1))
    setAnswer('')
    setLocked(false)
  }

  const check = () => {
    if (!current || locked || answer.trim() === '') return
    const correct = current.a * current.b
    if (Number(answer) === correct) {
      const newSteps = steps + 1
      const newStreak = streak + 1
      setSteps(newSteps)
      setStreak(newStreak)
      setBestStreak((b) => Math.max(b, newStreak))
      setFeedback({
        kind: 'right',
        text: newStreak >= 3 ? `${newStreak} rätt i rad! 🔥 ${PRAISE[newStreak % PRAISE.length]}` : PRAISE[Math.floor(Math.random() * PRAISE.length)],
      })
      setLocked(true)
      setTimeout(() => {
        if (newSteps >= TOTAL_STEPS) setPhase('won')
        else nextQuestion(deck)
      }, 900)
    } else {
      const newMisses = misses + 1
      setMisses(newMisses)
      setStreak(0)
      setMistakes((m) => [...m, { q: current, given: answer }])
      setFeedback({ kind: 'wrong', text: `Inte riktigt – rätt svar är ${correct}. ${hintFor(current)}` })
      setLocked(true)
      // Frågan kommer tillbaka lite senare så att man får öva på den igen
      const insertAt = Math.min(deck.length, 3)
      const reshuffled = [...deck.slice(0, insertAt), current, ...deck.slice(insertAt)]
      setTimeout(() => {
        if (newMisses >= MAX_MISSES) setPhase('caught')
        else nextQuestion(reshuffled)
      }, 2600)
    }
  }

  const pressKey = (k: string) => {
    if (locked) return
    if (k === '⌫') setAnswer((a) => a.slice(0, -1))
    else if (k === 'OK') check()
    else setAnswer((a) => (a.length < 3 ? a + k : a))
  }

  const stars = useMemo(() => (misses === 0 ? 3 : misses <= 2 ? 2 : 1), [misses])

  return (
    <div className="-m-5 min-h-[calc(100vh-48px)] bg-gradient-to-b from-[#0f3d2e] via-[#1b5e3a] to-[#2f7d32] px-4 py-6 text-amber-50">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 text-center">
          <div className="text-4xl" aria-hidden>🌿🐻🐆🐍🐘🌿</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-amber-200 sm:text-4xl">Djungelmatte</h1>
          <p className="mt-1 text-emerald-100">Hjälp Mowgli genom djungeln till människobyn – med multiplikation!</p>
        </header>

        {phase === 'start' && (
          <section className="rounded-3xl bg-[#123826]/80 p-6 shadow-xl ring-1 ring-emerald-400/30">
            <h2 className="text-xl font-semibold text-amber-200">Välj vilka tabeller du vill öva</h2>
            <p className="mt-1 text-sm text-emerald-100">
              Svara rätt {TOTAL_STEPS} gånger för att nå byn. Men se upp – vid {MAX_MISSES} fel hinner Shere Khan ikapp!
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {TABLES.map((t) => {
                const on = selected.includes(t)
                return (
                  <button
                    key={t}
                    onClick={() => toggleTable(t)}
                    aria-pressed={on}
                    className={`rounded-2xl py-3 text-lg font-bold transition ${
                      on ? 'bg-amber-400 text-[#2b1d0e] shadow-lg' : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800'
                    }`}
                  >
                    {t}:an
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <button className="rounded-full bg-emerald-800 px-3 py-1 hover:bg-emerald-700" onClick={() => setSelected(TABLES)}>
                Alla
              </button>
              <button className="rounded-full bg-emerald-800 px-3 py-1 hover:bg-emerald-700" onClick={() => setSelected([])}>
                Inga
              </button>
              <button className="rounded-full bg-emerald-800 px-3 py-1 hover:bg-emerald-700" onClick={() => setShowTable((s) => !s)}>
                {showTable ? 'Göm' : 'Visa'} Kaas tabell 🐍
              </button>
            </div>
            <button
              onClick={start}
              disabled={selected.length === 0}
              className="mt-6 w-full rounded-2xl bg-amber-500 py-4 text-xl font-bold text-[#2b1d0e] shadow-lg transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ge dig ut i djungeln! 🧒🌴
            </button>
            {showTable && <TimesTable highlight={selected} />}
          </section>
        )}

        {phase === 'play' && current && (
          <section>
            <JunglePath steps={steps} misses={misses} />

            <div className="mt-4 flex items-center justify-between text-sm text-emerald-100">
              <span>🏡 {steps}/{TOTAL_STEPS} steg</span>
              <span>{streak >= 2 ? `🔥 ${streak} i rad` : ''}</span>
              <span>🐅 {misses}/{MAX_MISSES}</span>
            </div>

            <div className="mt-4 rounded-3xl bg-[#f4e7c5] p-6 text-center text-[#2b1d0e] shadow-2xl ring-4 ring-[#8b5a2b]">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#8b5a2b]">Baloo frågar</p>
              <p className="mt-2 text-5xl font-extrabold sm:text-6xl">
                {current.a} × {current.b} = <span className="inline-block min-w-[2ch] border-b-4 border-[#8b5a2b]">{answer || '?'}</span>
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  check()
                }}
                className="mt-4"
              >
                <input
                  ref={inputRef}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label="Ditt svar"
                  value={answer}
                  disabled={locked}
                  onChange={(e) => setAnswer(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  className="sr-only"
                />
              </form>
              <div className="mx-auto mt-2 grid max-w-xs grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => (
                  <button
                    key={k}
                    onClick={() => pressKey(k)}
                    disabled={locked}
                    className={`rounded-xl py-3 text-2xl font-bold shadow transition active:scale-95 disabled:opacity-50 ${
                      k === 'OK'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : k === '⌫'
                        ? 'bg-[#c9a66b] hover:bg-[#d8b77c]'
                        : 'bg-[#8b5a2b] text-amber-50 hover:bg-[#9c6a38]'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div aria-live="polite" className="mt-4 min-h-[4rem]">
              {feedback && (
                <div
                  className={`rounded-2xl p-4 text-lg font-medium ${
                    feedback.kind === 'right' ? 'bg-emerald-500/90 text-white' : 'bg-orange-200 text-[#5a2a00]'
                  }`}
                >
                  {feedback.kind === 'right' ? '🐻 ' : '🐆 '}
                  {feedback.text}
                </div>
              )}
            </div>

            <button onClick={() => setPhase('start')} className="mt-2 text-sm text-emerald-200 underline hover:text-white">
              Avsluta och välj nya tabeller
            </button>
          </section>
        )}

        {(phase === 'won' || phase === 'caught') && (
          <section className="rounded-3xl bg-[#f4e7c5] p-6 text-center text-[#2b1d0e] shadow-2xl ring-4 ring-[#8b5a2b]">
            {phase === 'won' ? (
              <>
                <div className="text-6xl">🏡🧒🎉</div>
                <h2 className="mt-3 text-3xl font-bold">Du kom fram till människobyn!</h2>
                <p className="mt-2 text-xl">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</p>
                <p className="mt-2">Baloo och Bagheera är jättestolta över dig.</p>
              </>
            ) : (
              <>
                <div className="text-6xl">🐅💨🧒</div>
                <h2 className="mt-3 text-3xl font-bold">Oj! Shere Khan hann ikapp…</h2>
                <p className="mt-2">…men Baloo jagade bort honom! Öva lite till så klarar du det nästa gång.</p>
              </>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <Stat label="Rätt" value={steps} />
              <Stat label="Fel" value={misses} />
              <Stat label="Längsta svit" value={bestStreak} />
            </div>
            {mistakes.length > 0 && (
              <div className="mt-5 text-left">
                <h3 className="font-semibold">Bagheeras repetitionslista:</h3>
                <ul className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {mistakes.map((m, i) => (
                    <li key={i} className="rounded-lg bg-white/60 px-2 py-1">
                      {m.q.a} × {m.q.b} = <b>{m.q.a * m.q.b}</b>{' '}
                      <span className="text-xs text-[#8b5a2b]">(du: {m.given})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button onClick={start} className="flex-1 rounded-2xl bg-amber-500 py-3 text-lg font-bold shadow hover:bg-amber-400">
                Spela igen
              </button>
              <button
                onClick={() => setPhase('start')}
                className="flex-1 rounded-2xl bg-emerald-700 py-3 text-lg font-bold text-white shadow hover:bg-emerald-600"
              >
                Välj andra tabeller
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function JunglePath({ steps, misses }: { steps: number; misses: number }) {
  // Stigen går från 15 % (Mowglis start) till 100 % (byn); Shere Khan lurar vid 0 %
  const pos = (n: number) => 15 + (85 * n) / TOTAL_STEPS
  const mowgliPct = pos(steps)
  // För varje fel smyger Shere Khan närmare Mowgli
  const khanPct = Math.max(0, (mowgliPct - 8) * Math.min(1, misses / MAX_MISSES))

  return (
    <div className="relative h-28 overflow-hidden rounded-3xl bg-gradient-to-b from-[#1e6b3c] to-[#14492a] ring-1 ring-emerald-400/30">
      <div className="absolute inset-x-0 top-1 flex justify-around text-2xl opacity-70" aria-hidden>
        <span>🌴</span><span>🌿</span><span>🌳</span><span>🍃</span><span>🌴</span><span>🌳</span><span>🌿</span>
      </div>
      <div className="absolute inset-x-6 bottom-6 h-3 rounded-full bg-[#8b5a2b]/80" />
      {Array.from({ length: TOTAL_STEPS + 1 }).map((_, i) => (
        <div
          key={i}
          className={`absolute bottom-[1.4rem] h-2 w-2 -translate-x-1/2 rounded-full ${i <= steps ? 'bg-amber-300' : 'bg-[#5a3a1a]'}`}
          style={{ left: `calc(1.5rem + (100% - 3rem) * ${pos(i) / 100})` }}
        />
      ))}
      <div className="absolute bottom-7 right-2 text-3xl" title="Människobyn">🏡</div>
      <div
        className="absolute bottom-7 -translate-x-1/2 text-3xl transition-all duration-700"
        style={{ left: `calc(1.5rem + (100% - 3rem) * ${mowgliPct / 100})` }}
        title="Mowgli"
      >
        🧒
      </div>
      <div
        className="absolute bottom-7 -translate-x-1/2 text-3xl transition-all duration-700"
        style={{ left: `calc(1.5rem + (100% - 3rem) * ${khanPct / 100})` }}
        title="Shere Khan"
      >
        🐅
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/60 p-2">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-[#8b5a2b]">{label}</div>
    </div>
  )
}

function TimesTable({ highlight }: { highlight: number[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-center text-sm">
        <thead>
          <tr>
            <th className="p-1 text-amber-200">×</th>
            {TABLES.map((n) => (
              <th key={n} className="p-1 text-amber-200">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TABLES.map((r) => (
            <tr key={r}>
              <th className="p-1 text-amber-200">{r}</th>
              {TABLES.map((c) => (
                <td
                  key={c}
                  className={`border border-emerald-900/60 p-1 ${
                    highlight.includes(r) ? 'bg-amber-300/90 font-semibold text-[#2b1d0e]' : 'bg-emerald-950/40'
                  }`}
                >
                  {r * c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
