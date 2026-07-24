import Icon from "./Icon";


/*
 * หน้าแรก (Landing) — เฉพาะส่วนแนะนำแอป
 * ตั้งแต่หัวข้อ "Object Detection" จนถึงข้อความ
 * disclaimer แล้วปิดท้ายด้วยปุ่ม Get Started
 * (ไม่มี Step 1/2/3 ที่นี่ — อยู่หน้า workspace)
 */
function LandingPage({ onGetStarted }) {
  return (
    <header className="app-header landing-header">
      <div
        className="header-orb header-orb--one"
        aria-hidden="true"
      />

      <div
        className="header-orb header-orb--two"
        aria-hidden="true"
      />

      <div className="header-inner">
        <div className="hero-content" id="top">
          <h1>
            Object <span>Detection</span>
          </h1>

          <p className="header-description">
            Upload an image, choose an RT-DETR model,
            and turn every detection into a clear,
            visual result in just a few steps.
          </p>

          <div className="hero-highlights">
            <span>
              <Icon name="check" size={16} />
              Fast predictions
            </span>

            <span>
              <Icon name="check" size={16} />
              Visual results
            </span>

            <span>
              <Icon name="check" size={16} />
              Local history
            </span>
          </div>

          <div
            className="hero-workflow-card"
            aria-label="Prediction workflow"
          >
            <div className="hero-workflow-flow">
              <strong className="hero-workflow-stage">
                Choose a Model
              </strong>

              <span className="hero-workflow-arrow">
                <Icon name="arrow" size={18} />
              </span>

              <strong className="hero-workflow-stage">
                Set the Threshold
              </strong>

              <span className="hero-workflow-arrow">
                <Icon name="arrow" size={18} />
              </span>

              <strong className="hero-workflow-stage">
                Review detection
              </strong>
            </div>

            <div className="hero-workflow-note">
              <span>
                <Icon name="info" size={16} />
              </span>

              <p>
                Detection quality depends on the selected model,
                confidence threshold, image quality and training data.
                Always review important results before relying on them.
              </p>
            </div>
          </div>

          <div className="landing-cta">
            <button
              type="button"
              className="get-started-button"
              onClick={onGetStarted}
            >
              Get Started
              <Icon name="arrow" size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}


export default LandingPage;
