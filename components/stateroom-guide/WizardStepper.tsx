const STEPS = ['Ship', 'Budget', 'Party', 'Preferences', 'Results'];

interface WizardStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  return (
    <>
      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center justify-center gap-0 mb-8">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const isFuture = stepNum > currentStep;

          return (
            <div key={label} className="flex items-center">
              {/* Step circle */}
              <button
                type="button"
                onClick={() => isCompleted ? onStepClick(stepNum) : undefined}
                disabled={isFuture}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-disney-blue dark:bg-disney-gold text-white dark:text-slate-900'
                    : isCompleted
                      ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-default'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </button>
              <span className={`text-xs font-medium mx-2 ${
                isActive
                  ? 'text-disney-blue dark:text-disney-gold'
                  : isCompleted
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-slate-400 dark:text-slate-500'
              }`}>
                {label}
              </span>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  stepNum < currentStep
                    ? 'bg-green-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile compact stepper */}
      <div className="sm:hidden flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Step {currentStep} of {STEPS.length}
        </span>
        <span className="text-sm font-bold text-disney-blue dark:text-disney-gold">
          {STEPS[currentStep - 1]}
        </span>
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i + 1 <= currentStep
                  ? 'bg-disney-blue dark:bg-disney-gold'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
