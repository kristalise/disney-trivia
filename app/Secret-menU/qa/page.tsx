'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import faqData from '@/data/faq-data.json';

const TOPICS = faqData.topics.map(t => ({ key: t.topic, label: t.topic.charAt(0).toUpperCase() + t.topic.slice(1).replace('-', ' '), emoji: t.emoji }));

interface CommunityQuestion {
  id: string;
  user_id: string;
  question_text: string;
  topic: string;
  upvotes: number;
  is_answered: boolean;
  created_at: string;
  reviewer_name?: string;
  reviewer_handle?: string | null;
  answer_count?: number;
  answers?: CommunityAnswer[];
}

interface CommunityAnswer {
  id: string;
  user_id: string;
  answer_text: string;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
  reviewer_name?: string;
  reviewer_handle?: string | null;
}

export default function QAPage() {
  const { user, session } = useAuth();
  const [activeTopic, setActiveTopic] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<Set<string>>(new Set());
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<'popular' | 'recent'>('popular');

  // Form
  const [formQuestion, setFormQuestion] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // Answer form
  const [answerText, setAnswerText] = useState('');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (activeTopic !== 'all') params.set('topic', activeTopic);
      const res = await fetch(`/api/community-qa?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch { /* supplemental */ } finally { setLoading(false); }
  }, [activeTopic, sort]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const curatedFaqs = useMemo(() => {
    if (activeTopic === 'all') return faqData.topics;
    return faqData.topics.filter(t => t.topic === activeTopic);
  }, [activeTopic]);

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchAnswers = async (questionId: string) => {
    if (expandedQuestion === questionId) { setExpandedQuestion(null); return; }
    setExpandedQuestion(questionId);
    try {
      const res = await fetch(`/api/community-qa/${questionId}/answers`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(prev => prev.map(q =>
          q.id === questionId ? { ...q, answers: data.answers } : q
        ));
      }
    } catch { /* supplemental */ }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg('');
    if (!formQuestion || !formTopic) { setSubmitMsg('Please fill in all fields.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/community-qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ question_text: formQuestion, topic: formTopic }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitMsg(data.error || 'Failed to submit.'); return; }
      setSubmitMsg('Question submitted!');
      setFormQuestion(''); setFormTopic('');
      fetchQuestions();
    } catch { setSubmitMsg('Failed to submit.'); } finally { setSubmitting(false); }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    setAnswerSubmitting(true);
    try {
      const res = await fetch(`/api/community-qa/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ answer_text: answerText }),
      });
      if (res.ok) {
        setAnswerText('');
        setAnsweringId(null);
        fetchAnswers(questionId);
        fetchQuestions();
      }
    } catch { /* supplemental */ } finally { setAnswerSubmitting(false); }
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    if (!session?.access_token) return;
    try {
      await fetch(`/api/community-qa/${questionId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ type: 'question' }),
      });
      fetchQuestions();
    } catch { /* supplemental */ }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/Secret-menU" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cruise Guide
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Disney Cruise Q&A</h1>
        <p className="text-slate-600 dark:text-slate-400">Frequently asked questions and community answers about Disney Cruise Line.</p>
      </div>

      {/* Topic Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTopic('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeTopic === 'all'
              ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
          }`}
        >
          All Topics
        </button>
        {TOPICS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTopic(t.key === activeTopic ? 'all' : t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeTopic === t.key
                ? 'bg-disney-blue text-white border-disney-blue dark:bg-disney-gold dark:text-slate-900 dark:border-disney-gold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Curated FAQ */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          Official Guide
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-disney-blue/10 text-disney-blue dark:bg-disney-gold/20 dark:text-disney-gold">Curated</span>
        </h2>
        {curatedFaqs.map(topic => (
          <div key={topic.topic} className="mb-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <span>{topic.emoji}</span> {topic.topic.charAt(0).toUpperCase() + topic.topic.slice(1).replace('-', ' ')}
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {topic.questions.map(faq => (
                <div key={faq.id}>
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-3"
                  >
                    <svg
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400 transition-transform ${expandedFaq.has(faq.id) ? 'rotate-90' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-sm text-slate-900 dark:text-white">{faq.question}</span>
                  </button>
                  {expandedFaq.has(faq.id) && (
                    <div className="px-5 pb-4 pl-12">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Community Q&A */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Community Q&A</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSort('popular')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${sort === 'popular' ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Popular
            </button>
            <button
              onClick={() => setSort('recent')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${sort === 'recent' ? 'bg-disney-blue text-white dark:bg-disney-gold dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Recent
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">Loading questions...</div>
        ) : questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleUpvoteQuestion(q.id)}
                      disabled={!user}
                      className={`flex flex-col items-center gap-0.5 flex-shrink-0 ${user ? 'hover:text-disney-blue dark:hover:text-disney-gold' : 'opacity-50'}`}
                    >
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{q.upvotes}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          {TOPICS.find(t => t.key === q.topic)?.emoji} {q.topic}
                        </span>
                        {q.is_answered && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Answered</span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{q.question_text}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                        {q.reviewer_name && (
                          <Link href={`/profile/${q.reviewer_handle || q.user_id}`} className="hover:underline">{q.reviewer_name}</Link>
                        )}
                        <span>{new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        <button onClick={() => fetchAnswers(q.id)} className="text-disney-blue dark:text-disney-gold hover:underline">
                          {q.answer_count || 0} {(q.answer_count || 0) === 1 ? 'answer' : 'answers'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Answers */}
                {expandedQuestion === q.id && (
                  <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 space-y-3">
                    {q.answers?.map(a => (
                      <div key={a.id} className="pl-8 border-l-2 border-slate-200 dark:border-slate-600">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{a.answer_text}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          {a.reviewer_name && <span>{a.reviewer_name}</span>}
                          {a.is_accepted && <span className="text-green-600 dark:text-green-400 font-bold">Accepted</span>}
                          <span>{a.upvotes} upvotes</span>
                        </div>
                      </div>
                    ))}
                    {user && (
                      answeringId === q.id ? (
                        <div className="pl-8 space-y-2">
                          <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            maxLength={2000}
                            rows={2}
                            placeholder="Write your answer..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubmitAnswer(q.id)}
                              disabled={answerSubmitting}
                              className="px-4 py-1.5 rounded-lg text-xs font-medium btn-disney disabled:opacity-50"
                            >
                              {answerSubmitting ? 'Posting...' : 'Post Answer'}
                            </button>
                            <button onClick={() => { setAnsweringId(null); setAnswerText(''); }} className="text-xs text-slate-500 hover:text-slate-700">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAnsweringId(q.id)} className="pl-8 text-xs text-disney-blue dark:text-disney-gold hover:underline">
                          Write an answer
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">No community questions yet. Be the first to ask!</p>
          </div>
        )}
      </div>

      {/* Ask a Question Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Ask a Question</h3>
        {user ? (
          <form onSubmit={handleSubmitQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Question</label>
              <textarea value={formQuestion} onChange={(e) => setFormQuestion(e.target.value)} maxLength={500} rows={2} placeholder="What would you like to know about Disney cruises?"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Topic</label>
              <select value={formTopic} onChange={(e) => setFormTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-disney-blue dark:focus:ring-disney-gold focus:border-transparent">
                <option value="">Select topic...</option>
                {TOPICS.map(t => <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>)}
              </select>
            </div>
            {submitMsg && (
              <div className={`text-sm rounded-xl px-4 py-3 ${submitMsg.includes('submitted') ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'}`}>
                {submitMsg}
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full px-6 py-3 rounded-xl font-medium btn-disney disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Submitting...' : 'Ask Question'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Sign in to ask a question.</p>
            <Link href="/auth" className="inline-block px-6 py-2.5 rounded-xl font-medium btn-disney">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
