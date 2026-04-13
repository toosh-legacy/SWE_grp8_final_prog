import { Navigate, Route, Routes } from 'react-router-dom';
import LoginForm from './LoginForm';
import LogoutForm from './LogoutForm';

function HomePage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Campus Connect</h1>
      <p>Home page placeholder.</p>
      <p>
        Visit <a href="/login">/login</a> or <a href="/logout">/logout</a>.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/logout" element={<LogoutForm />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
