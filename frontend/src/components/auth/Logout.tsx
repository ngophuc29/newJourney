import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@base-ui/react/button'
import React from 'react'
import { useNavigate } from 'react-router'

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
          >
              Logout
          </Button>
    </div>
  )
}

export default Logout