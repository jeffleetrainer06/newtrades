interface LinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Link({ href, children, className = '', onClick }: LinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onClick) {
      onClick()
    }
    window.location.hash = href
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
