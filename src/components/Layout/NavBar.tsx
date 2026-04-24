import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Menu, X, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import S from '@/lib/strings';
import UI from '@/lib/styles';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout, appUser } = useAuth();

  return (
    <header className='bg-ui-header shadow-sm border-b border-ui-border-soft'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Left: Logo + Admin */}
          <div className='flex items-center gap-6'>
            <Link
              to='/classes'
              className='flex items-center gap-2'
            >
              <div className={UI.header.logoMark}>
                <span className='text-white font-bold text-xl'>D</span>
              </div>
              <span className={UI.header.logoText}>{S.app.name}</span>
            </Link>
            {appUser && 'role' in appUser && appUser.role === 'admin' && (
              <Link
                to='/admin'
                className={`hidden md:flex items-center gap-2 ${UI.nav.linkInactive}`}
              >
                <Shield className='w-5 h-5' />
                {S.nav.admin}
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center gap-6'>
            {/* {appUser && appUser.name !== '' && (
                        <span className='text-gray-300'>Hola, {appUser.name}</span>
                    )} */}
            <Link
              to='/classes'
              className={`flex items-center gap-2 ${UI.nav.linkInactive}`}
            >
              <Calendar className='w-5 h-5' />
              {S.nav.classes}
            </Link>
            <Link
              to='/my-reservations'
              className={`flex items-center gap-2 ${UI.nav.linkInactive}`}
            >
              <User className='w-5 h-5' />
              {S.nav.myReservations}
            </Link>

            <button
              onClick={logout}
              className={`flex items-center gap-2 ${UI.nav.linkInactive}`}
            >
              <LogOut className='w-5 h-5' />
            </button>
          </nav>

          {/* Mobile Burger Button */}
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
        <nav className='md:hidden border-t border-ui-border-soft bg-ui-header'>
          <div className='px-4 py-3 space-y-1'>
            <Link
              to='/classes'
              onClick={() => setMenuOpen(false)}
              className='flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-ui-input hover:text-primary-400 transition-colors'
            >
              <Calendar className='w-5 h-5' />
              {S.nav.classes}
            </Link>

            <Link
              to='/my-reservations'
              onClick={() => setMenuOpen(false)}
              className='flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-ui-input hover:text-primary-400 transition-colors'
            >
              <User className='w-5 h-5' />
              {S.nav.myReservations}
            </Link>
            {appUser && 'role' in appUser && appUser.role === 'admin' && (
              <Link
                to='/admin'
                onClick={() => setMenuOpen(false)}
                className='flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-ui-input hover:text-primary-400 transition-colors'
              >
                <Shield className='w-5 h-5' />
                {S.nav.admin}
              </Link>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className='w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-ui-input hover:text-primary-400 transition-colors'
            >
              <LogOut className='w-5 h-5' />
              {S.nav.logout}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
