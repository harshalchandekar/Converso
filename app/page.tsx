import CompanionCard from '@/components/CompanionCard'
import CompanionList from '@/components/CompanionList'
import CTA from '@/components/CTA'
import { Button } from '@/components/ui/button'


const Page = () => {
  return (
   <main>
    <h1>Popular Comapanions</h1>
    <section className='home-section'>
      <CompanionCard
      id="123"
      name="Neura the Brainy Explorer"
      topic="Neural Network of the Brain"
      subject="science"
      duration={45}
      color="#ffda6e"
       />
       <CompanionCard
      id="456"
      name="Neura the Brainy Explorer"
      topic="Neural Network of the Brain"
      subject="science"
      duration={45}
      color="#gh350fe"
       />
        <CompanionCard
      id="789"
      name="Contsy the number Wizard"
      topic="Derivatives & Integrals"
      subject="Maths"
      duration={30}
      color="#e5d0ff"
       />
    </section>
    <section className='home-section'>
      <CompanionList />
      <CTA />
    </section>
   </main>
  )
}

export default Page