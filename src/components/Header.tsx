import React from 'react'
import { ModeToggle } from './ModeToggle';
import Link from 'next/link';

function Header() {
  return (
    <header className='fixed p-5 flex items-center justify-end'>
      <div className="right flex items-center gap-4">
        <ModeToggle />
      </div>
    </header>
  )
}

export default Header