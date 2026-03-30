import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Ticket, Menu, X, Shield } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className='min-h-screen bg-gray-950'>
      {/* Header */}
      <header className='bg-black shadow-sm border-b border-gray-800'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <Link
              to='/classes'
              className='flex items-center gap-2'
            >
              <div className='w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>D</span>
              </div>
              <span className='font-bold text-xl text-gray-100'>
                Poled Dance Fit Talavera
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className='hidden md:flex items-center gap-6'>
              <Link
                to='/classes'
                className='flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors'
              >
                <Calendar className='w-5 h-5' />
                Clases
              </Link>
              <Link
                to='/packages'
                className='flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors'
              >
                <Ticket className='w-5 h-5' />
                Comprar Créditos
              </Link>
              <Link
                to='/my-reservations'
                className='flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors'
              >
                <User className='w-5 h-5' />
                Mis Reservas
              </Link>
              <Link
                to='/admin'
                className='flex items-center gap-2 text-gray-300 hover:text-primary-400 transition-colors'
              >
                <Shield className='w-5 h-5' />
                Admin
              </Link>
            </nav>

            {/* Mobile Burger Button */}
            <button
              className='md:hidden p-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors'
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label='Toggle menu'
            >
              {menuOpen ? (
                <X className='w-6 h-6' />
              ) : (
                <Menu className='w-6 h-6' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className='md:hidden border-t border-gray-800 bg-black'>
            <div className='px-4 py-3 space-y-1'>
              <Link
                to='/classes'
                onClick={() => setMenuOpen(false)}
                className='flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-primary-400 transition-colors'
              >
                <Calendar className='w-5 h-5' />
                Clases
              </Link>
              <Link
                to='/packages'
                onClick={() => setMenuOpen(false)}
                className='flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-primary-400 transition-colors'
              >
                <Ticket className='w-5 h-5' />
                Comprar Créditos
              </Link>
              <Link
                to='/my-reservations'
                onClick={() => setMenuOpen(false)}
                className='flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-primary-400 transition-colors'
              >
                <User className='w-5 h-5' />
                Mis Reservas
              </Link>
              <Link
                to='/admin'
                onClick={() => setMenuOpen(false)}
                className='flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-primary-400 transition-colors'
              >
                <Shield className='w-5 h-5' />
                Admin
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {children}
      </main>

      {/* Footer */}
      <footer className='bg-black border-t border-gray-800 mt-auto'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <p className='text-center text-gray-500 text-sm'>
            © 2026 Poled Dance Fit Talavera. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
