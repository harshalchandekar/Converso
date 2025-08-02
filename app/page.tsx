import CompanionCard from '@/components/CompanionCard'
import CompanionList from '@/components/CompanionList'
import CTA from '@/components/CTA'
import { Button } from '@/components/ui/button'
import { recentSessions } from '@/constants'
import { getAllCompanions, getRecentSessions } from '@/lib/actions/companion.actions'
import { getSubjectColor } from '@/lib/utils'


const Page = async () => {

const companions = await getAllCompanions({limit: 3});
const recentSessionsCompanions = await getRecentSessions({ limit: 10 });

  return (
   <main>
    <h1>Popular Comapanions</h1>
    <section className='home-section'>
      {companions.map((companion) => (
        <CompanionCard 
         key={companion.id}
         {...companion}
         color={getSubjectColor(companion.subject)}
         />
      ))}
      
    </section>
    
    <section className='home-section'>
      <CompanionList
      title="Recently Completed sessions"
      companions={recentSessionsCompanions}
      classNames="w-2/3 max-lg:w-full"
      />
      <CTA />
    </section>
   </main>
  )
}

export default Page;