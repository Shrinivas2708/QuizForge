import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { BACKEND_URL } from '../utils/exports'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  // const [data,setData] = useState()
  useEffect(()=>{
   async function fetchData(){
     fetch(`${BACKEND_URL}/users/me`).then(res => res.json()).then(res => console.log(res))
    }
    fetchData()
  },[])
  return <div>Hello "/dashboard"!</div>
}
