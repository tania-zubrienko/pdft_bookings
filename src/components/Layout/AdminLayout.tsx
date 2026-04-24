import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Menu,
  X,
  ArrowLeft,
  Coins,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import S from '@/lib/strings';
import UI from '@/styles';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminLinks = [
  { to: '/admin/schedule', label: S.nav.schedule, icon: CalendarDays },
  { to: '/admin/reservations', label: S.nav.reserves, icon: ClipboardList },
  { to: '/admin/credits', label: S.nav.credits, icon: Coins },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className='min-h-screen bg-ui-page'>
      {/* Header */}
      <header className='bg-ui-header shadow-sm border-b border-ui-border'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <div className='flex items-center gap-4'>
              <Link
                to='/admin/schedule'
                className='flex items-center gap-2'
              >
                <div className='w-10 h-10 bg-brand rounded-lg flex items-center justify-center'>
                  <span className='text-white font-bold text-xl'>D</span>
                </div>
                <div className='flex flex-col'>
                  <span className='font-bold text-lg text-white leading-tight'>
                    Pole Dance Fit Talavera
                  </span>
                  <span className='text-xs text-gray-400 leading-tight'>
                    {S.nav.admin}
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
                    className={`flex items-center gap-2 transition-colors ${
                      isActive ? UI.nav.linkActive : UI.nav.linkInactive
                    }`}
                  >
                    <link.icon className='w-5 h-5' />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to='/classes'
                className={`flex items-center gap-2 ${UI.nav.linkInactive} ml-4 border-l border-ui-border pl-4`}
              >
                <ArrowLeft className='w-4 h-4' />
                {S.nav.alumni}
              </Link>
              <button
                onClick={logout}
                className={`flex items-center gap-2 ${UI.nav.linkInactive} ml-4`}
              >
                <LogOut className='w-4 h-4' />
              </button>
            </nav>

            {/* Mobile Burger */}
            <button
              className={`md:hidden ${UI.button.icon}`}
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
          <nav className='md:hidden border-t border-ui-border bg-ui-header'>
            <div className='px-4 py-3 space-y-1'>
              {adminLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-ui-input text-primary-400 font-medium'
                        : 'text-gray-300 hover:bg-ui-input hover:text-primary-400'
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
                className='flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-ui-input hover:text-white transition-colors border-t border-ui-border mt-2 pt-4'
              >
                <ArrowLeft className='w-5 h-5' />
                {S.nav.alumni}
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className='w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-ui-input hover:text-white transition-colors'
              >
                <LogOut className='w-5 h-5' />
                Salir
              </button>
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
