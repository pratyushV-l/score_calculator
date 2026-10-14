import React, { useMemo, useState } from 'react';

const WEIGHTS = {
  coursework: 10,
  classTests: 20,
  cyclicTest: 20,
  midTerm: 50,
};

const createAssessment = () => ({ obtained: '', total: '' });

function percentage(obtained, total) {
  const score = Number(obtained);
  const maximum = Number(total);

  if (
    !Number.isFinite(score) ||
    !Number.isFinite(maximum) ||
    maximum <= 0 ||
    score < 0 ||
    score > maximum
  ) {
    return null;
  }

  return (score / maximum) * 100;
}

function averageAssessments(assessments) {
  const percentages = assessments.map(({ obtained, total }) => {
    if (obtained === '' && total === '') {
      return null;
    }
    return percentage(obtained, total);
  });

  if (
    percentages.some(
      (score, index) =>
        score === null &&
        (assessments[index].obtained !== '' || assessments[index].total !== ''),
    )
  ) {
    return null;
  }

  const completedPercentages = percentages.filter((score) => score !== null);

  if (completedPercentages.length === 0) {
    return null;
  }

  return completedPercentages.reduce((sum, score) => sum + score, 0) / completedPercentages.length;
}

function assessmentError(assessment) {
  const { obtained, total } = assessment;
  if (obtained === '' && total === '') {
    return '';
  }
  if (obtained === '' || total === '') {
    return 'Enter both marks.';
  }
  if (Number(total) <= 0) {
    return 'Total marks must be greater than 0.';
  }
  if (Number(obtained) < 0) {
    return 'Marks cannot be negative.';
  }
  if (Number(obtained) > Number(total)) {
    return 'Obtained marks cannot exceed the total.';
  }
  return '';
}

function requiredScore(target, scores, category) {
  const otherEntries = Object.entries(scores).filter(
    ([currentCategory, score]) => currentCategory !== category && score !== null,
  );
  const otherWeight = otherEntries.reduce(
    (sum, [currentCategory]) => sum + WEIGHTS[currentCategory],
    0,
  );
  const otherWeightedScore = otherEntries.reduce(
    (sum, [currentCategory, score]) =>
      sum + score * WEIGHTS[currentCategory],
    0,
  );

  return (target * (otherWeight + WEIGHTS[category]) - otherWeightedScore) / WEIGHTS[category];
}

function AssessmentInputs({ assessments, label, onChange, onAdd, onRemove }) {
  const itemLabel = label === 'Class tests' ? 'Class test' : 'Coursework';

  return (
    <section className="assessment-section">
      <div className="section-heading">
        <div>
          <h2>{label}</h2>
          <p>Enter the marks obtained and the total marks for each.</p>
        </div>
        <button className="button button-small" type="button" onClick={onAdd}>
          + Add
        </button>
      </div>

      <div className="assessment-list">
        {assessments.map((assessment, index) => (
          <div className="assessment-row" key={index}>
            <span className="row-label">
              {itemLabel} {index + 1}
            </span>
            <label>
              <span>Obtained</span>
              <input
                min="0"
                inputMode="decimal"
                type="number"
                value={assessment.obtained}
                onChange={(event) => onChange(index, 'obtained', event.target.value)}
                placeholder="0"
              />
            </label>
            <span className="slash">/</span>
            <label>
              <span>Total</span>
              <input
                min="0"
                inputMode="decimal"
                type="number"
                value={assessment.total}
                onChange={(event) => onChange(index, 'total', event.target.value)}
                placeholder="0"
              />
            </label>
            {assessments.length > 1 && (
              <button
                className="remove-button"
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${itemLabel} ${index + 1}`}
              >
                ×
              </button>
            )}
            {assessmentError(assessment) && (
              <p className="input-error">{assessmentError(assessment)}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SingleAssessment({ label, assessment, onChange }) {
  return (
    <section className="assessment-section">
      <div className="section-heading">
        <div>
          <h2>{label}</h2>
          <p>Enter the marks obtained and the total marks.</p>
        </div>
      </div>
      <div className="assessment-row single-row">
        <label>
          <span>Obtained</span>
          <input
            min="0"
            inputMode="decimal"
            type="number"
            value={assessment.obtained}
            onChange={(event) => onChange('obtained', event.target.value)}
            placeholder="0"
          />
        </label>
        <span className="slash">/</span>
        <label>
          <span>Total</span>
          <input
            min="0"
            inputMode="decimal"
            type="number"
            value={assessment.total}
            onChange={(event) => onChange('total', event.target.value)}
            placeholder="0"
          />
        </label>
      </div>
      {assessmentError(assessment) && <p className="input-error">{assessmentError(assessment)}</p>}
    </section>
  );
}

function App() {
  const [coursework, setCoursework] = useState([createAssessment()]);
  const [classTests, setClassTests] = useState([createAssessment()]);
  const [cyclicTest, setCyclicTest] = useState(createAssessment());
  const [midTerm, setMidTerm] = useState(createAssessment());
  const [target, setTarget] = useState('75');
  const [targetCategory, setTargetCategory] = useState('midTerm');

  const updateList = (setter, index, field, value) => {
    setter((current) =>
      current.map((assessment, assessmentIndex) =>
        assessmentIndex === index ? { ...assessment, [field]: value } : assessment,
      ),
    );
  };

  const results = useMemo(() => {
    const scores = {
      coursework: averageAssessments(coursework),
      classTests: averageAssessments(classTests),
      cyclicTest: percentage(cyclicTest.obtained, cyclicTest.total),
      midTerm: percentage(midTerm.obtained, midTerm.total),
    };
    const completedEntries = Object.entries(scores).filter(([, score]) => score !== null);
    const completedWeight = completedEntries.reduce(
      (sum, [category]) => sum + WEIGHTS[category],
      0,
    );
    const predicted = completedWeight
      ? completedEntries.reduce(
          (sum, [category, score]) => sum + score * WEIGHTS[category],
          0,
        ) / completedWeight
      : 0;

    return { scores, predicted };
  }, [coursework, classTests, cyclicTest, midTerm]);

  const resultRows = [
    ['Coursework', results.scores.coursework, WEIGHTS.coursework],
    ['Class tests', results.scores.classTests, WEIGHTS.classTests],
    ['Cyclic test', results.scores.cyclicTest, WEIGHTS.cyclicTest],
    ['Mid term', results.scores.midTerm, WEIGHTS.midTerm],
  ];
  const requiredPercentage = requiredScore(Number(target), results.scores, targetCategory);
  const selectedAssessment =
    targetCategory === 'cyclicTest' ? cyclicTest : targetCategory === 'midTerm' ? midTerm : null;
  const selectedTotal = selectedAssessment ? Number(selectedAssessment.total) : 0;
  const requiredMarks =
    selectedTotal > 0 && requiredPercentage >= 0
      ? (requiredPercentage / 100) * selectedTotal
      : null;
  const targetNumber = Number(target);
  const targetError =
    target === ''
      ? 'Enter an overall target.'
      : !Number.isFinite(targetNumber) || targetNumber < 0 || targetNumber > 100
        ? 'Target must be between 0% and 100%.'
        : '';
  const selectedCategoryName =
    targetCategory === 'classTests'
      ? 'class-test'
      : targetCategory === 'cyclicTest'
        ? 'cyclic test'
        : targetCategory === 'midTerm'
          ? 'mid term'
          : 'coursework';

  return (
    <main className="page-shell">
      <div className="calculator">
        <header className="intro">
          <p className="eyebrow">Academic tool</p>
          <h1>Predicted grade calculator</h1>
          <p className="intro-copy">
            Add your marks below to estimate your final course grade. Coursework and class tests
            are averaged before their weight is applied.
          </p>
        </header>

        <div className="layout">
          <div className="inputs">
            <AssessmentInputs
              assessments={coursework}
              label="Coursework"
              onChange={(index, field, value) => updateList(setCoursework, index, field, value)}
              onAdd={() => setCoursework((current) => [...current, createAssessment()])}
              onRemove={(index) =>
                setCoursework((current) => current.filter((_, itemIndex) => itemIndex !== index))
              }
            />
            <AssessmentInputs
              assessments={classTests}
              label="Class tests"
              onChange={(index, field, value) => updateList(setClassTests, index, field, value)}
              onAdd={() => setClassTests((current) => [...current, createAssessment()])}
              onRemove={(index) =>
                setClassTests((current) => current.filter((_, itemIndex) => itemIndex !== index))
              }
            />
            <SingleAssessment
              label="Cyclic test"
              assessment={cyclicTest}
              onChange={(field, value) => setCyclicTest((current) => ({ ...current, [field]: value }))}
            />
            <SingleAssessment
              label="Mid term"
              assessment={midTerm}
              onChange={(field, value) => setMidTerm((current) => ({ ...current, [field]: value }))}
            />
          </div>

          <div className="side-column">
            <aside className="result-card">
              <p className="eyebrow">Your prediction</p>
              <p className="score-context">Completed sections only</p>
              <div className="score">
                {results.predicted.toFixed(1)}
                <span>%</span>
              </div>
              <p className="score-caption">out of 100</p>
              <div className="breakdown">
                {resultRows.map(([label, score, weight]) => (
                  <div className="breakdown-row" key={label}>
                    <span>{label}</span>
                    <strong>
                      {score === null ? '—' : `${score.toFixed(1)}%`}
                      <small>{weight}%</small>
                    </strong>
                  </div>
                ))}
              </div>
              <p className="result-note">
                Blank sections are excluded; completed sections are rescaled to 100%.
              </p>
            </aside>

            <section className="planner-card">
              <p className="eyebrow">Plan your target</p>
              <h2>What do I need?</h2>
              <p className="planner-copy">
                Select the assessment you still need to complete and enter your desired overall
                prediction.
              </p>
              <div className="planner-fields">
                <label>
                  <span>Desired overall</span>
                  <input
                    min="0"
                    max="100"
                    inputMode="decimal"
                    type="number"
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                  />
                  {targetError && <small className="input-error">{targetError}</small>}
                </label>
                <label>
                  <span>Assessment to complete</span>
                  <select
                    value={targetCategory}
                    onChange={(event) => setTargetCategory(event.target.value)}
                  >
                    <option value="coursework">Coursework (10%)</option>
                    <option value="classTests">Class tests (20%)</option>
                    <option value="cyclicTest">Cyclic test (20%)</option>
                    <option value="midTerm">Mid term (50%)</option>
                  </select>
                </label>
              </div>
              <div className="required-result">
                {targetError ? (
                  <>
                    <strong>Enter a valid target</strong>
                    <p>The required score will appear here once your target is valid.</p>
                  </>
                ) : requiredPercentage < 0 ? (
                  <>
                    <strong>Already achievable</strong>
                    <p>Your completed scores are already enough to reach this target.</p>
                  </>
                ) : requiredPercentage > 100 ? (
                  <>
                    <strong>Not possible with this assessment alone</strong>
                    <p>You would need more than 100% in the selected assessment.</p>
                  </>
                ) : (
                  <>
                    <strong>{requiredPercentage.toFixed(1)}%</strong>
                    <p>
                      required as your {selectedCategoryName} average
                      {requiredMarks !== null && ` — ${requiredMarks.toFixed(1)} / ${selectedTotal} marks`}
                    </p>
                    {(targetCategory === 'coursework' || targetCategory === 'classTests') && (
                      <p className="planner-hint">
                          This is the average required across that category, not the score for one
                          individual test.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
