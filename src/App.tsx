/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calculator, GraduationCap, BookOpen, TrendingUp, Info, Check, Lock, Github } from 'lucide-react';
import { Exam, Stats } from './types';

export default function App() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<string>('');
  const [isLode, setIsLode] = useState(false);
  const [cfu, setCfu] = useState<string>('');
  const [isConvalida, setIsConvalida] = useState(false);

  // Simulation state
  const [simGrade, setSimGrade] = useState<string>('');
  const [simCfu, setSimCfu] = useState<string>('');
  const [simIsLode, setSimIsLode] = useState(false);

  // Extra points state
  const [isErasmus, setIsErasmus] = useState(false);
  const [isInCourse, setIsInCourse] = useState(false);
  const [thesisPoints, setThesisPoints] = useState(0);

  useEffect(() => {
    const savedExams = localStorage.getItem('exams');
    if (savedExams) {
      try {
        setExams(JSON.parse(savedExams));
      } catch (err) {
        console.error("Error parsing saved exams:", err);
      }
    }
    setLoading(false);
  }, []);

  const saveToLocalStorage = (newExams: Exam[]) => {
    localStorage.setItem('exams', JSON.stringify(newExams));
  };

  const addExam = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hardening: Input validation and sanitization
    const sanitizedName = name.trim().substring(0, 100);
    const gradeNum = isConvalida ? 0 : parseInt(grade);
    const cfuNum = parseInt(cfu);

    if (!sanitizedName || (isNaN(gradeNum) && !isConvalida) || isNaN(cfuNum)) return;
    if (!isConvalida && (gradeNum < 18 || gradeNum > 30)) return;
    if (cfuNum < 1 || cfuNum > 30) return;

    const newExam: Exam = {
      id: Date.now(),
      name: sanitizedName,
      grade: gradeNum,
      is_lode: !isConvalida && isLode && gradeNum === 30,
      cfu: cfuNum,
      isConvalida
    };

    const updatedExams = [...exams, newExam];
    setExams(updatedExams);
    saveToLocalStorage(updatedExams);
    
    setName('');
    setGrade('');
    setCfu('');
    setIsLode(false);
    setIsConvalida(false);
  };

  const deleteExam = (id: number) => {
    const updatedExams = exams.filter(e => e.id !== id);
    setExams(updatedExams);
    saveToLocalStorage(updatedExams);
  };

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

    // 1. Find the lowest grade exam to apply the 6 CFU discount
    // Important: ignore convalidated exams for average calculation
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
      
      // Standard calculation
      totalWeightedStandard += e.grade * e.cfu;
      totalCfuStandard += e.cfu;

      // LM-32 rule: exclude 6 CFU of the lowest grade
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

  const stats = useMemo(() => calculateStats(exams), [exams]);

  const finalScore = useMemo(() => {
    const extraPoints = (isErasmus ? 1 : 0) + (isInCourse ? 2 : 0);
    return Math.round(stats.initialBase + thesisPoints + extraPoints);
  }, [stats.initialBase, thesisPoints, isErasmus, isInCourse]);

  const simulatedStats = useMemo(() => {
    const gradeNum = parseInt(simGrade);
    const cfuNum = parseInt(simCfu);
    if (isNaN(gradeNum) || isNaN(cfuNum)) return null;
    
    const simExam: Exam = {
      name: 'Simulazione',
      grade: gradeNum,
      cfu: cfuNum,
      is_lode: simIsLode && gradeNum === 30
    };
    return calculateStats([...exams, simExam]);
  }, [exams, simGrade, simCfu, simIsLode]);

  return (
    <div className="min-h-screen pb-12 bg-neutral-50">
      {/* Header */}
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
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/kalos98/calcolatore-media-lm32-unipa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all"
              title="GitHub Repository"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dashboard Section */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="m3-card-indigo">
              <div className="flex items-center justify-end gap-2 mb-4">
                <Calculator className="w-5 h-5 opacity-80" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Media Ponderata (LM-32)</span>
              </div>
              <div className="text-4xl font-bold">{stats.weightedAverage.toFixed(2)}</div>
              <div className="mt-1 text-xs opacity-90 font-medium">
                {stats.lodeBonus > 0 ? `+${stats.lodeBonus} punti lodi` : 'Nessun bonus lode'}
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 text-[10px] opacity-70 italic">
                * Al netto dei bonus (Lodi, Erasmus, In Corso)
              </div>
            </div>

            <div className="m3-card-white">
              <div className="flex items-center justify-end gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Media Ponderata (Std)</span>
              </div>
              <div className="text-4xl font-bold text-neutral-800">{stats.standardWeightedAverage.toFixed(2)}</div>
              <div className="mt-1 text-xs text-neutral-500">
                Senza sconto 6 CFU
              </div>
            </div>

            <div className="m3-card-white">
              <div className="flex items-center justify-end gap-2 mb-4">
                <Info className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Requisiti Merito</span>
              </div>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-2 rounded-xl border ${stats.isLodeEligible ? 'bg-green-50 border-green-100 text-green-700' : 'bg-neutral-50 border-neutral-100 text-neutral-400'}`}>
                  <span className="text-xs font-bold">LODE</span>
                  {stats.isLodeEligible ? <Check className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-neutral-300" />}
                </div>
                <div className={`flex items-center justify-between p-2 rounded-xl border ${stats.isMenzioneEligible ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-neutral-50 border-neutral-100 text-neutral-400'}`}>
                  <span className="text-xs font-bold">MENZIONE</span>
                  {stats.isMenzioneEligible ? <Check className="w-4 h-4 text-amber-600" /> : <Lock className="w-4 h-4 text-neutral-300" />}
                </div>
              </div>
            </div>
          </div>

          {/* Thesis & Extra Points Simulation */}
          <section className="m3-card-white">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Simulazione Prova Finale
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-neutral-700">Punti Tesi (0-11)</label>
                    <span className="text-indigo-600 font-bold">{thesisPoints}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="11" 
                    step="0.5"
                    value={thesisPoints}
                    onChange={(e) => setThesisPoints(parseFloat(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                    <span>Base</span>
                    <span>Sperimentale</span>
                    <span>Eccellenza</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={isErasmus}
                      onChange={(e) => setIsErasmus(e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-bold text-neutral-800">Bonus Erasmus (+1)</div>
                      <div className="text-[10px] text-neutral-500">Min. 15 CFU o tesi all'estero</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={isInCourse}
                      onChange={(e) => setIsInCourse(e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-bold text-neutral-800">In Corso (+2)</div>
                      <div className="text-[10px] text-neutral-500">Entro sessione straordinaria 2° anno</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
                <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2">Voto di Laurea Previsto</div>
                <div className="text-6xl font-black text-indigo-600">{finalScore}</div>
                <div className="text-indigo-400 text-sm mt-2">/ 110</div>
                {finalScore >= 110 && stats.isLodeEligible && (
                  <div className="mt-4 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse">
                    CON LODE
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                I tuoi Esami
                <span className="bg-neutral-200 text-neutral-600 text-xs px-2 py-0.5 rounded-full">
                  {exams.length}
                </span>
              </h2>
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-neutral-100 shadow-sm">
                <div className="relative w-8 h-8">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="text-neutral-100"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 14}
                      strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(stats.totalCFU / 120, 1))}
                      className="text-indigo-600 transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-indigo-600">
                    {Math.round(Math.min(stats.totalCFU / 120, 1) * 100)}%
                  </div>
                </div>
                <div className="text-xs font-bold text-neutral-500">
                  <span className="text-indigo-600">{stats.totalCFU}</span> / 120 CFU
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : exams.length === 0 ? (
              <div className="m3-card-white text-center py-12 border-dashed border-2 bg-transparent">
                <p className="text-neutral-400">Nessun esame inserito. Inizia aggiungendone uno!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="m3-card-white py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-12 h-12 flex-shrink-0 ${exam.isConvalida ? 'bg-neutral-100 text-neutral-400' : 'bg-indigo-50 text-indigo-600'} rounded-2xl flex items-center justify-center font-bold border ${exam.isConvalida ? 'border-neutral-200' : 'border-indigo-100'}`}>
                        {exam.isConvalida ? 'C' : `${exam.grade}${exam.is_lode ? 'L' : ''}`}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-neutral-800 truncate">{exam.name}</h3>
                        <p className="text-sm text-neutral-500">{exam.cfu} CFU {exam.isConvalida && '• Convalida'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => exam.id && deleteExam(exam.id)}
                      className="p-2 flex-shrink-0 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          
          {/* Add Exam Form */}
          <div className="m3-card-white">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Nuovo Esame
            </h2>
            <form onSubmit={addExam} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase mb-1 block">Nome Esame</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. Analisi Matematica"
                  className="m3-input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase mb-1 block">Voto</label>
                  <input 
                    type="number" 
                    min="18" 
                    max="30"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="18-30"
                    className="m3-input disabled:opacity-50 disabled:bg-neutral-50"
                    required={!isConvalida}
                    disabled={isConvalida}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase mb-1 block">CFU</label>
                  <input 
                    type="number" 
                    min="1"
                    value={cfu}
                    onChange={(e) => setCfu(e.target.value)}
                    placeholder="CFU"
                    className="m3-input"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 py-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="convalida"
                    checked={isConvalida}
                    onChange={(e) => {
                      setIsConvalida(e.target.checked);
                      if (e.target.checked) {
                        setGrade('');
                        setIsLode(false);
                      }
                    }}
                    className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="convalida" className="text-sm font-medium text-neutral-600">Materia a convalida</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="lode"
                    checked={isLode}
                    onChange={(e) => setIsLode(e.target.checked)}
                    disabled={grade !== '30' || isConvalida}
                    className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-30"
                  />
                  <label htmlFor="lode" className="text-sm font-medium text-neutral-600 disabled:opacity-30">30 e Lode</label>
                </div>
              </div>
              <button type="submit" className="m3-button-primary w-full flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Aggiungi Esame
              </button>
            </form>
          </div>

          {/* Simulation Section */}
          <div className="m3-card bg-neutral-900 text-white border-none">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Simula prossimo esame
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Voto Ipotetico</label>
                  <input 
                    type="number" 
                    min="18" 
                    max="30"
                    value={simGrade}
                    onChange={(e) => setSimGrade(e.target.value)}
                    placeholder="18-30"
                    className="w-full bg-neutral-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">CFU Esame</label>
                  <input 
                    type="number" 
                    min="1"
                    value={simCfu}
                    onChange={(e) => setSimCfu(e.target.value)}
                    placeholder="CFU"
                    className="w-full bg-neutral-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox" 
                  id="simLode"
                  checked={simIsLode}
                  onChange={(e) => setSimIsLode(e.target.checked)}
                  disabled={simGrade !== '30'}
                  className="w-5 h-5 rounded border-neutral-700 bg-neutral-800 text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="simLode" className="text-sm font-medium text-neutral-400">30 e Lode</label>
              </div>
              
              {simulatedStats ? (
                <div className="pt-4 border-t border-neutral-800 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Nuova Media (LM-32):</span>
                    <span className="font-bold text-indigo-400">{simulatedStats.weightedAverage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Nuova Media (Std):</span>
                    <span className="font-bold text-neutral-400">{simulatedStats.standardWeightedAverage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Nuova Base:</span>
                    <span className="font-bold text-indigo-400">{simulatedStats.graduationBase.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs text-neutral-500 bg-neutral-800/50 p-3 rounded-xl">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  Inserisci voto e CFU per vedere come cambierebbe la tua media.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer Notes */}
      <footer className="max-w-5xl mx-auto px-4 pt-8 pb-12">
        <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            Note sul Regolamento (LM-32)
          </h3>
          <ul className="space-y-3 text-xs text-neutral-500 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Sconto 6 CFU:</strong> Dal calcolo della media ponderata viene escluso il voto più basso (per un peso massimo di 6 CFU). Se l'esame ha più di 6 CFU, viene calcolato solo per la parte eccedente.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Bonus Lodi:</strong> Ogni lode aggiunge 0.5 punti alla base di laurea (110), fino a un massimo di 3 punti totali.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Arrotondamento:</strong> Il voto finale viene arrotondato all'intero più vicino (es. 102.50 → 103, 102.49 → 102).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span><strong>Lode e Menzione:</strong> La lode è attribuibile se la base di partenza è ≥ 102/110. La menzione richiede una base ≥ 108/110 e l'unanimità della commissione.</span>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
