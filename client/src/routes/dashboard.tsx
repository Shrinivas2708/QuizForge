import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BACKEND_URL } from '../utils/exports';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})


 function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/users/me`, {
      method: "GET",
      credentials: "include", // 👈 important
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(setUser)
      .catch((err) => console.error("Error fetching user:", err));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {user ? <pre>{JSON.stringify(user, null, 2)}</pre> : <p>Loading...</p>}
    </div>
  );
}
