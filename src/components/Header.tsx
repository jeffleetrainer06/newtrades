import { Car, Share2 } from 'lucide-react'
import { Link } from './Link'

interface HeaderProps {
  isAdmin?: boolean
}

export function Header({ isAdmin = false }: HeaderProps) {
  const shareApp = () => {
    const url = window.location.origin
    const text = `Check out our pre-owned vehicle inventory at Pedersen Toyota`
    
    if (navigator.share) {
      navigator.share({
        title: 'Pedersen Toyota - Pre-Owned Vehicles',
        text: text,
        url: url
      }).catch(console.error)
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!\n\nYou can now paste this link in a text message to send to customers. The link will work on any phone or computer.')
      }).catch(() => {
        // Final fallback
        const message = `Copy this link to share with customers:\n\n${url}\n\nThis link works on any phone or computer and shows our current pre-owned inventory.`
        prompt('Share this link with customers:', url)
      })
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center space-x-3">
            <Car className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Pedersen Toyota</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Pre-Owned Vehicles</p>
            </div>
          </Link>
          
          <nav className="flex space-x-2 sm:space-x-6">
            <Link href="/" className="text-gray-700 hover:text-red-600 font-medium text-sm sm:text-base">
              Available Vehicles
            </Link>
            <Link href="/upload" className="text-gray-700 hover:text-red-600 font-medium text-sm sm:text-base">
              Upload Photos
            </Link>
            <button
              onClick={shareApp}
              className="text-gray-700 hover:text-red-600 font-medium text-sm sm:text-base flex items-center"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </button>
            {isAdmin && (
              <Link href="/admin" className="text-red-600 hover:text-red-700 font-medium text-sm sm:text-base">
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>
      </div>
      
      {/* Mobile URL Helper */}
      <div className="sm:hidden bg-blue-50 px-4 py-2 text-center">
        <p className="text-xs text-blue-700">
          📱 Mobile Tip: Bookmark this page or add to home screen for easy access
        </p>
      </div>
    </header>
  )
}
