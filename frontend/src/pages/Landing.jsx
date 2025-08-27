import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const navigate = useNavigate()

  // Refs for scroll animations
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const howToUseRef = useRef(null)
  const appFeaturesRef = useRef(null)
  const ctaRef = useRef(null)

  const features = [
    {
      icon: "🎉",
      title: "Create Amazing Events",
      description: "Design and organize events that people will love to attend"
    },
    {
      icon: "👥",
      title: "Build Strong Teams",
      description: "Form teams, invite members, and collaborate seamlessly"
    },
    {
      icon: "📅",
      title: "Smart Scheduling",
      description: "Find the perfect time and manage your events effortlessly"
    },
    {
      icon: "🚀",
      title: "Join & Participate",
      description: "Discover exciting events and be part of amazing experiences"
    }
  ]

  const howToUseSteps = [
    {
      step: "01",
      title: "Sign Up & Create Profile",
      description: "Register with your email and username, create your profile with bio and social links",
      icon: "👤",
      color: "from-blue-500 to-purple-600"
    },
    {
      step: "02", 
      title: "Create Your First Event",
      description: "Design amazing events with title, description, date, location, and category",
      icon: "🎉",
      color: "from-purple-500 to-pink-600"
    },
    {
      step: "03",
      title: "Build Your Team",
      description: "Create teams and invite members via email with beautiful invitation system",
      icon: "👥",
      color: "from-green-500 to-teal-600"
    },
    {
      step: "04",
      title: "Join & Discover",
      description: "Browse events, join as individual or team, and connect with amazing people",
      icon: "🚀",
      color: "from-orange-500 to-red-600"
    }
  ]

  const appFeatures = [
    {
      icon: "🎯",
      title: "Event Management",
      features: ["Create unlimited events", "Real-time participant tracking", "Event analytics & insights", "Category-based organization"]
    },
    {
      icon: "👥",
      title: "Team Collaboration",
      features: ["Email-based invitations", "Team member management", "Role-based permissions", "Team analytics"]
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      features: ["Event performance metrics", "Participant engagement", "Team activity tracking", "Real-time statistics"]
    },
    {
      icon: "🔐",
      title: "Security & Privacy",
      features: ["JWT authentication", "Secure data encryption", "User privacy controls", "Admin management"]
    }
  ]

  useEffect(() => {
    setIsVisible(true)
    
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % howToUseSteps.length)
    }, 5000)

    // Scroll event listener
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      clearInterval(featureInterval)
      clearInterval(stepInterval)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
        }
      })
    }, observerOptions)

    // Observe all sections
    const sections = [featuresRef.current, howToUseRef.current, appFeaturesRef.current, ctaRef.current]
    sections.forEach(section => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  const handleExploreEvents = () => {
    navigate('/explore')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        ></div>
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        ></div>
        <div 
          className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"
          style={{ transform: `translateY(${scrollY * 0.05}px)` }}
        ></div>
        <div 
          className="absolute top-1/2 right-1/4 w-60 h-60 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-1000"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg md:text-xl">E</span>
          </div>
          <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Eventify
          </span>
        </div>
        <div className="flex space-x-2 md:space-x-4">
          <Link 
            to="/login" 
            className="px-3 py-2 md:px-4 md:py-2 text-gray-700 hover:text-purple-600 transition-colors duration-300 text-sm md:text-base"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 md:px-6 text-center">
        {/* Main Heading */}
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Huddle
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect, collaborate, and create amazing events together. Join the ultimate platform for team building and event management.
          </p>
        </div>

        {/* Subtitle */}
        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto px-4">
            Create unforgettable experiences, build powerful teams, and discover events that inspire. 
            Join thousands of people making memories together with our comprehensive event management platform.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 mb-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={handleExploreEvents}
            className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-base md:text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse"
          >
            🚀 Start Exploring Events
          </button>
          <Link
            to="/register"
            className="px-6 md:px-8 py-3 md:py-4 border-2 border-purple-600 text-purple-600 text-base md:text-lg font-semibold rounded-xl hover:bg-purple-600 hover:text-white transform hover:scale-105 transition-all duration-300"
          >
            Create Your First Event
          </Link>
        </div>

        {/* Features Carousel */}
        <div className={`max-w-4xl mx-auto px-4 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-white/20">
            <div className="flex items-center justify-center mb-6">
              <span className="text-3xl md:text-4xl animate-bounce">{features[currentFeature].icon}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
              {features[currentFeature].title}
            </h3>
            <p className="text-gray-600 text-base md:text-lg">
              {features[currentFeature].description}
            </p>
            
            {/* Feature Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentFeature ? 'bg-purple-600 w-6' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-16 max-w-4xl mx-auto px-4 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center transform hover:scale-105 transition-transform duration-300">
            <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">1000+</div>
            <div className="text-gray-600 text-sm md:text-base">Events Created</div>
          </div>
          <div className="text-center transform hover:scale-105 transition-transform duration-300">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600 text-sm md:text-base">Active Teams</div>
          </div>
          <div className="text-center transform hover:scale-105 transition-transform duration-300">
            <div className="text-2xl md:text-3xl font-bold text-indigo-600 mb-2">10K+</div>
            <div className="text-gray-600 text-sm md:text-base">Happy Users</div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section ref={howToUseRef} className="relative z-10 py-20 px-4 md:px-6 opacity-0 translate-y-20 transition-all duration-1000">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              How to Use Eventify
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in 4 simple steps and begin creating amazing events with your team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {howToUseSteps.map((step, index) => (
              <div
                key={index}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${
                  index === currentStep ? 'ring-2 ring-purple-500' : ''
                } opacity-0 translate-y-10`}
                style={{
                  animationDelay: `${index * 200}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mb-4`}>
                  <span className="text-white text-xl">{step.icon}</span>
                </div>
                <div className="text-sm text-purple-600 font-semibold mb-2">{step.step}</div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm md:text-base">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Features Section */}
      <section ref={appFeaturesRef} className="relative z-10 py-20 px-4 md:px-6 bg-white/50 opacity-0 translate-y-20 transition-all duration-1000">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, manage, and participate in amazing events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {appFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-white/20 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 opacity-0 translate-y-10"
                style={{
                  animationDelay: `${index * 200}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white text-xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800">{feature.title}</h3>
                </div>
                <ul className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="relative z-10 py-20 px-4 md:px-6 opacity-0 translate-y-20 transition-all duration-1000">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Join thousands of event organizers and start creating unforgettable experiences today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-purple-600 text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Get Started Free
              </Link>
              <Link
                to="/explore"
                className="px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white hover:text-purple-600 transform hover:scale-105 transition-all duration-300"
              >
                Explore Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 md:px-6 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold">Eventify</span>
              </div>
              <p className="text-gray-400">
                The ultimate platform for creating and managing amazing events with powerful team collaboration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Event Management</li>
                <li>Team Collaboration</li>
                <li>Analytics Dashboard</li>
                <li>Email Invitations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Twitter</li>
                <li>LinkedIn</li>
                <li>GitHub</li>
                <li>Blog</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Eventify. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-20 left-10 animate-float"
          style={{ transform: `translateY(${scrollY * 0.05}px)` }}
        >
          <div className="w-4 h-4 bg-purple-400 rounded-full opacity-60"></div>
        </div>
        <div 
          className="absolute top-40 right-20 animate-float animation-delay-1000"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        >
          <div className="w-6 h-6 bg-blue-400 rounded-full opacity-60"></div>
        </div>
        <div 
          className="absolute bottom-40 left-20 animate-float animation-delay-2000"
          style={{ transform: `translateY(${scrollY * 0.03}px)` }}
        >
          <div className="w-3 h-3 bg-pink-400 rounded-full opacity-60"></div>
        </div>
        <div 
          className="absolute bottom-20 right-10 animate-float animation-delay-3000"
          style={{ transform: `translateY(${scrollY * -0.03}px)` }}
        >
          <div className="w-5 h-5 bg-yellow-400 rounded-full opacity-60"></div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-in {
          animation: slideInUp 0.8s ease-out forwards;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Stagger animation for grid items */
        .grid > * {
          animation: slideInUp 0.6s ease-out forwards;
          animation-delay: calc(var(--animation-order) * 0.1s);
        }
      `}</style>
    </div>
  )
}


