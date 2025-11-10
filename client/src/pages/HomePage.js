import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { currentUser, userRole } = useAuth();

  const features = [
    {
      title: "For Students",
      description: "Apply to courses from multiple institutions, track your applications in real-time, and discover job opportunities that match your qualifications. Upload documents and receive instant notifications.",
      highlights: [
        "Apply to maximum 2 courses per institution",
        "Real-time application tracking",
        "Automatic job matching",
        "Document upload system",
        "Admission selection assistance"
      ],
      link: "/student",
      color: "student"
    },
    {
      title: "For Institutions",
      description: "Manage your academic programs efficiently. Add faculties and courses, review student applications, publish admissions, and maintain your institution profile with comprehensive analytics.",
      highlights: [
        "Course and faculty management",
        "Application review system",
        "Admission publishing",
        "Student status tracking",
        "Institution analytics"
      ],
      link: "/institution",
      color: "institution"
    },
    {
      title: "For Companies",
      description: "Find the perfect candidates for your organization. Post job opportunities and receive automatically filtered applications based on academic performance, certificates, and relevant experience.",
      highlights: [
        "Smart candidate filtering",
        "Qualified applicant matching",
        "Job posting management",
        "Application review system",
        "Company profile management"
      ],
      link: "/company",
      color: "company"
    },
    {
      title: "For Administrators",
      description: "Oversee the entire platform ecosystem. Manage institutions, monitor system performance, generate comprehensive reports, and ensure smooth operations across all modules.",
      highlights: [
        "Institution management",
        "System monitoring",
        "Report generation",
        "User management",
        "Platform analytics"
      ],
      link: "/admin",
      color: "admin"
    }
  ];

  const systemFeatures = [
    {
      title: "Smart Matching System",
      description: "Students are automatically matched with courses they qualify for and jobs that fit their profile"
    },
    {
      title: "Application Limits",
      description: "Students can apply to maximum 2 courses per institution to ensure fair distribution"
    },
    {
      title: "Automatic Notifications",
      description: "Real-time updates on applications, admissions, and relevant job opportunities"
    },
    {
      title: "Document Management",
      description: "Secure upload and management of academic transcripts and certificates"
    },
    {
      title: "Admission Coordination",
      description: "Smart system prevents multiple admissions and manages waiting lists automatically"
    },
    {
      title: "Qualified Applications",
      description: "Companies receive only applications from candidates who meet their requirements"
    }
  ];

  const stats = [
    { number: "50+", label: "Partner Institutions" },
    { number: "10,000+", label: "Successful Students" },
    { number: "500+", label: "Partner Companies" },
    { number: "95%", label: "Satisfaction Rate" }
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Career Guidance & 
                <span className="highlight"> Employment Integration</span> 
                Platform
              </h1>
              <p className="hero-description">
                A comprehensive ecosystem connecting students, educational institutions, and employers. 
                Streamline applications, admissions, and career opportunities through intelligent matching 
                and automated processes.
              </p>
              <div className="hero-actions">
                {!currentUser ? (
                  <>
                    <Link to="/register" className="btn btn-primary btn-large">
                      Get Started Free
                    </Link>
                    <Link to="/login" className="btn btn-secondary btn-large">
                      Sign In
                    </Link>
                  </>
                ) : (
                  <Link to={`/${userRole}`} className="btn btn-primary btn-large">
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Platform Modules</h2>
            <p>Comprehensive solutions for every stakeholder in the education and employment ecosystem</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className={`feature-card feature-${feature.color}`}>
                <div className="feature-header">
                  <h3>{feature.title}</h3>
                </div>
                <div className="feature-body">
                  <p className="feature-description">{feature.description}</p>
                  <ul className="feature-highlights">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                </div>
                <div className="feature-footer">
                  <Link to={feature.link} className={`btn btn-${feature.color}`}>
                    Access {feature.title}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Features Section */}
      <section className="system-features-section">
        <div className="container">
          <div className="section-header">
            <h2>Intelligent System Features</h2>
            <p>Advanced automation and smart matching ensure optimal outcomes for all users</p>
          </div>
          <div className="system-features-grid">
            {systemFeatures.map((feature, index) => (
              <div key={index} className="system-feature-card">
                <div className="feature-number">{index + 1}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <h2>How The System Works</h2>
            <p>Seamless integration from application to employment</p>
          </div>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Student Registration & Profile Setup</h3>
                <p>Students create profiles, upload documents, and specify their academic interests and career goals</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>Course Application & Smart Matching</h3>
                <p>System automatically matches students with courses they qualify for, enforcing the 2-course per institution limit</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Institution Review & Admission</h3>
                <p>Institutions review applications and make admission decisions, with automatic prevention of multiple program admissions</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">04</div>
              <div className="step-content">
                <h3>Admission Selection & Enrollment</h3>
                <p>Students select one admission offer, automatically freeing spots for waiting list candidates</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">05</div>
              <div className="step-content">
                <h3>Career Preparation & Job Matching</h3>
                <p>Upon completion, students upload transcripts and receive automated job matches based on qualifications</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">06</div>
              <div className="step-content">
                <h3>Employer Connection</h3>
                <p>Companies receive pre-qualified candidates and make hiring decisions efficiently</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Education and Employment Connections?</h2>
            <p>Join thousands of students, institutions, and companies already using our platform</p>
            <div className="cta-actions">
              {!currentUser ? (
                <Link to="/register" className="btn btn-primary btn-large">
                  Create Your Account
                </Link>
              ) : (
                <Link to={`/${userRole}`} className="btn btn-primary btn-large">
                  Continue to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;