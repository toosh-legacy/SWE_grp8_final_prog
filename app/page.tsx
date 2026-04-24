export default function Home() {
  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Campus Connect - Study Groups</h1>
      <p>Welcome to the Study Groups API</p>
      <h2>Available Endpoints:</h2>
      <ul>
        <li><strong>GET /api/groups</strong> — Retrieve all study groups</li>
        <li><strong>POST /api/groups</strong> — Create a new study group</li>
      </ul>
      <h2>Try it out:</h2>
      <p>Use tools like Postman, curl, or fetch to test the API endpoints above.</p>
    </main>
  )
}
