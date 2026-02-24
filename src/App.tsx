import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calculator, GraduationCap, BookOpen, TrendingUp, Info, Check, Lock, Github } from 'lucide-react';
import { Exam, Stats } from './types';

const calculateStats = (examList: Exam[]): Stats => {
  if (examList.length === 0) {
    return { 
      weightedAverage: 0, 
      standardWeightedAverage: 0,
      arithmeticAverage: 0, 
      graduationBase: 0, 
      totalCFU: 0, 
      lodeBonus: 0, 
      initialBase: 0,
      isLodeEligible: false,
      isMenzioneEligible: false
    };
  }

  const gradableExams = examList.filter(e => !e.isConvalida);
  
  let lowestGrade = 31;
  let lowestExamIndex = -1;
  
  gradableExams.forEach((e, index) => {
    if (e.grade < lowestGrade) {
      lowestGrade = e.grade;
      lowestExamIndex = index;
    } else if (e.grade === lowestGrade) {
      if (lowestExamIndex === -1 || e.cfu > gradableExams[lowestExamIndex].cfu) {
        lowestExamIndex = index;
      }
    }
  });

  let totalWeightedUnipa = 0;
  let totalCfuUnipa = 0;
  let totalWeightedStandard = 0;
  let totalCfuStandard = 0;
  let totalArithmetic = 0;
  let lodeCount = 0;

  gradableExams.forEach((e, index) => {
    if (e.is_lode) lodeCount++;
    totalWeightedStandard += e.grade * e.cfu;
    totalCfuStandard += e.cfu;
    const effectiveCfu = index === lowestExamIndex ? Math.max(0, e.cfu - 6) : e.cfu;
    totalWeightedUnipa += e.grade * effectiveCfu;
    totalCfuUnipa += effectiveCfu;
    totalArithmetic += e.grade;
  });

  const totalCfuAll = examList.reduce((acc, e) => acc + e.cfu, 0);
  const weightedAverage = totalCfuUnipa > 0 ? totalWeightedUnipa / totalCfuUnipa : 0;
  const standardWeightedAverage = totalCfuStandard > 0 ? totalWeightedStandard / totalCfuStandard : 0;
  const arithmeticAverage = gradableExams.length > 0 ? totalArithmetic / gradableExams.length : 0;
  const graduationBase = (weightedAverage * 11) / 3;
  const lodeBonus = Math.min(3, lodeCount * 0.5);
  const initialBase = graduationBase + lodeBonus;

  return { 
    weightedAverage, 
    standardWeightedAverage,
    arithmeticAverage, 
    graduationBase, 
    totalCFU: totalCfuAll,
    lodeBonus,
    initialBase,
    isLodeEligible: initialBase >= 102,
    isMenzioneEligible: initialBase >= 108
  };
};

export default function App() {
  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const saved = localStorage.getItem('exams');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [isLode, setIsLode] = useState(false);
  const [cfu, setCfu] = useState('');
  const [isConvalida, setIsConvalida] = useState(false);
  const [simGrade, setSimGrade] = useState('');
  const [simCfu, setSimCfu] = useState('');
  const [simIsLode, setSimIsLode] = useState(false);
  const [isErasmus, setIsErasmus] = useState(false);
  const [isInCourse, setIsInCourse] = useState(false);
  const [thesisPoints, setThesisPoints] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('exams', JSON.stringify(exams));
    } catch (err) {
      console.error("Failed to save:", err);
    }
  }, [exams]);

  const addExam = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedName = name.trim().substring(0, 100);
    const gradeNum = isConvalida ? 0 : parseInt(grade, 10);
    const cfuNum = parseInt(cfu, 10);

    if (!sanitizedName || (isNaN(gradeNum) && !isConvalida) || isNaN(cfuNum)) return;
    if (!isConvalida && (gradeNum < 18 || gradeNum > 30)) return;
    if (cfuNum < 1 || cfuNum > 50) return;

    setExams(prev => [...prev, {
      id: crypto.randomUUID(),
      name: sanitizedName,
      grade: gradeNum,
      is_lode: !isConvalida && isLode && gradeNum === 30,
      cfu: cfuNum,
      isConvalida
    }]);
    
    setName('');
    setGrade('');
    setCfu('');
    setIsLode(false);
    setIsConvalida(false);
  };

  const deleteExam = (id: number | string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const stats = useMemo(() => calculateStats(exams), [exams]);

  const finalScore = useMemo(() => {
    const extra = (isErasmus ? 1 : 0) + (isInCourse ? 2 : 0);
    return Math.round(stats.initialBase + thesisPoints + extra);
  }, [stats.initialBase, thesisPoints, isErasmus, isInCourse]);

  const simulatedStats = useMemo(() => {
    const g = parseInt(simGrade, 10);
    const c = parseInt(simCfu, 10);
    if (isNaN(g) || isNaN(c)) return null;
    return calculateStats([...exams, { name: 'Sim', grade: g, cfu: c, is_lode: simIsLode && g === 30, isConvalida: false }]);
  }, [exams, simGrade, simCfu, simIsLode]);

  return (
    <div className="min-h-screen pb-12 bg-neutral-50 text-neutral-900">
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight leading-tight">Media Universitaria</h1>
              <span className="text-indigo-600 font-semibold text-sm">LM-32 Ingegneria Informatica</span>
            </div>
          </div>
          <a href="https://github.com/kalos98/calcolatore-media-lm32-unipa" target="_blank" rel="noreferrer" className="p-2 text-neutral-400 hover:text-neutral-900 transition-all">
            <Github className="w-6 h-6" />
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="m3-card-indigo">
              <div className="flex items-center justify-end gap-2 mb-4">
                <Calculator className="w-5 h-5 opacity-80" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Media LM-32</span>
              </div>
              <div className="text-4xl font-bold">{stats.weightedAverage.toFixed(2)}</div>
              <div className="mt-1 text-xs opacity-90 font-medium">{stats.lodeBonus > 0 ? `+${stats.lodeBonus} punti lodi` : 'Nessun bonus lode'}</div>
            </div>

            <div className="m3-card-white">
              <div className="flex items-center justify-end gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Media Standard</span>
              </div>
              <div className="text-4xl font-bold">{stats.standardWeightedAverage.toFixed(2)}</div>
              <div className="mt-1 text-xs text-neutral-500">Senza sconto 6 CFU</div>
            </div>

            <div className="m3-card-white">
              <div className="flex items-center justify-end gap-2 mb-4">
                <Info className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Merito</span>
              </div>
              <div className="space-y-2">
                <div className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold ${stats.isLodeEligible ? 'bg-green-50 border-green-100 text-green-700' : 'bg-neutral-50 border-neutral-100 text-neutral-400'}`}>
                  <span>LODE</span>
                  {stats.isLodeEligible ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold ${stats.isMenzioneEligible ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-neutral-50 border-neutral-100 text-neutral-400'}`}>
                  <span>MENZIONE</span>
                  {stats.isMenzioneEligible ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </div>

          <section className="m3-card-white">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-600" />Simulazione Finale</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2"><label className="text-sm font-semibold">Punti Tesi (0-11)</label><span className="text-indigo-600 font-bold">{thesisPoints}</span></div>
                  <input type="range" min="0" max="11" step="0.5" value={thesisPoints} onChange={e => setThesisPoints(parseFloat(e.target.value))} className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 transition-colors">
                    <input type="checkbox" checked={isErasmus} onChange={e => setIsErasmus(e.target.checked)} className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500" />
                    <div className="text-sm font-bold">Bonus Erasmus (+1)</div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 transition-colors">
                    <input type="checkbox" checked={isInCourse} onChange={e => setIsInCourse(e.target.checked)} className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500" />
                    <div className="text-sm font-bold">In Corso (+2)</div>
                  </label>
                </div>
              </div>
              <div className="bg-indigo-50 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
                <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2">Voto Previsto</div>
                <div className="text-6xl font-black text-indigo-600">{finalScore}</div>
                <div className="text-indigo-400 text-sm mt-2">/ 110</div>
                {finalScore >= 110 && stats.isLodeEligible && <div className="mt-4 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse">CON LODE</div>}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">I tuoi Esami <span className="bg-neutral-200 text-neutral-600 text-xs px-2 py-0.5 rounded-full">{exams.length}</span></h2>
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="relative w-8 h-8">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-neutral-100" />
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(stats.totalCFU / 120, 1))} className="text-indigo-600 transition-all duration-500" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-indigo-600">{Math.round(Math.min(stats.totalCFU / 120, 1) * 100)}%</div>
                </div>
                <div className="text-xs font-bold text-neutral-500"><span className="text-indigo-600">{stats.totalCFU}</span> / 120 CFU</div>
              </div>
            </div>
            <div className="space-y-3">
              {exams.length === 0 ? (
                <div className="m3-card-white text-center py-12 border-dashed border-2 bg-transparent text-neutral-400">Nessun esame inserito.</div>
              ) : exams.map(exam => (
                <div key={exam.id} className="m3-card-white py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center font-bold border ${exam.isConvalida ? 'bg-neutral-100 text-neutral-400 border-neutral-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                      {exam.isConvalida ? 'C' : `${exam.grade}${exam.is_lode ? 'L' : ''}`}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-neutral-800 truncate">{exam.name}</h3>
                      <p className="text-sm text-neutral-500">{exam.cfu} CFU {exam.isConvalida && '• Convalida'}</p>
                    </div>
                  </div>
                  <button onClick={() => exam.id && deleteExam(exam.id)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="m3-card-white">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-600" />Nuovo Esame</h2>
            <form onSubmit={addExam} className="space-y-4">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome Esame" className="m3-input" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" min="18" max="30" value={grade} onChange={e => setGrade(e.target.value)} placeholder="Voto" className="m3-input disabled:opacity-50" required={!isConvalida} disabled={isConvalida} />
                <input type="number" min="1" value={cfu} onChange={e => setCfu(e.target.value)} placeholder="CFU" className="m3-input" required />
              </div>
              <div className="space-y-2 py-2">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 cursor-pointer">
                  <input type="checkbox" checked={isConvalida} onChange={e => { setIsConvalida(e.target.checked); if (e.target.checked) { setGrade(''); setIsLode(false); } }} className="w-5 h-5 rounded border-neutral-300 text-indigo-600" />
                  Convalida
                </label>
                <label className={`flex items-center gap-2 text-sm font-medium text-neutral-600 cursor-pointer ${grade !== '30' || isConvalida ? 'opacity-30' : ''}`}>
                  <input type="checkbox" checked={isLode} onChange={e => setIsLode(e.target.checked)} disabled={grade !== '30' || isConvalida} className="w-5 h-5 rounded border-neutral-300 text-indigo-600" />
                  30 e Lode
                </label>
              </div>
              <button type="submit" className="m3-button-primary w-full flex items-center justify-center gap-2"><Plus className="w-5 h-5" />Aggiungi</button>
            </form>
          </div>

          <div className="m3-card bg-neutral-900 text-white border-none">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-400" />Simula Prossimo</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="number" min="18" max="30" value={simGrade} onChange={e => setSimGrade(e.target.value)} placeholder="Voto" className="w-full bg-neutral-800 rounded-xl px-4 py-3 outline-none" />
                <input type="number" min="1" value={simCfu} onChange={e => setSimCfu(e.target.value)} placeholder="CFU" className="w-full bg-neutral-800 rounded-xl px-4 py-3 outline-none" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-400 cursor-pointer">
                <input type="checkbox" checked={simIsLode} onChange={e => setSimIsLode(e.target.checked)} disabled={simGrade !== '30'} className="w-5 h-5 rounded border-neutral-700 bg-neutral-800 text-indigo-500" />
                30 e Lode
              </label>
              {simulatedStats && (
                <div className="pt-4 border-t border-neutral-800 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-neutral-400">Media LM-32:</span><span className="font-bold text-indigo-400">{simulatedStats.weightedAverage.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-400">Media Std:</span><span className="font-bold">{simulatedStats.standardWeightedAverage.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-400">Nuova Base:</span><span className="font-bold text-indigo-400">{simulatedStats.graduationBase.toFixed(2)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 pt-8 pb-12">
        <div className="bg-white rounded-3xl p-6 border border-neutral-100 text-xs text-neutral-500 space-y-4">
          <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2"><Info className="w-4 h-4 text-indigo-600" />Regolamento LM-32</h3>
          <ul className="space-y-2">
            <li>• <strong>Sconto 6 CFU:</strong> Esclusione del voto più basso (max 6 CFU).</li>
            <li>• <strong>Bonus Lodi:</strong> 0.5 punti per lode (max 3 punti).</li>
            <li>• <strong>Arrotondamento:</strong> All'intero più vicino.</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
