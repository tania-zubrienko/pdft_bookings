import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Menu,
  X,
  ArrowLeft,
  Coins,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminLinks = [
  { to: '/admin/schedule', label: 'Horarios', icon: CalendarDays },
  { to: '/admin/reservations', label: 'Reservas', icon: ClipboardList },
  { to: '/admin/credits', label: 'Créditos', icon: Coins },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-gray-900 shadow-sm border-b border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <div className='flex items-center gap-4'>
              <Link
                to='/admin/schedule'
                className='flex items-center gap-2'
              >
                <div className='w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center'>
                  <span className='text-white font-bold text-xl'>D</span>
                </div>
                <div className='flex flex-col'>
                  <span className='font-bold text-lg text-white leading-tight'>
                    Poled Dance Fit Talavera
                  </span>
                  <span className='text-xs text-gray-400 leading-tight'>
                    Panel de Admin
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className='hidden md:flex items-center gap-6'>
              {adminLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 transition-colors ${isActive
                        ? 'text-primary-400 font-medium'
                        : 'text-gray-300 hover:text-primary-400'
                      }`}
                  >
                    <link.icon className='w-5 h-5' />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to='/classes'
                className='flex items-center gap-2 text-gray-400 hover:text-white transition-colors ml-4 border-l border-gray-700 pl-4'
              >
                <ArrowLeft className='w-4 h-4' />
                Vista Alumna
              </Link>
            </nav>

            {/* Mobile Burger */}
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
          <nav className='md:hidden border-t border-gray-700 bg-gray-900'>
            <div className='px-4 py-3 space-y-1'>
              {adminLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive
                        ? 'bg-gray-800 text-primary-400 font-medium'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-primary-400'
                      }`}
                  >
                    <link.icon className='w-5 h-5' />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to='/classes'
                onClick={() => setMenuOpen(false)}
                className='flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors border-t border-gray-700 mt-2 pt-4'
              >
                <ArrowLeft className='w-5 h-5' />
                Vista Alumna
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {children}
      </main>
    </div>
  );
}
