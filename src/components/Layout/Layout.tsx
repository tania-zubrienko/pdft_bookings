import NavBar from './NavBar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className='min-h-screen bg-ui-page'>
      {/* Header */}
      <NavBar />

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {children}
      </main>

      {/* Footer */}
      <footer className='bg-ui-header border-t border-ui-border-soft mt-auto'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <p className='text-center text-ui-text-soft	 text-sm'>
            © 2026 Pole Dance Fit Talavera. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
