import { useAuthStore } from '@/stores/useAuthStore'

import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { LogOut } from 'lucide-react'

const Logout = () => {
    const { signOut } = useAuthStore()

    const navigate= useNavigate()
    const handleLogOut = async () => {
        
        try {
            await signOut();
            navigate('/signIn')
        } catch (error) {
         console.log(error);
            
        }

    }
  return (
      <div>
          
          <Button
              onClick={handleLogOut}
              variant="completeGhost"
          >
              <LogOut className='text-destructive' />
               
          </Button>
    </div>
  )
}

export default Logout