import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <section className="text-center py-20">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-6">Organize and Join Events Effortlessly</h1>
      <p className="text-lg text-gray-600 mb-10">Eventify helps you create, manage, and discover events with ease.</p>
      <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded text-lg">Get Started</Link>
    </section>
  )
}


