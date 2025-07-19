import React from 'react'
import { Icon } from '@iconify/react/dist/iconify.js'
import SearchBar from '@/components/SearchBar'

function page() {
  return (
    <section className='w-full h-screen center'>
      <div className='center flex-col'>
        <div className='center flex-col mb-8'>
          <div className="flex items-center gap-3 mb-8">
            <Icon icon="eos-icons:network" className='size-14' />
            <h1 className='text-4xl font-bold'>SearchFy</h1>
          </div>

          <p className='dark:text-white/50 max-w-2/3 text-center text-md'>Veja as metricas do seu artista
            favorito ou descubra os mais estourados do momento</p>
        </div>
        <SearchBar/>
      </div>
    </section>
  )
}

export default page