function HowItWorks() {
  const steps = [
    {
      title: 'Learn',
      text: 'Browse members who offer real skills and find the right person to help you.',
    },
    {
      title: 'Teach',
      text: 'Offer your own skills, build credibility, and grow your reputation in the community.',
    },
    {
      title: 'Earn',
      text: 'Gain credits through completed sessions and use them to learn new skills in return.',
    },
  ]

  return (
    <section className="how-it-works" id="how">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Learn • Teach • Earn</h2>
          <p>
            Maharati makes skill exchange simple, structured, and protected.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.title} className="step-card">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks