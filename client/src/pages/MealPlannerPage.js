import React, { useState, useEffect, useRef, useCallback } from 'react';

const DAYS_BEFORE = 30;
const DAYS_AFTER = 30;

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function buildDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - DAYS_BEFORE);
    const dow = d.getDay();
    return {
      dateStr: toDateStr(d),
      display: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      isToday: i === DAYS_BEFORE,
      isWeekend: dow === 0 || dow === 6,
    };
  });
}

const pillBtn = (bg) => ({
  padding: '7px 12px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '0.85rem',
  lineHeight: 1,
  flexShrink: 0,
  WebkitTapHighlightColor: 'transparent',
});

function HistoryModal({ meal, dates, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          padding: '20px 20px 36px',
          width: '100%',
          maxHeight: '65vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{meal}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#888', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#999' }}>
          {dates.length === 1 ? 'Once' : `${dates.length}×`} on the plan
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {dates.map(d => (
            <li key={d} style={{ padding: '9px 0', borderBottom: '1px solid #f2f2f2', fontSize: '0.95rem', color: '#444' }}>
              {parseLocalDate(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DayRow({
  dateStr, display, isToday, isWeekend,
  meal, isActive,
  todayRef, inputRef,
  suggestions, inputValue,
  onActivate, onDelete, onShowHistory,
  onInputChange, onInputKeyDown, onSelectSuggestion, onCancel, onSaveNew,
}) {
  const exactMatch = suggestions.some(s => s.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div
      ref={todayRef}
      style={{
        borderBottom: '1px solid #ececec',
        borderLeft: isToday ? '4px solid #2196F3' : '4px solid transparent',
        background: isToday ? '#edf5fd' : isWeekend ? '#fafafa' : '#fff',
        padding: '9px 10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40 }}>
        <span style={{
          width: 82,
          fontSize: '0.78rem',
          color: isToday ? '#1976D2' : isWeekend ? '#888' : '#666',
          fontWeight: isToday ? '700' : '400',
          flexShrink: 0,
          lineHeight: 1.3,
        }}>
          {display}
        </span>

        {isActive ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onInputKeyDown}
            placeholder="What's for dinner?"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            style={{
              flex: 1,
              padding: '9px 11px',
              fontSize: '16px',
              border: '2px solid #2196F3',
              borderRadius: 6,
              outline: 'none',
              WebkitAppearance: 'none',
              boxSizing: 'border-box',
            }}
          />
        ) : meal ? (
          <>
            <span
              onClick={onShowHistory}
              style={{ flex: 1, fontSize: '1rem', cursor: 'pointer', padding: '5px 0', color: '#222' }}
            >
              {meal}
            </span>
            <button onClick={onActivate} style={pillBtn('#5c6bc0')} aria-label="Edit">✏</button>
            <button onClick={onDelete} style={pillBtn('#ef5350')} aria-label="Delete">✕</button>
          </>
        ) : (
          <button
            onClick={onActivate}
            style={{
              flex: 1,
              textAlign: 'left',
              background: 'none',
              border: '1px dashed #d0d0d0',
              borderRadius: 6,
              padding: '9px 11px',
              fontSize: '0.9rem',
              color: '#c0c0c0',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            + add meal
          </button>
        )}
      </div>

      {isActive && (
        <div style={{ marginLeft: 90, marginTop: 5 }}>
          {suggestions.length > 0 && (
            <ul style={{
              listStyle: 'none', margin: '0 0 7px', padding: 0,
              border: '1px solid #ddd', borderRadius: 8, background: '#fff',
              maxHeight: 210, overflowY: 'auto',
              boxShadow: '0 6px 20px rgba(0,0,0,0.13)',
            }}>
              {suggestions.map(s => (
                <li
                  key={s}
                  onPointerDown={e => { e.preventDefault(); onSelectSuggestion(s); }}
                  style={{
                    padding: '12px 14px',
                    fontSize: '1rem',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {inputValue.trim() && !exactMatch && (
              <button
                onPointerDown={e => { e.preventDefault(); onSaveNew(); }}
                style={pillBtn('#43a047')}
              >
                Add "{inputValue.trim()}"
              </button>
            )}
            <button
              onPointerDown={e => { e.preventDefault(); onCancel(); }}
              style={pillBtn('#9e9e9e')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MealPlannerPage() {
  const days = useRef(buildDays()).current;
  const [entries, setEntries] = useState({});
  const [allMeals, setAllMeals] = useState([]);
  const [activeDate, setActiveDate] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [historyModal, setHistoryModal] = useState(null);
  const todayRef = useRef(null);
  const inputRef = useRef(null);

  const applyEntries = useCallback((data) => {
    const map = {};
    const mealLatest = {};
    data.forEach(e => {
      map[e.date] = e.meal;
      if (!mealLatest[e.meal] || e.date > mealLatest[e.meal]) {
        mealLatest[e.meal] = e.date;
      }
    });
    setEntries(map);
    // Sort by most recently used
    setAllMeals(Object.keys(mealLatest).sort((a, b) => mealLatest[b].localeCompare(mealLatest[a])));
  }, []);

  useEffect(() => {
    fetch('/api/meal-plan')
      .then(r => r.json())
      .then(applyEntries)
      .catch(() => {});
  }, [applyEntries]);

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  }, []);

  const handleActivateDate = (date, currentMeal) => {
    setActiveDate(date);
    const prefill = currentMeal || '';
    setInputValue(prefill);
    if (prefill) {
      setSuggestions(allMeals.filter(m => m.toLowerCase().includes(prefill.toLowerCase())));
    } else {
      setSuggestions(allMeals);
    }
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const handleInputChange = (e) => {
    const val = e.target.value.toLowerCase();
    setInputValue(val);
    if (!val.trim()) {
      setSuggestions(allMeals);
    } else {
      setSuggestions(allMeals.filter(m => m.toLowerCase().includes(val.toLowerCase())));
    }
  };

  const save = async (date, meal) => {
    if (!meal.trim()) return;
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, meal: meal.trim() }),
      });
      const data = await res.json();
      applyEntries(data);
    } catch (e) {}
    setActiveDate(null);
  };

  const handleDelete = async (date) => {
    try {
      const res = await fetch(`/api/meal-plan/${date}`, { method: 'DELETE' });
      const data = await res.json();
      applyEntries(data);
    } catch (e) {}
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      save(activeDate, inputValue);
    } else if (e.key === 'Escape') {
      setActiveDate(null);
    }
  };

  const handleShowHistory = (meal) => {
    const dates = Object.entries(entries)
      .filter(([, m]) => m === meal)
      .map(([d]) => d)
      .sort();
    setHistoryModal({ meal, dates });
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {days.map(({ dateStr, display, isToday, isWeekend }) => (
        <DayRow
          key={dateStr}
          dateStr={dateStr}
          display={display}
          isToday={isToday}
          isWeekend={isWeekend}
          meal={entries[dateStr]}
          isActive={activeDate === dateStr}
          todayRef={isToday ? todayRef : null}
          inputRef={activeDate === dateStr ? inputRef : null}
          suggestions={activeDate === dateStr ? suggestions : []}
          inputValue={activeDate === dateStr ? inputValue : ''}
          onActivate={() => handleActivateDate(dateStr, entries[dateStr])}
          onDelete={() => handleDelete(dateStr)}
          onShowHistory={() => handleShowHistory(entries[dateStr])}
          onInputChange={handleInputChange}
          onInputKeyDown={handleInputKeyDown}
          onSelectSuggestion={(meal) => save(activeDate, meal)}
          onCancel={() => setActiveDate(null)}
          onSaveNew={() => save(activeDate, inputValue)}
        />
      ))}

      {historyModal && (
        <HistoryModal
          meal={historyModal.meal}
          dates={historyModal.dates}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}
